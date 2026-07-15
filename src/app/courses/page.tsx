import { CourseCard } from "@/components/course/course-card";
import { getCoursesWithMeta } from "@/lib/courses";

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const { q, category } = await searchParams;
  const courses = await getCoursesWithMeta(q, category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">All Courses</h1>
      <p className="mt-2 text-muted-foreground">
        {q
          ? `Showing results for "${q}"`
          : category
            ? `Category: ${category.replace(/-/g, " ")}`
            : "Discover courses and learn at your pace"}
      </p>

      {courses.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">No courses found.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
