"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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
  const ref = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);

  const save = useCallback(
    (seconds: number, completed = false) => {
      if (Math.abs(seconds - lastSaved.current) < 5 && !completed) return;
      lastSaved.current = seconds;
      onProgress?.(seconds, completed);
    },
    [onProgress]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (initialProgress > 0) {
      const onMeta = () => {
        el.currentTime = Math.min(initialProgress, el.duration || initialProgress);
      };
      el.addEventListener("loadedmetadata", onMeta, { once: true });
    }
  }, [initialProgress, lessonId, src]);

  return (
    <div className={cn("overflow-hidden rounded-xl bg-black", className)}>
      <video
        ref={ref}
        key={`${lessonId}-${src}`}
        className="aspect-video w-full"
        src={src}
        controls
        controlsList="nodownload"
        onTimeUpdate={() => {
          const el = ref.current;
          if (!el) return;
          const nearEnd = el.duration > 0 && el.currentTime / el.duration >= 0.9;
          save(Math.floor(el.currentTime), nearEnd);
        }}
        onEnded={() => save(Math.floor(ref.current?.currentTime ?? 0), true)}
        onPause={() => save(Math.floor(ref.current?.currentTime ?? 0))}
      />
    </div>
  );
}
