import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessLesson } from "@/lib/access";
import { formatDuration } from "@/lib/utils";
import { LessonContentView } from "@/components/learn/lesson-content-view";
import { CheckCircle, FileText, Film, Lock, Play } from "lucide-react";

interface PageProps {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}

function typeIcon(type: string) {
  if (type === "PDF") return FileText;
  if (type === "TEXT") return FileText;
  return Film;
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
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { resources: { orderBy: { order: "asc" } } },
          },
        },
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
          allowed: await canAccessLesson(session.user.id!, l.id),
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
          <LessonContentView
            lessonId={lesson.id}
            type={lesson.type ?? "VIDEO"}
            title={lesson.title}
            youtubeId={lesson.youtubeId}
            videoUrl={lesson.videoUrl}
            content={lesson.content}
            pdfUrl={lesson.pdfUrl}
            initialProgress={progress?.watchedSeconds ?? 0}
            resources={lesson.resources}
          />
          <h1 className="mt-4 text-2xl font-bold text-foreground">{lesson.title}</h1>
          <p className="mt-1 text-muted-foreground">{course.title}</p>
          {lesson.description && (
            <p className="mt-4 text-foreground/80">{lesson.description}</p>
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

        <aside className="max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-card">
          <div className="sticky top-0 z-[1] border-b border-border bg-card p-4">
            <h2 className="font-semibold">Course content</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {allLessons.length} lessons · {course.sections.length} sections
            </p>
          </div>
          {course.sections.map((section) => (
            <div key={section.id}>
              <p className="bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
                {section.title}
              </p>
              {section.lessons.map((l) => {
                const accessible = enrolledLessonIds.has(l.id);
                const isCurrent = l.id === lessonId;
                const Icon = typeIcon(l.type);
                return (
                  <Link
                    key={l.id}
                    href={
                      accessible
                        ? `/learn/${courseSlug}/${l.id}`
                        : `/courses/${courseSlug}`
                    }
                    className={`flex items-center gap-2 border-b border-border/60 px-4 py-3 text-sm ${
                      isCurrent
                        ? "bg-primary/10 text-foreground"
                        : accessible
                          ? "hover:bg-muted/40"
                          : "text-muted-foreground"
                    }`}
                  >
                    {accessible ? (
                      isCurrent ? (
                        <Play className="h-4 w-4 shrink-0 text-primary" />
                      ) : progress?.completed && isCurrent ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )
                    ) : (
                      <Lock className="h-4 w-4 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1 truncate">{l.title}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {l.type}
                    </span>
                    {l.duration > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDuration(l.duration)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
