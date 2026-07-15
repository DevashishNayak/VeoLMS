import { afterEach, beforeEach, describe, expect, it } from "vitest";
import crypto from "crypto";
import {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay";

describe("Razorpay payment signatures", () => {
  const prevKey = process.env.RAZORPAY_KEY_SECRET;
  const prevHook = process.env.RAZORPAY_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret_abc";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test_xyz";
  });

  afterEach(() => {
    process.env.RAZORPAY_KEY_SECRET = prevKey;
    process.env.RAZORPAY_WEBHOOK_SECRET = prevHook;
  });

  it("accepts valid checkout signatures and rejects tampering", () => {
    const orderId = "order_ABC";
    const paymentId = "pay_XYZ";
    const signature = crypto
      .createHmac("sha256", "rzp_test_secret_abc")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(verifyRazorpaySignature(orderId, paymentId, signature)).toBe(true);
    expect(verifyRazorpaySignature(orderId, paymentId, "deadbeef")).toBe(false);
    expect(verifyRazorpaySignature(orderId, "pay_OTHER", signature)).toBe(false);
  });

  it("verifies webhook HMAC over the raw body", () => {
    const body = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { order_id: "order_1" } } },
    });
    const signature = crypto
      .createHmac("sha256", "whsec_test_xyz")
      .update(body)
      .digest("hex");

    expect(verifyRazorpayWebhookSignature(body, signature)).toBe(true);
    expect(verifyRazorpayWebhookSignature(body, "nope")).toBe(false);
    expect(verifyRazorpayWebhookSignature("", signature)).toBe(false);
  });
});
