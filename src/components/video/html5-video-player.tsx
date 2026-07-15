"use client";

import { LmsMediaPlayer } from "@/components/video/lms-media-player";

/** @deprecated Prefer `LmsMediaPlayer` with `videoProvider="FILE"`. */
export function Html5VideoPlayer({
  src,
  lessonId,
  initialProgress = 0,
  onProgress,
  className,
}: {
  src: string;
  lessonId: string;
  initialProgress?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
  className?: string;
}) {
  return (
    <LmsMediaPlayer
      videoProvider="FILE"
      videoSrc={src}
      lessonId={lessonId}
      initialProgress={initialProgress}
      onProgress={onProgress}
      className={className}
    />
  );
}
