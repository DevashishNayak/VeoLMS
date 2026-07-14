import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sectionSchema } from "@/lib/validations";
import { forbidden, requireAdminSession } from "@/lib/admin-auth";
import { pageMeta, parseListQuery } from "@/lib/admin-query";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createSectionSchema = sectionSchema.extend({
  courseId: z.string().cuid(),
});

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const url = new URL(request.url);
  const { page, pageSize, q, skip } = parseListQuery(url);
  const courseId = url.searchParams.get("courseId") || undefined;
  const forSelect = url.searchParams.get("forSelect") === "1";

  if (forSelect) {
    const sections = await prisma.section.findMany({
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: [{ course: { title: "asc" } }, { order: "asc" }],
      take: 500,
    });
    return NextResponse.json({ sections });
  }

  const where: Prisma.SectionWhereInput = {};
  if (courseId) where.courseId = courseId;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { course: { title: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, sections] = await Promise.all([
    prisma.section.count({ where }),
    prisma.section.findMany({
      where,
      include: {
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { lessons: true } },
      },
      orderBy: [{ courseId: "asc" }, { order: "asc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    sections,
    meta: pageMeta(total, page, pageSize),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const body = await request.json();
  const parsed = createSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const { courseId, title, order } = parsed.data;
  const nextOrder =
    order ??
    ((
      await prisma.section.aggregate({
        where: { courseId },
        _max: { order: true },
      })
    )._max.order ?? -1) + 1;

  const section = await prisma.section.create({
    data: { courseId, title, order: nextOrder },
  });
  return NextResponse.json({ section }, { status: 201 });
}
