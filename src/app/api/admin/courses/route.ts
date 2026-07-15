import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations";
import { normalizeVideoInput } from "@/lib/media-src";
import { slugify } from "@/lib/utils";
import { pageMeta, parseListQuery } from "@/lib/admin-query";
import {
  coursesOwnedWhere,
  forbidden,
  requireStaffSession,
} from "@/lib/admin-auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  try {
    const url = new URL(request.url);
    const { page, pageSize, q, skip } = parseListQuery(url);
    const published = url.searchParams.get("published");
    const featured = url.searchParams.get("featured");
    const forSelect = url.searchParams.get("forSelect") === "1";
    const ownership = coursesOwnedWhere(session);

    if (forSelect) {
      const courses = await prisma.course.findMany({
        where: ownership,
        select: { id: true, title: true, slug: true },
        orderBy: { title: "asc" },
        take: 500,
      });
      return NextResponse.json({ courses });
    }

    const where: Prisma.CourseWhereInput = { ...ownership };
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
          instructor: { select: { id: true, name: true, email: true } },
          sections: {
            orderBy: { order: "asc" },
            include: {
              lessons: { select: { id: true }, orderBy: { order: "asc" } },
            },
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
  } catch (e) {
    console.error("List courses error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

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

    const {
      instructorId: requestedInstructor,
      trailerProvider,
      trailerSrc,
      categoryId,
      ...data
    } = parsed.data;
    let instructorId = session.user.id;
    if (session.user.role === "ADMIN" && requestedInstructor) {
      const instructor = await prisma.user.findFirst({
        where: {
          id: requestedInstructor,
          role: { in: ["ADMIN", "INSTRUCTOR"] },
        },
        select: { id: true },
      });
      if (!instructor) {
        return NextResponse.json(
          { error: "Instructor must be an ADMIN or INSTRUCTOR user" },
          { status: 400 }
        );
      }
      instructorId = instructor.id;
    }

    const trailer = normalizeVideoInput({
      provider: (trailerProvider as "YOUTUBE" | "VIMEO" | "FILE" | "") || null,
      src: trailerSrc,
    });

    const course = await prisma.course.create({
      data: {
        ...data,
        slug,
        instructorId,
        categoryId: categoryId === "" || !categoryId ? null : categoryId,
        deliveryType: data.deliveryType ?? "SELF_PACED",
        trailerProvider: trailer?.videoProvider ?? null,
        trailerSrc: trailer?.videoSrc ?? null,
      },
    });
    return NextResponse.json({ course }, { status: 201 });
  } catch (e) {
    console.error("Create course error:", e);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
