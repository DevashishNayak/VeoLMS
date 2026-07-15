import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessLesson } from "@/lib/access";
import { progressSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = progressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid progress data" }, { status: 400 });
    }

    const allowed = await canAccessLesson(
      session.user.id,
      parsed.data.lessonId
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only write `completed` when the client sends it — scrubbing a video
    // must not clear a prior completion.
    const completedPatch =
      parsed.data.completed === undefined
        ? {}
        : { completed: parsed.data.completed };

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: parsed.data.lessonId,
        },
      },
      create: {
        userId: session.user.id,
        lessonId: parsed.data.lessonId,
        watchedSeconds: parsed.data.watchedSeconds,
        completed: parsed.data.completed ?? false,
      },
      update: {
        watchedSeconds: parsed.data.watchedSeconds,
        ...completedPatch,
        lastWatchedAt: new Date(),
      },
    });

    return NextResponse.json({ progress });
  } catch {
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
