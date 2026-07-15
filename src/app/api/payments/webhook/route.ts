import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { fulfillPaidEnrollment } from "@/lib/payment-fulfillment";

/**
 * Razorpay webhook failsafe — enrolls even if Checkout client never hits /verify.
 *
 * Dashboard setup:
 * 1. Razorpay → Settings → Webhooks → Add
 * 2. URL: https://YOUR_DOMAIN/api/payments/webhook
 * 3. Events: payment.captured (and optionally payment.failed)
 * 4. Set RAZORPAY_WEBHOOK_SECRET to the webhook signing secret
 *    (falls back to RAZORPAY_KEY_SECRET if unset — not ideal for production)
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = event.event ?? "";

  if (name === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    if (!orderId || !paymentId) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const result = await fulfillPaidEnrollment({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: `webhook:${name}`,
    });

    return NextResponse.json({
      ok: result.ok,
      alreadyCompleted: result.ok ? result.alreadyCompleted : false,
    });
  }

  // Acknowledge other events so Razorpay does not retry endlessly
  return NextResponse.json({ ok: true, ignored: name || "unknown" });
}
