import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lessonSchema } from "@/lib/validations";
import { forbidden, requireAdminSession } from "@/lib/admin-auth";
import { z } from "zod";

const updateLessonSchema = lessonSchema.partial().extend({
  sectionId: z.string().cuid().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const { id } = await params;
  const body = await request.json();
  // Prefer full schema when type-bearing payload is sent (admin forms send complete lesson)
  const full = lessonSchema.safeParse(body);
  const parsed = full.success
    ? full
    : updateLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const data = { ...parsed.data } as Record<string, unknown>;
  for (const key of ["youtubeId", "videoUrl", "content", "pdfUrl", "description"] as const) {
    if (key in data && data[key] === "") data[key] = null;
  }

  const lesson = await prisma.lesson.update({
    where: { id },
    data,
  });
  return NextResponse.json({ lesson });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const { id } = await params;
  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
