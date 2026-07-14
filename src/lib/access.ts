import { prisma } from "@/lib/prisma";

export async function isEnrolled(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return !!enrollment;
}

export async function canAccessLesson(
  userId: string | undefined,
  lessonId: string
): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { select: { courseId: true } } },
  });
  if (!lesson) return false;
  if (lesson.isPreview) return true;
  if (!userId) return false;
  return isEnrolled(userId, lesson.section.courseId);
}

export async function getCourseProgress(userId: string, courseId: string) {
  const lessons = await prisma.lesson.findMany({
    where: { section: { courseId } },
    select: { id: true },
  });
  if (lessons.length === 0) return 0;

  const completed = await prisma.lessonProgress.count({
    where: {
      userId,
      lessonId: { in: lessons.map((l) => l.id) },
      completed: true,
    },
  });
  return Math.round((completed / lessons.length) * 100);
}
