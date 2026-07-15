import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  generateOtpCode,
  hashOtp,
  otpConfigured,
  otpExpiryDate,
  sendSignupOtpEmail,
} from "@/lib/email-otp";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    if (!otpConfigured()) {
      return NextResponse.json(
        { error: "Email verification is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const challenge = await prisma.emailOtpChallenge.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "No pending verification. Start signup again." },
        { status: 400 }
      );
    }

    if (challenge.createdAt.getTime() > Date.now() - 60_000) {
      return NextResponse.json(
        { error: "Please wait a minute before requesting another code" },
        { status: 429 }
      );
    }

    const code = generateOtpCode();
    await prisma.emailOtpChallenge.update({
      where: { id: challenge.id },
      data: {
        codeHash: hashOtp(code, email),
        expiresAt: otpExpiryDate(),
        attempts: 0,
        createdAt: new Date(),
      },
    });

    await sendSignupOtpEmail({
      email,
      name: challenge.name,
      code,
    });

    return NextResponse.json({ ok: true, message: "New code sent" });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to resend code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
