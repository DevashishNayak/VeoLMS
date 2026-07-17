import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Clock,
  Star,
  User,
  Users,
} from "lucide-react";
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
import { COURSE_DISPLAY } from "@/lib/course-limits";
import { CourseCurriculum } from "@/components/course/course-curriculum";
import { CoursePurchaseCard } from "@/components/course/course-purchase-card";
import { CourseReviews } from "@/components/course/course-reviews";
import { ShowMoreList, ShowMoreText } from "@/components/ui/show-more";

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
  const fallbackPreview = allLessons.find((l) => l.isPreview) ?? null;
  const trailer =
    course.trailerProvider && course.trailerSrc
      ? {
          videoProvider: course.trailerProvider,
          videoSrc: course.trailerSrc,
        }
      : {
          videoProvider: fallbackPreview?.videoProvider ?? null,
          videoSrc: fallbackPreview?.videoSrc ?? null,
        };

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

  // Prefer real subtitle; fall back to description. UI clamps — never append "…" in the string.
  const heroPitch = (
    course.subtitle?.trim() ||
    course.description.trim()
  ).replace(/(?:\u2026|\.{3})+\s*$/g, "");

  let userReviewRating: number | null = null;
  if (enrolled && session?.user?.id) {
    const mine = await prisma.courseReview.findUnique({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: session.user.id,
        },
      },
      select: { rating: true },
    });
    userReviewRating = mine?.rating ?? null;
  }

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
    trailer,
  };

  return (
    <div className="bg-background">
      <div className="border-b border-border bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:px-8 lg:py-10">
          <div className="min-w-0 lg:col-span-2">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-1 text-xs text-zinc-400"
            >
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <Link href="/courses" className="hover:text-white">
                Courses
              </Link>
              {course.category?.parent ? (
                <>
                  <ChevronRight className="h-3 w-3 opacity-60" />
                  <Link
                    href={`/courses?category=${course.category.parent.slug}`}
                    className="hover:text-white"
                  >
                    {course.category.parent.name}
                  </Link>
                </>
              ) : null}
              {course.category ? (
                <>
                  <ChevronRight className="h-3 w-3 opacity-60" />
                  <Link
                    href={`/courses?category=${course.category.slug}`}
                    className="hover:text-white"
                  >
                    {course.category.name}
                  </Link>
                </>
              ) : null}
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span className="line-clamp-1 text-zinc-300">{course.title}</span>
            </nav>

            <p className="mt-4 text-sm font-medium text-primary">
              {DELIVERY_TYPE_LABEL[deliveryType]}
            </p>
            <h1
              className="mt-2 line-clamp-1 text-3xl font-bold tracking-tight sm:text-4xl"
              title={course.title}
            >
              {course.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-300 line-clamp-3">
              {heroPitch}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-400">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 shrink-0" />
                {allLessons.length} lectures · {course.sections.length} sections
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" />
                {formatDuration(totalDuration)} total
              </span>
              <Link
                href={`/instructors/${course.instructor.id}`}
                className="flex items-center gap-1.5 hover:text-white"
              >
                <User className="h-4 w-4 shrink-0" />
                Created by{" "}
                <span className="font-medium text-zinc-200 underline-offset-2 hover:underline">
                  {course.instructor.name}
                </span>
              </Link>
              {/* Always render rating slot so rows don’t jump when ratings appear */}
              <span
                className={
                  course.ratingCount > 0
                    ? "flex items-center gap-1.5 text-amber-300"
                    : "flex items-center gap-1.5 text-zinc-400"
                }
                title={
                  course.ratingCount > 0
                    ? undefined
                    : "No student ratings yet"
                }
              >
                <Star
                  className={
                    course.ratingCount > 0
                      ? "h-4 w-4 shrink-0 fill-amber-300"
                      : "h-4 w-4 shrink-0"
                  }
                />
                {course.ratingCount > 0 ? (
                  <>
                    <span className="font-medium tabular-nums">
                      {course.ratingAvg.toFixed(1)}
                    </span>
                    <span className="text-zinc-400">
                      ({course.ratingCount}{" "}
                      {course.ratingCount === 1 ? "rating" : "ratings"})
                    </span>
                  </>
                ) : (
                  <span>New</span>
                )}
              </span>
            </div>
          </div>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-3 lg:px-8">
        <div className="order-2 min-w-0 space-y-10 lg:order-1 lg:col-span-2">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">What you’ll learn</h2>
            <ShowMoreList
              className="mt-4"
              variant="outcomes"
              items={outcomes}
              visibleCount={COURSE_DISPLAY.outcomesVisible}
            />
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
            <ShowMoreList
              className="mt-4"
              variant="requirements"
              items={requirements}
              visibleCount={COURSE_DISPLAY.requirementsVisible}
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Description</h2>
            <ShowMoreText
              className="mt-3"
              collapsedClassName="line-clamp-5"
              text={course.description}
            />
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold">Instructor</h2>
            <Link
              href={`/instructors/${course.instructor.id}`}
              className="mt-4 flex gap-4 rounded-lg p-1 transition hover:bg-muted/50"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
                {course.instructor.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-primary underline-offset-2 hover:underline">
                  {course.instructor.name}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {course.instructor.bio?.trim() ||
                    "Instructor on VeoLMS"}
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.instructor.courseCount} courses
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {course.instructor.studentCount} students
                  </span>
                </div>
              </div>
            </Link>
          </section>

          <CourseReviews
            courseId={course.id}
            ratingAvg={course.ratingAvg}
            ratingCount={course.ratingCount}
            reviews={course.reviews}
            canReview={enrolled}
            initialUserRating={userReviewRating}
          />
        </div>

        <aside className="order-1 w-full min-w-0 lg:order-2 lg:-mt-40 xl:-mt-48">
          <div className="w-full min-w-0 lg:sticky lg:top-20 lg:z-10">
            <CoursePurchaseCard {...purchaseProps} />
          </div>
        </aside>
      </div>
    </div>
  );
}
