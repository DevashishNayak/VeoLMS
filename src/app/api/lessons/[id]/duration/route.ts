import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessLesson } from "@/lib/access";

const bodySchema = z.object({
  duration: z.number().int().positive().max(60 * 60 * 12),
});

/**
 * Self-heal incorrect lesson.duration from the real media length while watching.
 * Only updates when stored duration is missing or off by >5%.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!(await canAccessLesson(userId, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const next = parsed.data.duration;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { duration: true, type: true },
  });
  if (!lesson || lesson.type !== "VIDEO") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const prev = lesson.duration ?? 0;
  const needsUpdate =
    prev <= 0 || Math.abs(prev - next) / Math.max(next, 1) > 0.05;
  if (!needsUpdate) {
    return NextResponse.json({ duration: prev, updated: false });
  }

  await prisma.lesson.update({
    where: { id },
    data: { duration: next },
  });

  return NextResponse.json({ duration: next, updated: true });
}
