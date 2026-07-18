import { Suspense } from "react";
import { CourseCard } from "@/components/course/course-card";
import {
  CoursesCatalogToolbar,
  CoursesPagination,
} from "@/components/course/courses-catalog-controls";
import {
  getCoursesCatalog,
  getPublicCategories,
  type CourseSort,
} from "@/lib/courses";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    featured?: string;
    sort?: string;
    page?: string;
  }>;
}

function isFeaturedFilter(value?: string) {
  return value === "1" || value === "true";
}

const SORTS: CourseSort[] = [
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "title",
  "rating",
];

function parseSort(value?: string): CourseSort {
  return SORTS.includes(value as CourseSort) ? (value as CourseSort) : "newest";
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const { q, category, featured, sort, page } = await searchParams;
  const featuredOnly = isFeaturedFilter(featured);
  const sortBy = parseSort(sort);
  const pageNum = Math.max(1, Number(page) || 1);

  const [catalog, categories] = await Promise.all([
    getCoursesCatalog({
      search: q,
      categorySlug: category,
      featuredOnly,
      sort: sortBy,
      page: pageNum,
    }),
    getPublicCategories(),
  ]);

  const categoryOptions = categories.map((c) => ({
    slug: c.slug,
    name: c.name,
    parentName: c.parent?.name ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {featuredOnly ? "Featured courses" : "All Courses"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {q
            ? `Showing results for "${q}"`
            : category
              ? `Category: ${category.replace(/-/g, " ")}`
              : featuredOnly
                ? "Hand-picked courses to get you started"
                : "Discover courses and learn at your pace. Use the header search anytime."}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="mt-6 h-10 animate-pulse rounded-lg bg-muted" />
        }
      >
        <CoursesCatalogToolbar
          categories={categoryOptions}
          featuredOnly={featuredOnly}
          total={catalog.total}
          page={catalog.page}
          pageSize={catalog.pageSize}
        />
      </Suspense>

      {catalog.courses.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          No courses found.
        </p>
      ) : (
        <>
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {catalog.courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showFeaturedBadge={!featuredOnly}
              />
            ))}
          </div>
          <Suspense fallback={null}>
            <CoursesPagination
              page={catalog.page}
              totalPages={catalog.totalPages}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}
