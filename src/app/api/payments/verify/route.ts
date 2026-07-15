import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { fulfillPaidEnrollment } from "@/lib/payment-fulfillment";
import { paymentVerifySchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = paymentVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment data" }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } =
      parsed.data;

    const valid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    const result = await fulfillPaidEnrollment({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      userId: session.user.id,
      courseId,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Verify payment error:", e);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
