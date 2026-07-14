import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { registerSchema, loginSchema, paymentVerifySchema } from "@/lib/validations";

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "securepass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "not-an-email",
      password: "securepass123",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires email and password", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "x" }).success
    ).toBe(true);
  });
});

describe("paymentVerifySchema", () => {
  it("validates razorpay payment payload", () => {
    const result = paymentVerifySchema.safeParse({
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_456",
      razorpay_signature: "sig_789",
      courseId: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("razorpay signature verification", () => {
  function verify(orderId: string, paymentId: string, signature: string, secret: string) {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  it("verifies valid signatures", () => {
    const secret = "test_secret";
    const orderId = "order_abc";
    const paymentId = "pay_xyz";
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    expect(verify(orderId, paymentId, sig, secret)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    expect(verify("order_abc", "pay_xyz", "invalid", "test_secret")).toBe(false);
  });
});
