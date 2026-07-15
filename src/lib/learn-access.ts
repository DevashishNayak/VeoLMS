import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/access";

/**
 * One round-trip access map for a course curriculum (avoids N× canAccessLesson).
 */
export async function getAccessibleLessonIds(
  userId: string | undefined,
  courseId: string,
  instructorId: string,
  lessons: { id: string; isPreview: boolean }[]
): Promise<string[]> {
  const previewIds = lessons.filter((l) => l.isPreview).map((l) => l.id);
  if (!userId) return previewIds;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return previewIds;

  if (user.role === "ADMIN") return lessons.map((l) => l.id);
  if (user.role === "INSTRUCTOR" && instructorId === userId) {
    return lessons.map((l) => l.id);
  }

  const enrolled = await isEnrolled(userId, courseId);
  if (enrolled) return lessons.map((l) => l.id);
  return previewIds;
}
