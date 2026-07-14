"use client";

import { VideoPlayer } from "@/components/video/video-player";

interface LessonPlayerProps {
  youtubeId: string;
  lessonId: string;
  initialProgress: number;
}

export function LessonPlayer({
  youtubeId,
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
    <VideoPlayer
      youtubeId={youtubeId}
      lessonId={lessonId}
      initialProgress={initialProgress}
      onProgress={handleProgress}
    />
  );
}
