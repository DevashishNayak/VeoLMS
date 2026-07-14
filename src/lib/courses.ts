import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/access";
import { sanitizeLessonPayload } from "@/lib/lesson-payload";

export type PublicLesson = {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "TEXT" | "PDF";
  youtubeId: string | null;
  videoUrl: string | null;
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

export type PublicCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  learningOutcomes: string[];
  requirements: string[];
  priceInPaise: number;
  featured: boolean;
  published: boolean;
  deliveryType: "SELF_PACED" | "LIVE" | "OFFLINE";
  instructorId: string;
  createdAt: Date;
  updatedAt: Date;
  enrolled: boolean;
  instructor: { id: string; name: string };
  sections: {
    id: string;
    title: string;
    order: number;
    courseId: string;
    lessons: PublicLesson[];
  }[];
};

export async function getCoursesWithMeta(search?: string) {
  const courses = await prisma.course.findMany({
    where: {
      published: true,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      instructor: { select: { name: true } },
      sections: { include: { lessons: { select: { duration: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((c) => ({
    ...c,
    lessonCount: c.sections.reduce((acc, s) => acc + s.lessons.length, 0),
    totalDuration: c.sections.reduce(
      (acc, s) => acc + s.lessons.reduce((a, l) => a + l.duration, 0),
      0
    ),
  }));
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

/**
 * Public course page query. Paid media is stripped unless the viewer
 * is enrolled, the lesson is Preview, or they are staff for that course.
 */
export async function getCourseBySlug(
  slug: string,
  userId?: string
): Promise<PublicCourse | null> {
  const course = await prisma.course.findUnique({
    where: { slug, published: true },
    include: {
      instructor: { select: { id: true, name: true } },
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
    },
  });
  if (!course) return null;

  const enrolled = userId ? await isEnrolled(userId, course.id) : false;
  const staffBypass = await viewerCanBypassPaywall(userId, course.instructorId);

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
        youtubeId: safe.youtubeId,
        videoUrl: safe.videoUrl,
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
    description: course.description,
    thumbnail: course.thumbnail,
    learningOutcomes: course.learningOutcomes,
    requirements: course.requirements,
    priceInPaise: course.priceInPaise,
    featured: course.featured,
    published: course.published,
    deliveryType: course.deliveryType,
    instructorId: course.instructorId,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    enrolled,
    instructor: course.instructor,
    sections,
  };
}

export async function getFeaturedCourses() {
  const featured = await prisma.course.findMany({
    where: { published: true, featured: true },
    include: {
      instructor: { select: { name: true } },
      sections: { include: { lessons: { select: { duration: true } } } },
    },
    take: 6,
  });

  if (featured.length > 0) {
    return featured.map((c) => ({
      ...c,
      lessonCount: c.sections.reduce((acc, s) => acc + s.lessons.length, 0),
      totalDuration: c.sections.reduce(
        (acc, s) => acc + s.lessons.reduce((a, l) => a + l.duration, 0),
        0
      ),
    }));
  }

  const all = await getCoursesWithMeta();
  return all.slice(0, 3);
}
