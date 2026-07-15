import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessLesson, getCourseProgress } from "@/lib/access";
import { LessonContentView } from "@/components/learn/lesson-content-view";
import { LearnSidebar } from "@/components/learn/learn-sidebar";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}

export default async function LearnPage({ params }: PageProps) {
  const { courseSlug, lessonId } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  // Curriculum metadata only — never load other lessons' media into the RSC tree.
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug, published: true },
    select: {
      id: true,
      title: true,
      slug: true,
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
  });
  if (!course) notFound();

  const allLessons = course.sections.flatMap((s) => s.lessons);
  const lessonMeta = allLessons.find((l) => l.id === lessonId);
  if (!lessonMeta) notFound();

  const allowed = await canAccessLesson(userId, lessonId);
  if (!allowed) {
    if (!userId) {
      redirect(
        `/login?callbackUrl=${encodeURIComponent(`/learn/${courseSlug}/${lessonId}`)}`
      );
    }
    redirect(`/courses/${courseSlug}`);
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { resources: { orderBy: { order: "asc" } } },
  });
  if (!lesson) notFound();

  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx >= 0 && currentIdx < allLessons.length - 1
      ? allLessons[currentIdx + 1]
      : null;

  const accessFlags = await Promise.all(
    allLessons.map(async (l) => ({
      id: l.id,
      allowed: await canAccessLesson(userId, l.id),
    }))
  );
  const accessibleIds = accessFlags.filter((x) => x.allowed).map((x) => x.id);

  let progress = null;
  let completedIds: string[] = [];
  let courseProgress = 0;
  if (userId) {
    const [progressRow, completedRows, pct] = await Promise.all([
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
    ]);
    progress = progressRow;
    completedIds = completedRows.map((p) => p.lessonId);
    courseProgress = pct;
  }

  const sectionTitle =
    course.sections.find((s) => s.lessons.some((l) => l.id === lessonId))
      ?.title ?? "";

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href={`/courses/${courseSlug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {course.title}
          </Link>
          <span className="hidden text-muted-foreground sm:inline">/</span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {sectionTitle}
          </span>
          <span className="text-xs text-muted-foreground">
            Lecture {currentIdx + 1} of {allLessons.length}
          </span>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-0 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 px-4 py-4 sm:px-6">
          <LessonContentView
            lessonId={lesson.id}
            type={lesson.type ?? "VIDEO"}
            title={lesson.title}
            videoProvider={lesson.videoProvider}
            videoSrc={lesson.videoSrc}
            content={lesson.content}
            pdfUrl={lesson.pdfUrl}
            initialProgress={progress?.watchedSeconds ?? 0}
            initiallyCompleted={progress?.completed ?? false}
            resources={lesson.resources}
          />

          <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">{lesson.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {course.title}
                {lesson.description ? ` · ${lesson.description}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {prevLesson && accessibleIds.includes(prevLesson.id) ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/learn/${courseSlug}/${prevLesson.id}`}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
              {nextLesson && accessibleIds.includes(nextLesson.id) ? (
                <Button size="sm" asChild>
                  <Link href={`/learn/${courseSlug}/${nextLesson.id}`}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="sm" disabled>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="h-[min(80vh,900px)] border-t border-border lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:border-l lg:border-t-0">
          <LearnSidebar
            courseSlug={courseSlug}
            currentLessonId={lessonId}
            accessibleIds={accessibleIds}
            completedIds={completedIds}
            progressPercent={courseProgress}
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
          />
        </div>
      </div>
    </div>
  );
}
