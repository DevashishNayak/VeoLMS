import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CheckCircle, Clock, Play, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/courses";
import { isEnrolled } from "@/lib/access";
import { formatDuration, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutButton } from "@/components/payment/checkout-button";
import { VideoPlayer } from "@/components/video/video-player";

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
  const totalDuration = allLessons.reduce((a, l) => a + l.duration, 0);
  const firstLesson = allLessons[0];

  return (
    <div className="bg-white">
      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-sm font-medium text-primary-foreground/80">Course</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{course.title}</h1>
              <p className="mt-4 text-slate-300">{course.description}</p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {course.instructor.name}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {allLessons.length} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(totalDuration)}
                </span>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted lg:aspect-auto lg:h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.thumbnail}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {trailerLesson && (
              <section>
                <h2 className="mb-4 text-xl font-bold">Course Preview</h2>
                <VideoPlayer
                  youtubeId={trailerLesson.youtubeId}
                  lessonId={trailerLesson.id}
                />
              </section>
            )}

            <section>
              <h2 className="mb-4 text-xl font-bold">Curriculum</h2>
              <div className="space-y-4">
                {course.sections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {section.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4 text-primary" />
                            <span>{lesson.title}</span>
                            {lesson.isPreview && (
                              <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                Preview
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500">
                            {formatDuration(lesson.duration)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <div>
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <p className="text-3xl font-bold">
                  {course.priceInPaise === 0
                    ? "Free"
                    : formatPrice(course.priceInPaise)}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {allLessons.length} on-demand lessons
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Lifetime access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Progress tracking
                  </li>
                </ul>

                <div className="mt-6">
                  {enrolled && firstLesson ? (
                    <Button size="lg" className="w-full" asChild>
                      <Link href={`/learn/${course.slug}/${firstLesson.id}`}>
                        Continue Learning
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
                        Login to Enroll
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
