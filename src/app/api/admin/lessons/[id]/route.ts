import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lessonSchema } from "@/lib/validations";
import {
  assertCanManageLesson,
  assertCanManageSection,
  forbidden,
  requireStaffSession,
} from "@/lib/admin-auth";
import { z } from "zod";

const updateLessonBody = lessonSchema.and(
  z.object({
    sectionId: z.string().cuid().optional(),
  })
);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const { id } = await params;
  if (!(await assertCanManageLesson(session, id)).ok) return forbidden();

  const body = await request.json();
  const parsed = updateLessonBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  if (parsed.data.sectionId) {
    if (!(await assertCanManageSection(session, parsed.data.sectionId)).ok) {
      return forbidden();
    }
  }

  const data = { ...parsed.data } as Record<string, unknown>;
  const resources = data.resources as
    | { title: string; url: string; mimeType?: string | null }[]
    | undefined;
  delete data.resources;

  for (const key of ["youtubeId", "videoUrl", "content", "pdfUrl", "description"] as const) {
    if (key in data && data[key] === "") data[key] = null;
  }

  try {
    const lesson = await prisma.$transaction(async (tx) => {
      if (resources) {
        await tx.lessonResource.deleteMany({ where: { lessonId: id } });
        if (resources.length) {
          await tx.lessonResource.createMany({
            data: resources.map((r, i) => ({
              lessonId: id,
              title: r.title,
              url: r.url,
              mimeType: r.mimeType ?? null,
              order: i,
            })),
          });
        }
      }
      return tx.lesson.update({
        where: { id },
        data,
        include: { resources: { orderBy: { order: "asc" } } },
      });
    });
    return NextResponse.json({ lesson });
  } catch (e) {
    console.error("Update lesson error:", e);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const { id } = await params;
  if (!(await assertCanManageLesson(session, id)).ok) return forbidden();

  await prisma.lesson.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
