import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/access";
import { sanitizeLessonPayload } from "@/lib/lesson-payload";

export type PublicLesson = {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "TEXT" | "PDF";
  videoProvider: "YOUTUBE" | "VIMEO" | "FILE" | null;
  videoSrc: string | null;
  content: string | null;
  pdfUrl: string | null;
  duration: number;
  order: number;
  isPreview: boolean;
  sectionId: string;
  resources: {
    id: string;
    title: string;
    url: string;
    mimeType: string | null;
  }[];
};

export type BreadcrumbCategory = {
  id: string;
  name: string;
  slug: string;
  parent: { id: string; name: string; slug: string } | null;
};

export type PublicCourse = {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  learningOutcomes: string[];
  requirements: string[];
  priceInPaise: number;
  featured: boolean;
  published: boolean;
  deliveryType: "SELF_PACED" | "LIVE" | "OFFLINE";
  trailerProvider: "YOUTUBE" | "VIMEO" | "FILE" | null;
  trailerSrc: string | null;
  instructorId: string;
  createdAt: Date;
  updatedAt: Date;
  enrolled: boolean;
  instructor: {
    id: string;
    name: string;
    bio: string | null;
    courseCount: number;
    studentCount: number;
  };
  category: BreadcrumbCategory | null;
  ratingAvg: number;
  ratingCount: number;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    user: { name: string };
  }[];
  sections: {
    id: string;
    title: string;
    order: number;
    courseId: string;
    lessons: PublicLesson[];
  }[];
};

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  priceInPaise: number;
  featured: boolean;
  instructor: { name: string };
  category: {
    name: string;
    parent: { name: string } | null;
  } | null;
  sectionCount: number;
  lessonCount: number;
  totalDuration: number;
  ratingAvg: number;
  ratingCount: number;
};

export type CourseSort =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "title"
  | "rating";

export type CourseCatalogResult = {
  courses: CourseCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const courseListInclude = {
  instructor: { select: { name: true } },
  category: {
    select: {
      slug: true,
      name: true,
      parent: { select: { slug: true, name: true } },
    },
  },
  sections: { include: { lessons: { select: { duration: true } } } },
  reviews: { select: { rating: true } },
} as const;

function mapCourseCard(
  c: {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    thumbnail: string;
    priceInPaise: number;
    featured: boolean;
    instructor: { name: string };
    category: {
      name: string;
      parent: { name: string } | null;
    } | null;
    sections: { lessons: { duration: number }[] }[];
    reviews: { rating: number }[];
  }
): CourseCardData {
  const ratingCount = c.reviews.length;
  const ratingAvg =
    ratingCount > 0
      ? c.reviews.reduce((a, r) => a + r.rating, 0) / ratingCount
      : 0;
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    thumbnail: c.thumbnail,
    priceInPaise: c.priceInPaise,
    featured: c.featured,
    instructor: c.instructor,
    category: c.category
      ? {
          name: c.category.name,
          parent: c.category.parent
            ? { name: c.category.parent.name }
            : null,
        }
      : null,
    sectionCount: c.sections.length,
    lessonCount: c.sections.reduce((acc, s) => acc + s.lessons.length, 0),
    totalDuration: c.sections.reduce(
      (acc, s) => acc + s.lessons.reduce((a, l) => a + l.duration, 0),
      0
    ),
    ratingAvg,
    ratingCount,
  };
}

function courseListWhere(
  search?: string,
  categorySlug?: string,
  featuredOnly?: boolean
) {
  const and: object[] = [];
  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { subtitle: { contains: search, mode: "insensitive" as const } },
        {
          description: { contains: search, mode: "insensitive" as const },
        },
      ],
    });
  }
  if (categorySlug) {
    and.push({
      OR: [
        { category: { slug: categorySlug } },
        { category: { parent: { slug: categorySlug } } },
      ],
    });
  }
  return {
    published: true as const,
    ...(featuredOnly ? { featured: true } : {}),
    ...(and.length > 0 ? { AND: and } : {}),
  };
}

export async function getCoursesWithMeta(
  search?: string,
  categorySlug?: string,
  featuredOnly?: boolean
): Promise<CourseCardData[]> {
  const courses = await prisma.course.findMany({
    where: courseListWhere(search, categorySlug, featuredOnly),
    include: courseListInclude,
    orderBy: { createdAt: "desc" },
  });

  return courses.map(mapCourseCard);
}

export async function getPublicCategories() {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      parent: { select: { name: true } },
    },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
}

