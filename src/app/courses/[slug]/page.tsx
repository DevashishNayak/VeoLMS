import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CheckCircle, Clock, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/courses";
import { getCourseProgress } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/lib/utils";
import {
  DELIVERY_TYPE_ACCESS_NOTE,
  DELIVERY_TYPE_DURATION_LABEL,
  DELIVERY_TYPE_LABEL,
} from "@/lib/delivery-type";
import { CourseCurriculum } from "@/components/course/course-curriculum";
import { CoursePurchaseCard } from "@/components/course/course-purchase-card";
import { VideoPlayer } from "@/components/video/video-player";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const course = await getCourseBySlug(slug, session?.user?.id);
  if (!course) notFound();

  const enrolled = course.enrolled;
  const deliveryType = course.deliveryType ?? "SELF_PACED";

  const allLessons = course.sections.flatMap((s) => s.lessons);
  const trailerLesson = allLessons.find((l) => l.isPreview) ?? null;
  const trailerType = trailerLesson?.type ?? "VIDEO";
  const totalDuration = allLessons.reduce((a, l) => a + l.duration, 0);
  const videoCount = allLessons.filter((l) => l.type === "VIDEO").length;
  const articleCount = allLessons.filter((l) => l.type === "TEXT").length;
  const pdfCount = allLessons.filter((l) => l.type === "PDF").length;

  let progress = 0;
  let resumeLessonId = allLessons[0]?.id;
  if (enrolled && session?.user?.id) {
    progress = await getCourseProgress(session.user.id, course.id);
    const recent = await prisma.lessonProgress.findFirst({
      where: {
        userId: session.user.id,
        lesson: { section: { courseId: course.id } },
      },
      orderBy: { lastWatchedAt: "desc" },
    });
    if (recent) resumeLessonId = recent.lessonId;
    else {
      const completed = await prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          completed: true,
          lessonId: { in: allLessons.map((l) => l.id) },
        },
        select: { lessonId: true },
      });
      const done = new Set(completed.map((c) => c.lessonId));
      resumeLessonId =
        allLessons.find((l) => !done.has(l.id))?.id ?? allLessons[0]?.id;
    }
  }

  const outcomes =
    course.learningOutcomes?.length > 0
      ? course.learningOutcomes
      : [
          "Build real projects step by step",
          "Understand core concepts with clear video lessons",
          "Practice with reading notes and downloadable resources",
          "Track your progress through every lecture",
        ];

  const requirements =
    course.requirements?.length > 0
      ? course.requirements
      : [
          "A computer with internet access",
          "No paid tools required — free stack only",
          "Curiosity and willingness to practice",
        ];

  const purchaseProps = {
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    thumbnail: course.thumbnail,
    priceInPaise: course.priceInPaise,
    enrolled,
    progress,
    resumeLessonId,
    accessNote: DELIVERY_TYPE_ACCESS_NOTE[deliveryType],
    durationLabel: DELIVERY_TYPE_DURATION_LABEL[deliveryType],
    totalDuration,
    videoCount,
    articleCount,
    pdfCount,
    userName: session?.user?.name ?? undefined,
    userEmail: session?.user?.email ?? undefined,
    isLoggedIn: Boolean(session?.user),
  };

  return (
    <div className="bg-background">
      <div className="border-b border-border bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:px-8 lg:py-12">
          <div className="lg:col-span-2">
            <p className="text-sm font-medium text-primary">
              {DELIVERY_TYPE_LABEL[deliveryType]}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-300">
              {course.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-400">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                Created by {course.instructor.name}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {allLessons.length} lectures · {course.sections.length} sections
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatDuration(totalDuration)} total
              </span>
            </div>
          </div>
          {/* Reserves the right column so the sticky card can pull up into the hero */}
          <div className="hidden lg:block" aria-hidden />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-3 lg:px-8">
        <div className="order-2 space-y-10 lg:order-1 lg:col-span-2">
          {trailerLesson && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Preview this course</h2>
              {trailerType === "VIDEO" && trailerLesson.youtubeId ? (
                <VideoPlayer
                  youtubeId={trailerLesson.youtubeId}
                  lessonId={trailerLesson.id}
                />
              ) : trailerType === "VIDEO" && trailerLesson.videoUrl ? (
                <video
                  className="aspect-video w-full overflow-hidden rounded-xl bg-black"
                  src={trailerLesson.videoUrl}
                  controls
                />
              ) : (
                <div className="rounded-xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                  Free preview:{" "}
                  <Link
                    href={`/learn/${course.slug}/${trailerLesson.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {trailerLesson.title}
                  </Link>
                </div>
              )}
            </section>
          )}

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">What you’ll learn</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {outcomes.map((item) => (
                <li key={item} className="flex gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <CourseCurriculum
              courseSlug={course.slug}
              enrolled={enrolled}
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
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Requirements</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Instructor</h2>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-semibold text-primary">
                {course.instructor.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{course.instructor.name}</p>
                <p className="text-sm text-muted-foreground">Course instructor</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="order-1 lg:order-2 lg:-mt-44 xl:-mt-52 lg:self-start">
          <div className="lg:sticky lg:top-20">
            <CoursePurchaseCard {...purchaseProps} />
          </div>
        </aside>
      </div>
    </div>
  );
}
