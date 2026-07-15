"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { VideoProvider } from "@prisma/client";
import {
  MediaPlayer,
  MediaProvider,
  Track,
  useMediaPlayer,
  useMediaState,
  isYouTubeProvider,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
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

function silencePlayer(player: MediaPlayerInstance) {
  // Pause + mute without saving mute into prefs (that made every lesson start muted).
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
  onProgress?: (seconds: number, completed: boolean) => void;
  autoPlay?: boolean;
  className?: string;
  /** Soft pause when false (e.g. trailer modal closing). */
  active?: boolean;
  /** Hide chrome instantly so controls cannot ghost over the page. */
  showControls?: boolean;
  /** WebVTT / SRT tracks for FILE (and some HTML5) sources. */
  captionTracks?: CaptionTrack[];
};

/** YouTube-style shortcuts (focus the player, then press). */
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
  initialProgress,
  onProgress,
}: {
  initialProgress: number;
  onProgress?: (seconds: number, completed: boolean) => void;
}) {
  const mediaPlayer = useMediaPlayer();
  const currentTime = useMediaState("currentTime");
  const duration = useMediaState("duration");
  const paused = useMediaState("paused");
  const ended = useMediaState("ended");
  const canPlay = useMediaState("canPlay");
  const lastSaved = useRef(0);
  const resumed = useRef(false);

  useEffect(() => {
    if (!canPlay || resumed.current || initialProgress <= 0 || !mediaPlayer) {
      return;
    }
    resumed.current = true;
    mediaPlayer.currentTime = initialProgress;
  }, [canPlay, initialProgress, mediaPlayer]);

  useEffect(() => {
    if (!onProgress || !Number.isFinite(currentTime)) return;
    const seconds = Math.floor(currentTime);
    const nearEnd = duration > 0 && currentTime / duration >= 0.9;
    const shouldSave =
      ended ||
      (!paused && Math.abs(seconds - lastSaved.current) >= 5) ||
      (paused && Math.abs(seconds - lastSaved.current) >= 2);

    if (!shouldSave && !ended) return;
    lastSaved.current = seconds;
    onProgress(seconds, Boolean(ended || nearEnd));
  }, [currentTime, duration, paused, ended, onProgress]);

  return null;
}

function onProviderChange(provider: MediaProviderAdapter | null) {
  if (isYouTubeProvider(provider)) {
    // Prefer English UI / caption preference when YouTube exposes CC tracks.
    provider.language = "en";
  }
}

/**
 * Unified LMS player — YouTube / Vimeo / FILE share one Vidstack UI.
 */
export function LmsMediaPlayer({
  videoProvider,
  videoSrc,
  title = "Video",
  lessonId,
  initialProgress = 0,
  onProgress,
  autoPlay = false,
  className,
  active = true,
  showControls = true,
  captionTracks = [],
}: LmsMediaPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const source = resolveLmsMediaSource({
    videoProvider,
    videoSrc,
  });

  useEffect(() => {
    installVidstackDestroyGuard();
    repairPlayerMutePref();
  }, []);

  useLayoutEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (!active) {
      silencePlayer(player);
      return;
    }

    // Unmute for visible playback; volume/speed come from prefs (not forced).
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
        /* autoplay may be blocked */
      });
  }, [active, autoPlay]);

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
    <div
      className={cn(
        "lms-media-player overflow-hidden rounded-xl bg-black",
        !showControls && "[&_.vds-controls]:hidden [&_.vds-controls-group]:hidden",
        className
      )}
    >
      <MediaPlayer
        key={`${lessonId ?? "promo"}-${source.src}`}
        id="veolms-player"
        ref={playerRef}
        className="h-full w-full font-sans outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        title={title}
        src={source.src}
        aspectRatio="16/9"
        playsInline
        autoPlay={autoPlay && active}
        load="visible"
        crossOrigin={source.kind === "file" ? "" : undefined}
        storage={veoPlayerPrefsStorage}
        keyTarget="player"
        keyShortcuts={LMS_KEY_SHORTCUTS}
        onProviderChange={onProviderChange}
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
        {(initialProgress > 0 || onProgress) && (
          <ResumeAndSave
            initialProgress={initialProgress}
            onProgress={onProgress}
          />
        )}
        {showControls ? (
          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            colorScheme="dark"
            // Quality / PiP / Cast only appear when the active provider supports them.
            // YouTube iframe: quality + PiP + Google Cast are owned by YouTube — not exposed here.
          />
        ) : null}
      </MediaPlayer>
    </div>
  );
}
