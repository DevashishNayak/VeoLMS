import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CourseCard } from "@/components/course/course-card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InstructorPage({ params }: PageProps) {
  const { id } = await params;
  const instructor = await prisma.user.findFirst({
    where: {
      id,
      role: { in: ["ADMIN", "INSTRUCTOR"] },
    },
    select: {
      id: true,
      name: true,
      bio: true,
      courses: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        include: {
          instructor: { select: { name: true } },
          sections: { include: { lessons: { select: { duration: true } } } },
          reviews: { select: { rating: true } },
        },
      },
    },
  });
  if (!instructor) notFound();

  const courses = instructor.courses.map((c) => {
    const ratingCount = c.reviews.length;
    const ratingAvg =
      ratingCount > 0
        ? c.reviews.reduce((a, r) => a + r.rating, 0) / ratingCount
        : 0;
    return {
      ...c,
      lessonCount: c.sections.reduce((acc, s) => acc + s.lessons.length, 0),
      totalDuration: c.sections.reduce(
        (acc, s) => acc + s.lessons.reduce((a, l) => a + l.duration, 0),
        0
      ),
      ratingAvg,
      ratingCount,
    };
  });

  const studentCount = await prisma.enrollment.count({
    where: { course: { instructorId: instructor.id, published: true } },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
          {instructor.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Instructor</p>
          <h1 className="text-3xl font-bold tracking-tight">{instructor.name}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {instructor.bio?.trim() ||
              `${instructor.name} teaches on VeoLMS.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {courses.length} courses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {studentCount} students
            </span>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-xl font-bold">Courses</h2>
      {courses.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No published courses yet.</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      <p className="mt-10">
        <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
          ← Back to all courses
        </Link>
      </p>
    </div>
  );
}
