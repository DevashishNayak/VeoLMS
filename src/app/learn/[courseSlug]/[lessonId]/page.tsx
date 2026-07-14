import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessLesson } from "@/lib/access";
import { formatDuration } from "@/lib/utils";
import { LessonPlayer } from "@/components/video/lesson-player";
import { CheckCircle, Lock, Play } from "lucide-react";

interface PageProps {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}

export default async function LearnPage({ params }: PageProps) {
  const { courseSlug, lessonId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  const lesson = course.sections
    .flatMap((s) => s.lessons)
    .find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const allowed = await canAccessLesson(session.user.id, lessonId);
  if (!allowed) redirect(`/courses/${courseSlug}`);

  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId: session.user.id, lessonId },
    },
  });

  const allLessons = course.sections.flatMap((s) =>
    s.lessons.map((l) => ({ ...l, sectionTitle: s.title }))
  );
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = allLessons[currentIdx + 1];

  const enrolledLessonIds = new Set(
    (
      await Promise.all(
        allLessons.map(async (l) => ({
          id: l.id,
          allowed: await canAccessLesson(session.user.id, l.id),
        }))
      )
    )
      .filter((x) => x.allowed)
      .map((x) => x.id)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LessonPlayer
            youtubeId={lesson.youtubeId}
            lessonId={lesson.id}
            initialProgress={progress?.watchedSeconds ?? 0}
          />
          <h1 className="mt-4 text-2xl font-bold">{lesson.title}</h1>
          <p className="mt-1 text-slate-600">{course.title}</p>
          {lesson.description && (
            <p className="mt-4 text-slate-700">{lesson.description}</p>
          )}
          {nextLesson && (
            <Link
              href={`/learn/${courseSlug}/${nextLesson.id}`}
              className="mt-6 inline-flex items-center gap-2 text-primary hover:underline"
            >
              Next: {nextLesson.title} →
            </Link>
          )}
        </div>

        <div className="max-h-[80vh] overflow-y-auto rounded-xl border border-slate-200 bg-white">
          <div className="sticky top-0 border-b border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Course Content</h2>
          </div>
          {course.sections.map((section) => (
            <div key={section.id}>
              <p className="bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                {section.title}
              </p>
              {section.lessons.map((l) => {
                const accessible = enrolledLessonIds.has(l.id);
                const isCurrent = l.id === lessonId;
                return (
                  <Link
                    key={l.id}
                    href={
                      accessible
                        ? `/learn/${courseSlug}/${l.id}`
                        : `/courses/${courseSlug}`
                    }
                    className={`flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm ${
                      isCurrent
                        ? "bg-primary/10 text-primary"
                        : accessible
                          ? "hover:bg-slate-50"
                          : "text-slate-400"
                    }`}
                  >
                    {accessible ? (
                      isCurrent ? (
                        <Play className="h-4 w-4 shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                      )
                    ) : (
                      <Lock className="h-4 w-4 shrink-0" />
                    )}
                    <span className="flex-1 line-clamp-1">{l.title}</span>
                    <span className="text-xs">{formatDuration(l.duration)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
