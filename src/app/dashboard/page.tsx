import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCourseProgress } from "@/lib/access";
import { formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Play } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          sections: { include: { lessons: true } },
          instructor: { select: { name: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const recentProgress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id },
    include: {
      lesson: {
        include: {
          section: { include: { course: true } },
        },
      },
    },
    orderBy: { lastWatchedAt: "desc" },
    take: 5,
  });

  const coursesWithProgress = await Promise.all(
    enrollments.map(async (e) => ({
      ...e,
      progress: await getCourseProgress(session.user.id, e.course.id),
      lessonCount: e.course.sections.reduce((a, s) => a + s.lessons.length, 0),
    }))
  );

  const continueLearning = recentProgress[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Welcome back, {session.user.name}
      </h1>
      <p className="mt-1 text-slate-600">Continue your learning journey</p>

      {continueLearning && (
        <Card className="mt-8 border-primary/30 bg-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Play className="h-5 w-5 text-primary" />
              Continue Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {continueLearning.lesson.section.course.title}
              </p>
              <p className="text-sm text-slate-600">
                {continueLearning.lesson.title}
              </p>
            </div>
            <Button asChild>
              <Link
                href={`/learn/${continueLearning.lesson.section.course.slug}/${continueLearning.lesson.id}`}
              >
                Resume
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">My Courses</h2>
        {coursesWithProgress.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-slate-600">You haven&apos;t enrolled in any courses yet.</p>
              <Button className="mt-4" asChild>
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coursesWithProgress.map(({ course, progress, lessonCount }) => {
              const firstLesson = course.sections
                .flatMap((s) => s.lessons)
                .sort((a, b) => a.order - b.order)[0];
              return (
                <Card key={course.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-2">{course.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {course.instructor.name}
                    </p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{progress}% complete</span>
                        <span>{lessonCount} lessons</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    {firstLesson && (
                      <Button className="mt-4 w-full" size="sm" asChild>
                        <Link href={`/learn/${course.slug}/${firstLesson.id}`}>
                          {progress > 0 ? "Continue" : "Start"}
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {recentProgress.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Clock className="h-5 w-5" />
            Recently Watched
          </h2>
          <div className="space-y-2">
            {recentProgress.map((p) => (
              <Link
                key={p.id}
                href={`/learn/${p.lesson.section.course.slug}/${p.lesson.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-primary/40"
              >
                <div>
                  <p className="font-medium">{p.lesson.title}</p>
                  <p className="text-sm text-slate-500">
                    {p.lesson.section.course.title}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(p.lastWatchedAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
