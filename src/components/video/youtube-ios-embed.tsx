"use client";

/**
 * Native YouTube iframe for iOS Safari.
 * Vidstack’s YouTube provider often fails to start on iPhone (known
 * playsInline / load-strategy races). A plain embed with playsinline=1 works;
 * we optionally attach the IFrame API for progress when it loads.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { resumeWatchSeconds } from "@/lib/video-resume";

type Props = {
  videoId: string;
  title?: string;
  className?: string;
  initialProgress?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
  onEnded?: () => void;
};

type YtPlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          events?: {
            onReady?: (e: { target: YtPlayer }) => void;
            onStateChange?: (e: { data: number; target: YtPlayer }) => void;
          };
        }
      ) => YtPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoading: Promise<void> | null = null;

function loadYoutubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoading) return apiLoading;
  apiLoading = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    }
    const t = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(t);
        resolve();
      }
    }, 200);
  });
  return apiLoading;
}

function youtubeEmbedUrl(videoId: string, origin?: string) {
  const params = new URLSearchParams({
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
  });
  if (origin) params.set("origin", origin);
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`;
}

export function YoutubeIosEmbed({
  videoId,
  title = "Video",
  className,
  initialProgress = 0,
  onProgress,
  onEnded,
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const iframeId = `yt-ios-${reactId}`;
  const playerRef = useRef<YtPlayer | null>(null);
  const lastSaved = useRef(0);
  const completedSent = useRef(false);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  onProgressRef.current = onProgress;
  onEndedRef.current = onEnded;

  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const embedSrc = useMemo(
    () => youtubeEmbedUrl(videoId, origin || undefined),
    [videoId, origin]
  );

  useEffect(() => {
    let cancelled = false;
    let poll: number | undefined;
    lastSaved.current = 0;
    completedSent.current = false;

    void loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;
      const el = document.getElementById(iframeId);
      if (!el) return;

      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }

      playerRef.current = new window.YT.Player(iframeId, {
        events: {
          onReady: (e) => {
            const dur = e.target.getDuration() || 0;
            const resume = resumeWatchSeconds(initialProgress, dur);
            if (resume > 0) e.target.seekTo(resume, true);
          },
          onStateChange: (e) => {
            const YT = window.YT;
            if (!YT) return;
            if (e.data === YT.PlayerState.ENDED) {
              const seconds = Math.floor(e.target.getCurrentTime() || 0);
              if (!completedSent.current) {
                completedSent.current = true;
                onProgressRef.current?.(seconds, true);
              }
              onEndedRef.current?.();
            }
          },
        },
      });

      poll = window.setInterval(() => {
        const p = playerRef.current;
        if (!p) return;
        try {
          const seconds = Math.floor(p.getCurrentTime() || 0);
          const duration = p.getDuration() || 0;
          if (seconds <= 0) return;
          const nearEnd = duration > 0 && seconds / duration >= 0.9;
          if (nearEnd && !completedSent.current) {
            completedSent.current = true;
            onProgressRef.current?.(seconds, true);
            return;
          }
          if (Math.abs(seconds - lastSaved.current) >= 5) {
            lastSaved.current = seconds;
            onProgressRef.current?.(seconds, false);
          }
        } catch {
          /* player not ready */
        }
      }, 2500);
    });

    return () => {
      cancelled = true;
      if (poll) window.clearInterval(poll);
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, iframeId, initialProgress, embedSrc]);

  return (
    <div
      className={cn(
        "lms-media-player overflow-hidden rounded-xl bg-black",
        className
      )}
    >
      <iframe
        id={iframeId}
        title={title}
        src={embedSrc}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="aspect-video h-full w-full border-0"
      />
    </div>
  );
}
