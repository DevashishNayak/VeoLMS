"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Maximize, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

interface VideoPlayerProps {
  youtubeId: string;
  lessonId: string;
  initialProgress?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
  className?: string;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({
  youtubeId,
  lessonId,
  initialProgress = 0,
  onProgress,
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const saveProgress = useCallback(
    (seconds: number, completed = false) => {
      if (Math.abs(seconds - lastSavedRef.current) < 5 && !completed) return;
      lastSavedRef.current = seconds;
      onProgress?.(seconds, completed);
    },
    [onProgress]
  );

  const initPlayer = useCallback(() => {
    const YT = (window as Window & { YT?: { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YouTubePlayer } }).YT;
    if (!containerRef.current || !YT?.Player) return;
    playerRef.current?.destroy();

    new YT.Player(containerRef.current, {
      videoId: youtubeId,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
        origin: typeof window !== "undefined" ? window.location.origin : "",
      },
      events: {
        onReady: (event: { target: YouTubePlayer }) => {
          playerRef.current = event.target;
          const dur = event.target.getDuration();
          setDuration(dur);
          setReady(true);
          if (initialProgress > 0) {
            event.target.seekTo(initialProgress, true);
            setCurrentTime(initialProgress);
          }
        },
        onStateChange: (event: { data: number; target: YouTubePlayer }) => {
          const state = event.data;
          setPlaying(state === 1);

          if (state === 1) {
            progressIntervalRef.current = setInterval(() => {
              const t = event.target.getCurrentTime();
              setCurrentTime(t);
              const dur = event.target.getDuration();
              const nearEnd = dur > 0 && t / dur >= 0.9;
              saveProgress(Math.floor(t), nearEnd);
            }, 5000);
          } else {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            const t = event.target.getCurrentTime();
            setCurrentTime(t);
            if (state === 0) {
              saveProgress(Math.floor(t), true);
            } else if (state === 2) {
              saveProgress(Math.floor(t));
            }
          }
        },
      },
    });
  }, [youtubeId, initialProgress, saveProgress]);

  useEffect(() => {
    const win = window as Window & {
      YT?: { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YouTubePlayer };
      onYouTubeIframeAPIReady?: () => void;
    };

    if (win.YT?.Player) {
      initPlayer();
      return () => {
        progressIntervalRef.current && clearInterval(progressIntervalRef.current);
        playerRef.current?.destroy();
      };
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    win.onYouTubeIframeAPIReady = initPlayer;

    return () => {
      progressIntervalRef.current && clearInterval(progressIntervalRef.current);
      playerRef.current?.destroy();
    };
  }, [initPlayer, lessonId]);

  function togglePlay() {
    if (!playerRef.current) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }

  function seekRelative(delta: number) {
    if (!playerRef.current) return;
    const t = playerRef.current.getCurrentTime() + delta;
    playerRef.current.seekTo(Math.max(0, t), true);
  }

  function cycleSpeed() {
    if (!playerRef.current) return;
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    playerRef.current.setPlaybackRate(next);
    setSpeed(next);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!playerRef.current || !ready) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "f":
          e.preventDefault();
          containerRef.current?.requestFullscreen?.();
          break;
        case "m":
          setMuted((m) => !m);
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ready, playing]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-xl bg-black", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(!playing)}
    >
      <div ref={containerRef} className="aspect-video w-full" />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full bg-violet-500 transition-all"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setMuted((m) => !m)}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <span className="text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleSpeed}
              className="rounded px-2 py-1 text-xs font-medium hover:bg-white/20"
            >
              {speed}x
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => containerRef.current?.requestFullscreen?.()}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
