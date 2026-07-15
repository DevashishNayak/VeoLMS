import type { VideoProvider } from "@prisma/client";
import { parseYoutubeId } from "@/lib/utils";
import { normalizeVideoInput, parseVimeoId } from "@/lib/media-src";

function parseIso8601Duration(iso: string): number | null {
  const m = iso.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
  );
  if (!m) return null;
  const days = Number(m[1] || 0);
  const hours = Number(m[2] || 0);
  const mins = Number(m[3] || 0);
  const secs = Number(m[4] || 0);
  return Math.round(days * 86400 + hours * 3600 + mins * 60 + secs);
}

async function youtubeDurationSeconds(id: string): Promise<number | null> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (key) {
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/videos");
      url.searchParams.set("part", "contentDetails");
      url.searchParams.set("id", id);
      url.searchParams.set("key", key);
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = (await res.json()) as {
          items?: { contentDetails?: { duration?: string } }[];
        };
        const iso = data.items?.[0]?.contentDetails?.duration;
        if (iso) return parseIso8601Duration(iso);
      }
    } catch {
      /* fall through */
    }
  }

  // No API key: read lengthSeconds from the watch page player response.
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; VeoLMS/1.0; +https://localhost)",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/"lengthSeconds":"(\d+)"/) ||
      html.match(/\\"lengthSeconds\\":\\"(\d+)\\"/);
    if (m?.[1]) {
      const n = Number(m[1]);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
  } catch {
    return null;
  }
  return null;
}

async function vimeoDurationSeconds(id: string): Promise<number | null> {
  try {
    const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
      `https://vimeo.com/${id}`
    )}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { duration?: number };
    const n = Number(data.duration);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  } catch {
    return null;
  }
}

/** Resolve length in seconds for YouTube / Vimeo (FILE must be set manually). */
export async function resolveVideoDurationSeconds(input: {
  provider?: VideoProvider | "" | null;
  src?: string | null;
}): Promise<number | null> {
  const normalized = normalizeVideoInput({
    provider: input.provider,
    src: input.src,
  });
  if (!normalized) return null;

  if (normalized.videoProvider === "YOUTUBE") {
    const id = parseYoutubeId(normalized.videoSrc) ?? normalized.videoSrc;
    return youtubeDurationSeconds(id);
  }
  if (normalized.videoProvider === "VIMEO") {
    const id = parseVimeoId(normalized.videoSrc) ?? normalized.videoSrc;
    return vimeoDurationSeconds(id);
  }
  return null;
}
