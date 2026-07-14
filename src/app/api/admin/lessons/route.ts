import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lessonSchema } from "@/lib/validations";
import { forbidden, requireAdminSession } from "@/lib/admin-auth";
import { pageMeta, parseListQuery } from "@/lib/admin-query";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createLessonSchema = lessonSchema.extend({
  sectionId: z.string().cuid(),
});

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const url = new URL(request.url);
  const { page, pageSize, q, skip } = parseListQuery(url);
  const courseId = url.searchParams.get("courseId") || undefined;
  const preview = url.searchParams.get("preview"); // all | true | false
  const forSelect = url.searchParams.get("forSelect") === "1";

  if (forSelect) {
    const lessons = await prisma.lesson.findMany({
      include: {
        section: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { title: "asc" },
      take: 500,
    });
    return NextResponse.json({ lessons });
  }

  const where: Prisma.LessonWhereInput = {};
  if (courseId) where.section = { courseId };
  if (preview === "true") where.isPreview = true;
  if (preview === "false") where.isPreview = false;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { youtubeId: { contains: q, mode: "insensitive" } },
      { section: { title: { contains: q, mode: "insensitive" } } },
      { section: { course: { title: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [total, lessons] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({
      where,
      include: {
        section: {
          select: {
            id: true,
            title: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: [{ sectionId: "asc" }, { order: "asc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    lessons,
    meta: pageMeta(total, page, pageSize),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const body = await request.json();
  const parsed = createLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const { sectionId, title, youtubeId, description, duration, order, isPreview } =
    parsed.data;

  const nextOrder =
    order ??
    ((
      await prisma.lesson.aggregate({
        where: { sectionId },
        _max: { order: true },
      })
    )._max.order ?? -1) + 1;

  const lesson = await prisma.lesson.create({
    data: {
      sectionId,
      title,
      youtubeId,
      description: description ?? null,
      duration: duration ?? 0,
      order: nextOrder,
      isPreview: isPreview ?? false,
    },
  });
  return NextResponse.json({ lesson }, { status: 201 });
}
