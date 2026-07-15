import { prisma } from "@/lib/prisma";

/**
 * Mark a PENDING payment completed and ensure Enrollment exists.
 * Safe to call from Checkout verify handler or Razorpay webhooks.
 */
export async function fulfillPaidEnrollment(opts: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
  /** When set, payment must belong to this user (Checkout client verify). */
  userId?: string;
  courseId?: string;
}) {
  const payment = await prisma.payment.findFirst({
    where: {
      razorpayOrderId: opts.razorpayOrderId,
      status: "PENDING",
      ...(opts.userId ? { userId: opts.userId } : {}),
      ...(opts.courseId ? { courseId: opts.courseId } : {}),
    },
  });

  if (!payment) {
    // Already completed or unknown — idempotent success for webhooks
    const existing = await prisma.payment.findUnique({
      where: { razorpayOrderId: opts.razorpayOrderId },
    });
    if (existing?.status === "COMPLETED") {
      return { ok: true as const, alreadyCompleted: true, payment: existing };
    }
    return { ok: false as const, reason: "not_found" as const };
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        razorpayPaymentId: opts.razorpayPaymentId,
        ...(opts.razorpaySignature
          ? { razorpaySignature: opts.razorpaySignature }
          : {}),
      },
    }),
    prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: payment.userId,
          courseId: payment.courseId,
        },
      },
      create: {
        userId: payment.userId,
        courseId: payment.courseId,
      },
      update: {},
    }),
  ]);

  return { ok: true as const, alreadyCompleted: false, payment };
}