export async function getCoursesCatalog(options: {
  search?: string;
  categorySlug?: string;
  featuredOnly?: boolean;
  sort?: CourseSort;
  page?: number;
  pageSize?: number;
}): Promise<CourseCatalogResult> {
  const sort: CourseSort = options.sort ?? "newest";
  // Fixed page size for the public catalog (not an admin “rows per page” control)
  const pageSize = 12;
  const page = Math.max(1, options.page ?? 1);
  const where = courseListWhere(
    options.search,
    options.categorySlug,
    options.featuredOnly
  );

  if (sort === "rating") {
    const all = await prisma.course.findMany({
      where,
      include: courseListInclude,
    });
    const mapped = all.map(mapCourseCard).sort((a, b) => {
      if (b.ratingAvg !== a.ratingAvg) return b.ratingAvg - a.ratingAvg;
      return b.ratingCount - a.ratingCount;
    });
    const total = mapped.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const courses = mapped.slice(
      (safePage - 1) * pageSize,
      safePage * pageSize
    );
    return { courses, total, page: safePage, pageSize, totalPages };
  }

  const orderBy =
    sort === "oldest"
      ? ({ createdAt: "asc" } as const)
      : sort === "price-asc"
        ? ({ priceInPaise: "asc" } as const)
        : sort === "price-desc"
          ? ({ priceInPaise: "desc" } as const)
          : sort === "title"
            ? ({ title: "asc" } as const)
            : ({ createdAt: "desc" } as const);

  const total = await prisma.course.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = await prisma.course.findMany({
    where,
    include: courseListInclude,
    orderBy,
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  });

  return {
    courses: rows.map(mapCourseCard),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

async function viewerCanBypassPaywall(
  userId: string | undefined,
  instructorId: string
) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "INSTRUCTOR" && instructorId === userId) return true;
  return false;
}

export async function getCourseBySlug(
  slug: string,
  userId?: string
): Promise<PublicCourse | null> {
  const course = await prisma.course.findUnique({
    where: { slug, published: true },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          bio: true,
          courses: {
            where: { published: true },
            select: {
              id: true,
              _count: { select: { enrollments: true } },
            },
          },
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      },
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              resources: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  url: true,
                  mimeType: true,
                },
              },
            },
          },
        },
      },
      _count: { select: { reviews: true } },
    },
  });
  if (!course) return null;

  const enrolled = userId ? await isEnrolled(userId, course.id) : false;
  const staffBypass = await viewerCanBypassPaywall(userId, course.instructorId);

  const allRatings = await prisma.courseReview.aggregate({
    where: { courseId: course.id },
    _avg: { rating: true },
    _count: true,
  });

  const instructorCourseCount = course.instructor.courses.length;
  const instructorStudentCount = course.instructor.courses.reduce(
    (n, c) => n + c._count.enrollments,
    0
  );

  const sections: PublicCourse["sections"] = course.sections.map((section) => ({
    id: section.id,
    title: section.title,
    order: section.order,
    courseId: section.courseId,
    lessons: section.lessons.map((lesson) => {
      const allowed = lesson.isPreview || enrolled || staffBypass;
      const safe = sanitizeLessonPayload(lesson, allowed);
      return {
        id: safe.id,
        title: safe.title,
        description: safe.description,
        type: safe.type,
        videoProvider: safe.videoProvider as PublicLesson["videoProvider"],
        videoSrc: safe.videoSrc,
        content: safe.content,
        pdfUrl: safe.pdfUrl,
        duration: safe.duration,
        order: safe.order,
        isPreview: safe.isPreview,
        sectionId: safe.sectionId,
        resources: (safe.resources ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          url: r.url,
          mimeType: r.mimeType ?? null,
        })),
      };
    }),
  }));

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    subtitle: course.subtitle,
    description: course.description,
    thumbnail: course.thumbnail,
    learningOutcomes: course.learningOutcomes,
    requirements: course.requirements,
    priceInPaise: course.priceInPaise,
    featured: course.featured,
    published: course.published,
    deliveryType: course.deliveryType,
    trailerProvider: course.trailerProvider,
    trailerSrc: course.trailerSrc,
    instructorId: course.instructorId,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    enrolled,
    instructor: {
      id: course.instructor.id,
      name: course.instructor.name,
      bio: course.instructor.bio,
      courseCount: instructorCourseCount,
      studentCount: instructorStudentCount,
    },
    category: course.category,
    ratingAvg: allRatings._avg.rating ?? 0,
    ratingCount: allRatings._count,
    reviews: course.reviews,
    sections,
  };
}

export async function getFeaturedCourses() {
  const featured = await getCoursesWithMeta(undefined, undefined, true);
  if (featured.length > 0) return featured.slice(0, 6);
  // Fallback when nothing is marked featured yet
  return (await getCoursesWithMeta()).slice(0, 6);
}
