import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAdminSession } from "@/lib/admin-auth";
import { pageMeta, parseListQuery } from "@/lib/admin-query";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const enrollSchema = z.object({
  userId: z.string().cuid(),
  courseId: z.string().cuid(),
});

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const url = new URL(request.url);
  const { page, pageSize, q, skip } = parseListQuery(url);
  const courseId = url.searchParams.get("courseId") || undefined;

  const where: Prisma.EnrollmentWhereInput = {};
  if (courseId) where.courseId = courseId;
  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { course: { title: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, enrollments] = await Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { enrolledAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    enrollments,
    meta: pageMeta(total, page, pageSize),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const body = await request.json();
  const parsed = enrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const { userId, courseId } = parsed.data;
  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  try {
    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "User is already enrolled in this course" },
      { status: 409 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing enrollment id" }, { status: 400 });
  }

  await prisma.enrollment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
