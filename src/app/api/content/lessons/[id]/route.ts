import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessLesson } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { lessonContentSelect } from "@/lib/lesson-payload";

/**
 * Authorized lesson media. Preview → anyone; paid → enrolled (or staff).
 * Never returns videoSrc / content / pdfUrl / resources when locked.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const allowed = await canAccessLesson(session?.user?.id, id);

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: {
      ...lessonContentSelect,
      section: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              published: true,
            },
          },
        },
      },
    },
  });

  if (!lesson || !lesson.section.course.published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Enrollment required",
        code: "LOCKED",
        lesson: {
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
          order: lesson.order,
          isPreview: lesson.isPreview,
          sectionId: lesson.sectionId,
          courseSlug: lesson.section.course.slug,
        },
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      videoProvider: lesson.videoProvider,
      videoSrc: lesson.videoSrc,
      content: lesson.content,
      pdfUrl: lesson.pdfUrl,
      duration: lesson.duration,
      order: lesson.order,
      isPreview: lesson.isPreview,
      sectionId: lesson.sectionId,
      resources: lesson.resources,
      sectionTitle: lesson.section.title,
      courseSlug: lesson.section.course.slug,
      courseTitle: lesson.section.course.title,
    },
  });
}
