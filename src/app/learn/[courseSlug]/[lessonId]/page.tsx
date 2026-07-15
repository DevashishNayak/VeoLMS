import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessLesson, getCourseProgress } from "@/lib/access";
import { getAccessibleLessonIds } from "@/lib/learn-access";
import { parseSidebarOpen, LEARN_SIDEBAR_COOKIE } from "@/lib/learn-sidebar-pref";
import { LearnWorkspace } from "@/components/learn/learn-workspace";

interface PageProps {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}

export default async function LearnPage({ params }: PageProps) {
  const { courseSlug, lessonId } = await params;

  // Auth + course shell in parallel — curriculum is cheap metadata, lesson is heavy.
  const [session, course] = await Promise.all([
    auth(),
    prisma.course.findUnique({
      where: { slug: courseSlug, published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        instructorId: true,
        sections: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                isPreview: true,
                order: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const userId = session?.user?.id;
  if (!course) notFound();

  const allLessons = course.sections.flatMap((s) => s.lessons);
  if (!allLessons.some((l) => l.id === lessonId)) notFound();

  const allowed = await canAccessLesson(userId, lessonId);
  if (!allowed) {
    if (!userId) {
      redirect(
        `/login?callbackUrl=${encodeURIComponent(`/learn/${courseSlug}/${lessonId}`)}`
      );
    }
    redirect(`/courses/${courseSlug}`);
  }

  // Lesson body + progress + access map concurrently after the gate check.
  const [lesson, accessibleIds, progressBundle] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { resources: { orderBy: { order: "asc" } } },
    }),
    getAccessibleLessonIds(
      userId,
      course.id,
      course.instructorId,
      allLessons.map((l) => ({ id: l.id, isPreview: l.isPreview }))
    ),
    userId
      ? Promise.all([
          prisma.lessonProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
          }),
          prisma.lessonProgress.findMany({
            where: {
              userId,
              lessonId: { in: allLessons.map((l) => l.id) },
              completed: true,
            },
            select: { lessonId: true },
          }),
          getCourseProgress(userId, course.id),
          prisma.courseReview.findUnique({
            where: { courseId_userId: { courseId: course.id, userId } },
            select: { rating: true },
          }),
        ])
      : Promise.resolve([null, [], 0, null] as const),
  ]);

  if (!lesson) notFound();

  const [progress, completedRows, courseProgress, review] = progressBundle;
  const completedIds = Array.isArray(completedRows)
    ? completedRows.map((p) => p.lessonId)
    : [];
  const userRating =
    review && typeof review === "object" && "rating" in review
      ? (review.rating as number)
      : null;

  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx >= 0 && currentIdx < allLessons.length - 1
      ? allLessons[currentIdx + 1]
      : null;

  const sectionTitle =
    course.sections.find((s) => s.lessons.some((l) => l.id === lessonId))
      ?.title ?? "";

  const cookieStore = await cookies();
  const initialSidebarOpen = parseSidebarOpen(
    cookieStore.get(LEARN_SIDEBAR_COOKIE)?.value
  );

  return (
    <LearnWorkspace
      initialSidebarOpen={initialSidebarOpen}
      courseId={course.id}
      courseSlug={course.slug}
      courseTitle={course.title}
      sectionTitle={sectionTitle}
      lessonId={lesson.id}
      lessonIndex={currentIdx}
      lessonTotal={allLessons.length}
      type={(lesson.type ?? "VIDEO") as "VIDEO" | "TEXT" | "PDF"}
      title={lesson.title}
      description={lesson.description}
      duration={lesson.duration}
      videoProvider={lesson.videoProvider}
      videoSrc={lesson.videoSrc}
      content={lesson.content}
      pdfUrl={lesson.pdfUrl}
      initialProgress={progress?.watchedSeconds ?? 0}
      initiallyCompleted={progress?.completed ?? false}
      resources={lesson.resources.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
      }))}
      sections={course.sections.map((s) => ({
        id: s.id,
        title: s.title,
        lessons: s.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type ?? "VIDEO",
          duration: l.duration,
          isPreview: l.isPreview,
        })),
      }))}
      accessibleIds={accessibleIds}
      completedIds={completedIds}
      progressPercent={typeof courseProgress === "number" ? courseProgress : 0}
      prevLesson={
        prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null
      }
      nextLesson={
        nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null
      }
      canMutateProgress={Boolean(userId)}
      userRating={userRating}
    />
  );
}
