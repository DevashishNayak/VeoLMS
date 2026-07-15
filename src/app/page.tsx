import Link from "next/link";
import { ArrowRight, BookOpen, PlayCircle, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course/course-card";
import { getCoursesWithMeta, getFeaturedCourses } from "@/lib/courses";

export default async function HomePage() {
  const [session, featured, all] = await Promise.all([
    auth(),
    getFeaturedCourses(),
    getCoursesWithMeta(),
  ]);

  const isLoggedIn = Boolean(session?.user);
  const catalog = all.slice(0, 6);

  return (
    <div className="bg-background">
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #071510 0%, #0d241c 48%, #123028 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at 80% 20%, oklch(0.8348 0.1302 160.908), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                VeoLMS Core Team Challenge
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Learn skills that move your career forward
              </h1>
              <p className="mt-6 text-lg text-white/70">
                Explore expert-led courses in web development. Preview lessons for
                free, enroll with secure payments, and learn at your own pace.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  asChild
                >
                  <Link href="/courses">
                    Browse Courses <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="bg-white text-foreground hover:bg-white/90"
                  asChild
                >
                  {isLoggedIn ? (
                    <Link href="/dashboard">Start Learning Free</Link>
                  ) : (
                    <Link href="/register">Create Account</Link>
                  )}
                </Button>
              </div>
            </div>

            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                {
                  icon: BookOpen,
                  title: "Explore freely",
                  body: "Open any published course and see the curriculum before you sign up.",
                },
                {
                  icon: PlayCircle,
                  title: "Preview lessons",
                  body: "Watch free preview lectures to judge fit — then enroll when it clicks.",
                },
                {
                  icon: Sparkles,
                  title: "Learn your way",
                  body: "Self-paced video, reading, and PDF lectures with progress once you enroll.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/25 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-snug text-white/65">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Featured courses
            </h2>
            <p className="mt-1 text-muted-foreground">
              Hand-picked picks to start discovering
            </p>
          </div>
          <Link
            href="/courses?featured=1"
            className="inline-flex items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 transition hover:underline"
          >
            View featured courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            No featured courses yet.{" "}
            <Link href="/courses" className="font-medium underline">
              Browse the catalog
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-border bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                All courses
              </h2>
              <p className="mt-1 text-muted-foreground">
                Browse the full catalog — open any course as a guest
              </p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 transition hover:underline"
            >
              View all courses
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {catalog.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Courses will appear here once published.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  showFeaturedBadge
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.8348_0.1302_160.908_/0.35),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-12">
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Ready when you are
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
            {isLoggedIn
              ? "Pick up where you left off, or keep exploring the catalog."
              : "Keep browsing as a visitor, or create a free account to enroll and track progress."}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/courses">Discover courses</Link>
            </Button>
            <Button variant="outline" asChild>
              {isLoggedIn ? (
                <Link href="/dashboard">Go to dashboard</Link>
              ) : (
                <Link href="/register">Create free account</Link>
              )}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
