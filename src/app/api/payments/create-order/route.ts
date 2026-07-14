import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayInstance } from "@/lib/razorpay";
import { z } from "zod";

const createOrderSchema = z.object({
  courseId: z.string().cuid(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: parsed.data.courseId, published: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    if (course.priceInPaise === 0) {
      await prisma.$transaction([
        prisma.enrollment.create({
          data: { userId: session.user.id, courseId: course.id },
        }),
        prisma.payment.create({
          data: {
            userId: session.user.id,
            courseId: course.id,
            razorpayOrderId: `free_${course.id}_${session.user.id}`,
            amountInPaise: 0,
            status: "COMPLETED",
          },
        }),
      ]);
      return NextResponse.json({ free: true });
    }

    const razorpay = getRazorpayInstance();
    // Razorpay receipt max length is 40 characters
    const receipt = `c_${course.id.slice(-8)}_${Date.now().toString().slice(-8)}`;
    const order = await razorpay.orders.create({
      amount: course.priceInPaise,
      currency: "INR",
      receipt,
    });

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        courseId: course.id,
        razorpayOrderId: order.id,
        amountInPaise: course.priceInPaise,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID?.trim(),
    });
  } catch (e) {
    console.error("Create order error:", e);
    const razorpayError = e as {
      statusCode?: number;
      error?: { description?: string };
    };
    if (razorpayError.statusCode === 401) {
      return NextResponse.json(
        {
          error:
            "Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env (they must be a matching Key Id + Key Secret pair from Test mode).",
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
