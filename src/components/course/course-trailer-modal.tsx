"use client";

import { useCallback, useEffect, useState } from "react";
import type { VideoProvider } from "@prisma/client";
import { X } from "lucide-react";
import { LmsMediaPlayer } from "@/components/video/lms-media-player";
import { installVidstackDestroyGuard } from "@/lib/vidstack-destroy-guard";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  videoProvider?: VideoProvider | null;
  videoSrc?: string | null;
};

/**
 * Keep the Vidstack instance mounted for the page lifetime after first open.
 * Closing only pauses + hides (display:none) + removes controls — never destroys
 * the YouTube/Vimeo provider (that triggers “provider destroyed”).
 */
export function CourseTrailerModal({
  open,
  onClose,
  title,
  videoProvider,
  videoSrc,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    installVidstackDestroyGuard();
  }, []);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  const requestClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, requestClose]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6",
        !open && "hidden"
      )}
      // When closed the player stays mounted — inert removes it from the a11y/focus tree
      // (aria-hidden alone still flags focusable descendants like media-player).
      inert={!open ? true : undefined}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close preview"
        tabIndex={open ? 0 : -1}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={requestClose}
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-label={title}
        className={cn(
          "relative z-10 w-full max-w-4xl overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10",
          open && "motion-safe:animate-[course-card-in_0.35s_ease-out]"
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
          <p className="min-w-0 truncate text-sm font-medium sm:text-base">
            {title}
          </p>
          <button
            type="button"
            onClick={requestClose}
            tabIndex={open ? 0 : -1}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="aspect-video bg-black">
          {/*
            While closed: keep MediaPlayer alive, strip controls, pause.
            display:none on the shell hides any leftover chrome.
          */}
          <LmsMediaPlayer
            videoProvider={videoProvider}
            videoSrc={videoSrc}
            title={title}
            playerId="veolms-trailer-player"
            autoPlay={open}
            active={open}
            showControls={open}
            className="rounded-none"
          />
        </div>
      </div>
    </div>
  );
}
