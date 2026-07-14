import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Film,
  MonitorPlay,
  User,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/courses";
import { getCourseProgress, isEnrolled } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutButton } from "@/components/payment/checkout-button";
import { VideoPlayer } from "@/components/video/video-player";
import { CourseCurriculum } from "@/components/course/course-curriculum";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const session = await auth();
  const enrolled = session?.user?.id
    ? await isEnrolled(session.user.id, course.id)
    : false;

  const allLessons = course.sections.flatMap((s) => s.lessons);
  const previewLessons = allLessons.filter((l) => l.isPreview);
  const trailerLesson = previewLessons[0] ?? allLessons[0];
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

  return (
    <div className="bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-zinc-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-12">
          <div className="lg:col-span-2">
            <p className="text-sm font-medium text-primary">Online course</p>
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
            {enrolled && (
              <p className="mt-4 text-sm text-primary">
                You’re enrolled · {progress}% complete
              </p>
            )}
          </div>

          {/* Desktop purchase card duplicates sticky card visually in hero column on large screens */}
          <div className="hidden lg:block" aria-hidden />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-10 lg:col-span-2">
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
                    href={
                      enrolled || trailerLesson.isPreview
                        ? `/learn/${course.slug}/${trailerLesson.id}`
                        : `/login?callbackUrl=/courses/${course.slug}`
                    }
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-lg font-semibold text-primary-foreground">
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

        {/* Sticky purchase card */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden shadow-lg">
            <div className="relative aspect-video bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.thumbnail}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="space-y-4 p-5">
              <p className="text-3xl font-bold">
                {course.priceInPaise === 0
                  ? "Free"
                  : formatPrice(course.priceInPaise)}
              </p>

              {enrolled && resumeLessonId ? (
                <Button size="lg" className="w-full" asChild>
                  <Link href={`/learn/${course.slug}/${resumeLessonId}`}>
                    {progress > 0 ? "Continue learning" : "Go to course"}
                  </Link>
                </Button>
              ) : session?.user ? (
                <CheckoutButton
                  courseId={course.id}
                  courseTitle={course.title}
                  priceInPaise={course.priceInPaise}
                  userName={session.user.name ?? undefined}
                  userEmail={session.user.email ?? undefined}
                />
              ) : (
                <Button size="lg" className="w-full" asChild>
                  <Link href={`/login?callbackUrl=/courses/${course.slug}`}>
                    Log in to enroll
                  </Link>
                </Button>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Full lifetime access · Progress tracking
              </p>

              <div>
                <p className="text-sm font-semibold">This course includes:</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <MonitorPlay className="h-4 w-4 text-foreground" />
                    {videoCount} video lessons
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-foreground" />
                    {articleCount} reading articles
                  </li>
                  <li className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-foreground" />
                    {pdfCount} PDF resources
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-foreground" />
                    {formatDuration(totalDuration)} on-demand content
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-foreground" />
                    Completion progress tracking
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
