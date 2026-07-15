"use client";

import type { VideoProvider } from "@prisma/client";
import { LmsMediaPlayer } from "@/components/video/lms-media-player";

interface LessonPlayerProps {
  videoProvider?: VideoProvider | null;
  videoSrc?: string | null;
  lessonId: string;
  initialProgress: number;
}

export function LessonPlayer({
  videoProvider,
  videoSrc,
  lessonId,
  initialProgress,
}: LessonPlayerProps) {
  async function handleProgress(seconds: number, completed: boolean) {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        watchedSeconds: seconds,
        completed,
      }),
    });
  }

  return (
    <LmsMediaPlayer
      videoProvider={videoProvider}
      videoSrc={videoSrc}
      lessonId={lessonId}
      initialProgress={initialProgress}
      onProgress={handleProgress}
    />
  );
}
