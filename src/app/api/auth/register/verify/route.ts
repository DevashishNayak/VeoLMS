import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { MAX_ATTEMPTS, verifyOtpHash } from "@/lib/email-otp";

const verifySchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
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

    if (challenge.expiresAt.getTime() < Date.now()) {
      await prisma.emailOtpChallenge.delete({ where: { id: challenge.id } });
      return NextResponse.json(
        { error: "Code expired. Request a new one." },
        { status: 400 }
      );
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      await prisma.emailOtpChallenge.delete({ where: { id: challenge.id } });
      return NextResponse.json(
        { error: "Too many attempts. Start signup again." },
        { status: 429 }
      );
    }

    const ok = verifyOtpHash(parsed.data.code, email, challenge.codeHash);
    if (!ok) {
      await prisma.emailOtpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.emailOtpChallenge.deleteMany({ where: { email } });
      return NextResponse.json(
        {
          error:
            "Unable to create this account. Try signing in, or use a different email.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: challenge.name,
        passwordHash: challenge.passwordHash,
        role: "STUDENT",
        emailVerifiedAt: new Date(),
      },
      select: { id: true, email: true, name: true },
    });

    await prisma.emailOtpChallenge.deleteMany({ where: { email } });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
