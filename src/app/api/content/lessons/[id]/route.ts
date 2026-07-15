import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessLesson } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { lessonContentSelect } from "@/lib/lesson-payload";
import { withSignedLessonMedia } from "@/lib/signed-media";

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

  const media = withSignedLessonMedia({
    id: lesson.id,
    videoProvider: lesson.videoProvider,
    videoSrc: lesson.videoSrc,
    pdfUrl: lesson.pdfUrl,
    resources: lesson.resources,
  });

  return NextResponse.json({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      videoProvider: media.videoProvider,
      videoSrc: media.videoSrc,
      content: lesson.content,
      pdfUrl: media.pdfUrl,
      duration: lesson.duration,
      order: lesson.order,
      isPreview: lesson.isPreview,
      sectionId: lesson.sectionId,
      resources: media.resources,
      sectionTitle: lesson.section.title,
      courseSlug: lesson.section.course.slug,
      courseTitle: lesson.section.course.title,
    },
  });
}
