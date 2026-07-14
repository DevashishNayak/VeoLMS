import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { pageMeta, parseListQuery } from "@/lib/admin-query";
import type { Prisma } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const { page, pageSize, q, skip } = parseListQuery(url);
  const published = url.searchParams.get("published"); // all | true | false
  const featured = url.searchParams.get("featured"); // all | true | false
  const forSelect = url.searchParams.get("forSelect") === "1";

  if (forSelect) {
    const courses = await prisma.course.findMany({
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
      take: 500,
    });
    return NextResponse.json({ courses });
  }

  const where: Prisma.CourseWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (published === "true") where.published = true;
  if (published === "false") where.published = false;
  if (featured === "true") where.featured = true;
  if (featured === "false") where.featured = false;

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: {
        instructor: { select: { name: true } },
        sections: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" } } },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    courses,
    meta: pageMeta(total, page, pageSize),
  });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    let slug = slugify(parsed.data.title);
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const course = await prisma.course.create({
      data: {
        ...parsed.data,
        slug,
        instructorId: session.user.id,
      },
    });
    return NextResponse.json({ course }, { status: 201 });
  } catch (e) {
    console.error("Create course error:", e);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
