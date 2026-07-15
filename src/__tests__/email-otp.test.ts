import { describe, expect, it } from "vitest";
import { generateOtpCode, hashOtp, verifyOtpHash } from "@/lib/email-otp";

describe("email OTP", () => {
  it("generates a 6-digit numeric code", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("verifies OTP hashes in constant-time fashion", () => {
    const email = "learner@example.com";
    const code = "482913";
    const codeHash = hashOtp(code, email);

    expect(verifyOtpHash(code, email, codeHash)).toBe(true);
    expect(verifyOtpHash("000000", email, codeHash)).toBe(false);
    expect(verifyOtpHash(code, "other@example.com", codeHash)).toBe(false);
  });

  it("is case-insensitive on email for hashing", () => {
    const code = "111222";
    expect(hashOtp(code, "A@B.com")).toBe(hashOtp(code, "a@b.com"));
  });
});
