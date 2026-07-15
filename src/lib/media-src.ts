import type { VideoProvider } from "@prisma/client";
import { parseYoutubeId } from "@/lib/utils";

export type LmsMediaSource =
  | { kind: "youtube"; src: `youtube/${string}`; id: string }
  | { kind: "vimeo"; src: `vimeo/${string}`; id: string }
  | { kind: "file"; src: string };

export type VideoRef = {
  videoProvider?: VideoProvider | null;
  videoSrc?: string | null;
};

/** Normalize DB video fields into a Vidstack `src`. */
export function resolveLmsMediaSource(input: VideoRef): LmsMediaSource | null {
  const provider = input.videoProvider;
  const src = input.videoSrc?.trim();
  if (!provider || !src) return null;

  if (provider === "YOUTUBE") {
    const id = parseYoutubeId(src) ?? src;
    return { kind: "youtube", src: `youtube/${id}`, id };
  }
  if (provider === "VIMEO") {
    const id = parseVimeoId(src) ?? src;
    return { kind: "vimeo", src: `vimeo/${id}`, id };
  }
  return { kind: "file", src };
}

export function parseVimeoId(input: string): string | null {
  const raw = input.trim();
  if (/^\d{6,12}$/.test(raw)) return raw;
  try {
    const u = new URL(raw);
    if (!u.hostname.includes("vimeo.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const id = parts.find((p) => /^\d{6,12}$/.test(p));
    return id ?? null;
  } catch {
    return null;
  }
}

/** Normalize admin form input into provider + src. */
export function normalizeVideoInput(input: {
  provider?: VideoProvider | "" | null;
  src?: string | null;
}): { videoProvider: VideoProvider; videoSrc: string } | null {
  const raw = (input.src ?? "").trim();
  if (!raw) return null;

  const provider = input.provider || undefined;

  if (provider === "FILE") {
    return { videoProvider: "FILE", videoSrc: raw };
  }
  if (provider === "YOUTUBE") {
    const yt = parseYoutubeId(raw);
    return yt ? { videoProvider: "YOUTUBE", videoSrc: yt } : null;
  }
  if (provider === "VIMEO") {
    const vimeo = parseVimeoId(raw);
    return vimeo ? { videoProvider: "VIMEO", videoSrc: vimeo } : null;
  }

  const yt = parseYoutubeId(raw);
  if (yt) return { videoProvider: "YOUTUBE", videoSrc: yt };
  const vimeo = parseVimeoId(raw);
  if (vimeo) return { videoProvider: "VIMEO", videoSrc: vimeo };
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return { videoProvider: "FILE", videoSrc: raw };
  }
  return null;
}
