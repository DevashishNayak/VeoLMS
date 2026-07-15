"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { VideoProvider } from "@prisma/client";
import {
  MediaPlayer,
  MediaProvider,
  Track,
  useMediaPlayer,
  useMediaState,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { cn } from "@/lib/utils";
import { resolveLmsMediaSource } from "@/lib/media-src";
import { installVidstackDestroyGuard } from "@/lib/vidstack-destroy-guard";
import {
  veoPlayerPrefsStorage,
  withSuppressedPlayerPrefs,
  repairPlayerMutePref,
} from "@/lib/player-prefs-storage";
import { resumeWatchSeconds } from "@/lib/video-resume";

function silencePlayer(player: MediaPlayerInstance) {
  withSuppressedPlayerPrefs(() => {
    try {
      player.muted = true;
    } catch {
      /* ignore */
    }
    void player.pause().catch(() => {
      /* ignore */
    });
  });
}

export type CaptionTrack = {
  src: string;
  label: string;
  language: string;
  kind?: "subtitles" | "captions" | "descriptions" | "chapters" | "metadata";
  default?: boolean;
};

export type LmsMediaPlayerProps = {
  videoProvider?: VideoProvider | null;
  videoSrc?: string | null;
  title?: string;
  lessonId?: string;
  initialProgress?: number;
  /** Stored curriculum length — used to self-heal bad DB values. */
  storedDuration?: number;
  /** DOM id for MediaPlayer — keep stable; unique if multiple players on one page. */
  playerId?: string;
  onProgress?: (seconds: number, completed: boolean) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  className?: string;
  active?: boolean;
  showControls?: boolean;
  captionTracks?: CaptionTrack[];
};

const LMS_KEY_SHORTCUTS = {
  togglePaused: "k Space",
  toggleMuted: "m",
  toggleFullscreen: "f",
  togglePictureInPicture: "i",
  toggleCaptions: "c",
  seekBackward: "j J ArrowLeft",
  seekForward: "l L ArrowRight",
  volumeUp: "ArrowUp",
  volumeDown: "ArrowDown",
  speedUp: ">",
  slowDown: "<",
};

function ResumeAndSave({
  lessonId,
  initialProgress,
  storedDuration = 0,
  onProgress,
  onEnded,
}: {
  lessonId?: string;
  initialProgress: number;
  storedDuration?: number;
  onProgress?: (seconds: number, completed: boolean) => void;
  onEnded?: () => void;
}) {
  const mediaPlayer = useMediaPlayer();
  const currentTime = useMediaState("currentTime");
  const duration = useMediaState("duration");
  const paused = useMediaState("paused");
  const ended = useMediaState("ended");
  const canPlay = useMediaState("canPlay");
  const lastSaved = useRef(0);
  const resumed = useRef(false);
  const endedFired = useRef(false);
  const completedSent = useRef(false);
  const syncedDuration = useRef(false);
  const lessonRef = useRef(lessonId);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  onProgressRef.current = onProgress;
  onEndedRef.current = onEnded;

  useEffect(() => {
    if (lessonRef.current === lessonId) return;
    lessonRef.current = lessonId;
    lastSaved.current = 0;
    resumed.current = false;
    endedFired.current = false;
    completedSent.current = false;
    syncedDuration.current = false;
  }, [lessonId]);

  useEffect(() => {
    if (!ended && endedFired.current && duration > 0 && currentTime < duration - 1.5) {
      endedFired.current = false;
    }
  }, [ended, currentTime, duration]);

  useEffect(() => {
    if (!canPlay || resumed.current || initialProgress <= 0 || !mediaPlayer) {
      return;
    }
    const dur = Number(duration) || 0;
    if (dur <= 0) return;
    const resume = resumeWatchSeconds(initialProgress, dur);
    resumed.current = true;
    if (resume <= 0) return;
    try {
      mediaPlayer.currentTime = resume;
    } catch {
      /* ignore */
    }
  }, [canPlay, initialProgress, mediaPlayer, lessonId, duration]);

  // Heal wrong/missing `lesson.duration` once we know the real media length.
  useEffect(() => {
    if (!lessonId || syncedDuration.current) return;
    const mediaDur = Math.round(Number(duration) || 0);
    if (!Number.isFinite(mediaDur) || mediaDur < 3) return;
    const prev = storedDuration || 0;
    const needs =
      prev <= 0 || Math.abs(prev - mediaDur) / Math.max(mediaDur, 1) > 0.05;
    if (!needs) {
      syncedDuration.current = true;
      return;
    }
    syncedDuration.current = true;
    void fetch(`/api/lessons/${lessonId}/duration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration: mediaDur }),
    }).catch(() => {
      syncedDuration.current = false;
    });
  }, [duration, lessonId, storedDuration]);

  useEffect(() => {
    const report = onProgressRef.current;
    if (!report || !Number.isFinite(currentTime)) return;
    const seconds = Math.floor(currentTime);
    const nearEnd = duration > 0 && currentTime / duration >= 0.9;
    const markDone = (ended || nearEnd) && !completedSent.current;
    const shouldSave =
      ended ||
      markDone ||
      (!paused && Math.abs(seconds - lastSaved.current) >= 5) ||
      (paused && Math.abs(seconds - lastSaved.current) >= 2);

    if (!shouldSave) return;
    lastSaved.current = seconds;
    if (markDone) completedSent.current = true;
    report(seconds, markDone);
  }, [currentTime, duration, paused, ended]);

  useEffect(() => {
    if (!ended || !onEndedRef.current || endedFired.current) return;
    endedFired.current = true;
    onEndedRef.current();
  }, [ended]);

  return null;
}

function VidstackPlayer({
  src,
  title = "Video",
  lessonId,
  initialProgress = 0,
  storedDuration = 0,
  playerId = "veolms-learn-player",
  onProgress,
  onEnded,
  autoPlay = false,
  className,
  active = true,
  showControls = true,
  captionTracks = [],
}: {
  src: string;
  title?: string;
  lessonId?: string;
  initialProgress?: number;
  storedDuration?: number;
  playerId?: string;
  onProgress?: (seconds: number, completed: boolean) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  className?: string;
  active?: boolean;
  showControls?: boolean;
  captionTracks?: CaptionTrack[];
}) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  /** Stable src applied after a short silence — avoids hard provider teardown races. */
  const [stableSrc, setStableSrc] = useState(src);

  useEffect(() => {
    installVidstackDestroyGuard();
    repairPlayerMutePref();
  }, []);

  useEffect(() => {
    if (src === stableSrc) return;
    const player = playerRef.current;
    if (player) silencePlayer(player);
    const t = window.setTimeout(() => setStableSrc(src), 180);
    return () => window.clearTimeout(t);
  }, [src, stableSrc]);

  useEffect(() => {
    return () => {
      const player = playerRef.current;
      if (player) silencePlayer(player);
    };
  }, []);

  useLayoutEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (!active) {
      silencePlayer(player);
      return;
    }

    withSuppressedPlayerPrefs(() => {
      try {
        player.muted = false;
      } catch {
        /* ignore */
      }
    });

    if (!autoPlay) return;
    void player
      .play()
      .then(() => {
        if (!activeRef.current) silencePlayer(player);
      })
      .catch(() => {
        /* autoplay blocked / provider swap */
      });
  }, [active, autoPlay, stableSrc]);

  return (
    <div
      className={cn(
        "lms-media-player overflow-hidden rounded-xl bg-black",
        !showControls &&
          "[&_.vds-controls]:hidden [&_.vds-controls-group]:hidden",
        className
      )}
    >
      <MediaPlayer
        id={playerId}
        ref={playerRef}
        className="h-full w-full font-sans outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        title={title}
        src={stableSrc}
        aspectRatio="16/9"
        playsInline
        autoPlay={autoPlay && active}
        load="eager"
        crossOrigin=""
        storage={veoPlayerPrefsStorage}
        keyTarget="player"
        keyShortcuts={LMS_KEY_SHORTCUTS}
        tabIndex={0}
      >
        <MediaProvider>
          {captionTracks.map((track) => (
            <Track
              key={`${track.language}-${track.src}`}
              kind={track.kind ?? "subtitles"}
              src={track.src}
              label={track.label}
              language={track.language}
              default={track.default}
            />
          ))}
        </MediaProvider>
        {(initialProgress > 0 ||
          onProgress ||
          onEnded ||
          (lessonId && storedDuration != null)) && (
          <ResumeAndSave
            lessonId={lessonId}
            initialProgress={initialProgress}
            storedDuration={storedDuration}
            onProgress={onProgress}
            onEnded={onEnded}
          />
        )}
        {showControls ? (
          <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme="dark" />
        ) : null}
      </MediaPlayer>
    </div>
  );
}

/** Unified entry — YouTube, Vimeo, and FILE all use Vidstack. */
export function LmsMediaPlayer(props: LmsMediaPlayerProps) {
  const {
    videoProvider,
    videoSrc,
    title,
    lessonId,
    initialProgress,
    storedDuration,
    playerId,
    onProgress,
    onEnded,
    autoPlay,
    className,
    active,
    showControls,
    captionTracks,
  } = props;

  const source = resolveLmsMediaSource({ videoProvider, videoSrc });

  if (!source) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground",
          className
        )}
      >
        No video source configured
      </div>
    );
  }

  return (
    <VidstackPlayer
      src={source.src}
      title={title}
      lessonId={lessonId}
      initialProgress={initialProgress}
      storedDuration={storedDuration}
      playerId={playerId}
      onProgress={onProgress}
      onEnded={onEnded}
      autoPlay={autoPlay}
      className={className}
      active={active}
      showControls={showControls}
      captionTracks={captionTracks}
    />
  );
}
