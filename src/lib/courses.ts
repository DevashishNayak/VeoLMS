import { prisma } from "@/lib/prisma";

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

export async function getCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug, published: true },
    include: {
      instructor: { select: { id: true, name: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });
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
