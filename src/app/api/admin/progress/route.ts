import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAdminSession } from "@/lib/admin-auth";
import { pageMeta, parseListQuery } from "@/lib/admin-query";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const progressSchema = z.object({
  userId: z.string().cuid(),
  lessonId: z.string().cuid(),
  watchedSeconds: z.coerce.number().int().min(0).max(86400).default(0),
  completed: z.boolean().default(false),
});

const updateProgressSchema = z.object({
  id: z.string().cuid(),
  watchedSeconds: z.coerce.number().int().min(0).max(86400).optional(),
  completed: z.boolean().optional(),
});

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const url = new URL(request.url);
  const { page, pageSize, q, skip } = parseListQuery(url);
  const completed = url.searchParams.get("completed");

  const where: Prisma.LessonProgressWhereInput = {};
  if (completed === "true") where.completed = true;
  if (completed === "false") where.completed = false;
  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { lesson: { title: { contains: q, mode: "insensitive" } } },
      {
        lesson: {
          section: { course: { title: { contains: q, mode: "insensitive" } } },
        },
      },
    ];
  }

  const [total, progress] = await Promise.all([
    prisma.lessonProgress.count({ where }),
    prisma.lessonProgress.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        lesson: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                title: true,
                course: { select: { id: true, title: true } },
              },
            },
          },
        },
      },
      orderBy: { lastWatchedAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    progress,
    meta: pageMeta(total, page, pageSize),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const body = await request.json();
  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  try {
    const row = await prisma.lessonProgress.create({
      data: {
        ...parsed.data,
        lastWatchedAt: new Date(),
      },
    });
    return NextResponse.json({ progress: row }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Progress already exists for this user/lesson" },
      { status: 409 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const body = await request.json();
  const parsed = updateProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const { id, ...data } = parsed.data;
  const row = await prisma.lessonProgress.update({
    where: { id },
    data: { ...data, lastWatchedAt: new Date() },
  });
  return NextResponse.json({ progress: row });
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await prisma.lessonProgress.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
