import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured");
  }
  if (!keyId.startsWith("rzp_test_") && !keyId.startsWith("rzp_live_")) {
    throw new Error("Invalid Razorpay key ID format");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function timingSafeHexEqual(expected: string, actual: string): boolean {
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(actual, "utf8");
    if (a.length === 0 || a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return timingSafeHexEqual(expected, signature);
}

/** Razorpay Dashboard webhook HMAC over the raw request body. */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret =
    process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ||
    process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return timingSafeHexEqual(expected, signature);
}
