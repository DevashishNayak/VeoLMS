import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/access";
import { reviewSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review" },
      { status: 400 }
    );
  }

  const { courseId, rating, comment } = parsed.data;
  const enrolled = await isEnrolled(session.user.id, courseId);
  if (!enrolled) {
    return NextResponse.json(
      { error: "Enroll in the course before leaving a review" },
      { status: 403 }
    );
  }

  const review = await prisma.courseReview.upsert({
    where: {
      courseId_userId: { courseId, userId: session.user.id },
    },
    create: {
      courseId,
      userId: session.user.id,
      rating,
      comment: comment?.trim() || null,
    },
    update: {
      rating,
      comment: comment?.trim() || null,
    },
  });

  return NextResponse.json({ review }, { status: 201 });
}
