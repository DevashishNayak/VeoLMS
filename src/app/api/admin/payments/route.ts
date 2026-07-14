import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAdminSession } from "@/lib/admin-auth";
import { pageMeta, parseListQuery } from "@/lib/admin-query";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const updatePaymentSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
  razorpayPaymentId: z.string().min(1).optional().nullable(),
  razorpaySignature: z.string().min(1).optional().nullable(),
  amountInPaise: z.coerce.number().int().min(0).optional(),
});

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const url = new URL(request.url);
  const { page, pageSize, q, skip } = parseListQuery(url);
  const status = url.searchParams.get("status");

  const where: Prisma.PaymentWhereInput = {};
  if (status === "PENDING" || status === "COMPLETED" || status === "FAILED") {
    where.status = status;
  }
  if (q) {
    where.OR = [
      { razorpayOrderId: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { course: { title: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    payments,
    meta: pageMeta(total, page, pageSize),
  });
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const body = await request.json();
  const parsed = updatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const { id, ...data } = parsed.data;
  const payment = await prisma.payment.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ payment });
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.payment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
