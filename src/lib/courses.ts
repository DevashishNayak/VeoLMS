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

export async function getCoursesWithMeta(search?: string, categorySlug?: string) {
  const courses = await prisma.course.findMany({
    where: {
      published: true,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { subtitle: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categorySlug
        ? {
            OR: [
              { category: { slug: categorySlug } },
              { category: { parent: { slug: categorySlug } } },
            ],
          }
        : {}),
    },
    include: {
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
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((c) => {
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
  const featured = await getCoursesWithMeta();
  const onlyFeatured = featured.filter((c) => c.featured);
  return (onlyFeatured.length > 0 ? onlyFeatured : featured).slice(0, 6);
}
