import { prisma } from "@/lib/prisma";

export async function isEnrolled(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return !!enrollment;
}

/**
 * Pure access policy (unit-tested). Preview → anyone; paid → enrolled or staff.
 */
export function resolveLessonAccess(opts: {
  isPreview: boolean;
  userId?: string;
  role?: "ADMIN" | "INSTRUCTOR" | "STUDENT" | null;
  instructorId: string;
  enrolled: boolean;
}): boolean {
  if (opts.isPreview) return true;
  if (!opts.userId || !opts.role) return false;
  if (opts.role === "ADMIN") return true;
  if (opts.role === "INSTRUCTOR" && opts.instructorId === opts.userId) {
    return true;
  }
  return opts.enrolled;
}

/**
 * Preview lessons (`isPreview`) are free for anyone (even anonymous).
 * Paid lessons require an enrollment for that course.
 * Admins / course instructors may always access for QA.
 */
export async function canAccessLesson(
  userId: string | undefined,
  lessonId: string
): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        select: {
          courseId: true,
          course: { select: { instructorId: true } },
        },
      },
    },
  });
  if (!lesson) return false;
  if (lesson.isPreview) return true;

  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;

  // Staff bypass without an enrollment round-trip when possible.
  if (user.role === "ADMIN") return true;
  const isCourseInstructor =
    String(user.role) === "INSTRUCTOR" &&
    lesson.section.course.instructorId === userId;
  if (isCourseInstructor) return true;

  const enrolled = await isEnrolled(userId, lesson.section.courseId);
  return resolveLessonAccess({
    isPreview: false,
    userId,
    role: user.role as "ADMIN" | "INSTRUCTOR" | "STUDENT",
    instructorId: lesson.section.course.instructorId,
    enrolled,
  });
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
