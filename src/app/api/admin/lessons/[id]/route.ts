import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lessonSchema } from "@/lib/validations";
import { normalizeVideoInput } from "@/lib/media-src";
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

  const {
    resources,
    videoProvider,
    videoSrc,
    content,
    pdfUrl,
    description,
    ...rest
  } = parsed.data;

  const data: Record<string, unknown> = {
    ...rest,
    content: content === "" ? null : content,
    pdfUrl: pdfUrl === "" ? null : pdfUrl,
    description: description === "" ? null : description,
  };

  if (rest.type === "VIDEO" || videoProvider !== undefined || videoSrc !== undefined) {
    if (rest.type && rest.type !== "VIDEO") {
      data.videoProvider = null;
      data.videoSrc = null;
    } else {
      const normalized = normalizeVideoInput({
        provider: (videoProvider as "YOUTUBE" | "VIMEO" | "FILE" | "") || null,
        src: videoSrc,
      });
      if (!normalized) {
        return NextResponse.json(
          { error: "Add a video: provider + id/URL" },
          { status: 400 }
        );
      }
      data.videoProvider = normalized.videoProvider;
      data.videoSrc = normalized.videoSrc;
    }
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
