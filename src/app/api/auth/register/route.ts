import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import {
  generateOtpCode,
  hashOtp,
  otpConfigured,
  otpExpiryDate,
  sendSignupOtpEmail,
} from "@/lib/email-otp";

/**
 * Start signup: validate inputs, email OTP, store pending challenge.
 * Account is created only after /api/auth/register/verify.
 */
export async function POST(request: Request) {
  try {
    if (!otpConfigured()) {
      return NextResponse.json(
        {
          error:
            "Email verification is not configured. Set GMAIL_USER + GMAIL_APP_PASSWORD (recommended without a domain), or RESEND_API_KEY.",
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const genericOk = {
      ok: true as const,
      requiresVerification: true,
      email,
      message:
        "If this email can be used, a verification code was sent. Check your inbox.",
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Soft response — do not reveal that the email is already registered
      return NextResponse.json(genericOk);
    }

    // Basic resend throttle: one active challenge per email every 60s
    const recent = await prisma.emailOtpChallenge.findFirst({
      where: {
        email,
        createdAt: { gt: new Date(Date.now() - 60_000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      return NextResponse.json(
        { error: "Please wait a minute before requesting another code" },
        { status: 429 }
      );
    }

    const code = generateOtpCode();
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.emailOtpChallenge.deleteMany({ where: { email } });
    await prisma.emailOtpChallenge.create({
      data: {
        email,
        name: parsed.data.name.trim(),
        passwordHash,
        codeHash: hashOtp(code, email),
        expiresAt: otpExpiryDate(),
      },
    });

    await sendSignupOtpEmail({
      email,
      name: parsed.data.name.trim(),
      code,
    });

    return NextResponse.json(genericOk);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to start registration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
