import { createHmac, timingSafeEqual } from "crypto";

/** Default TTL for temporary media links handed to the player (seconds). */
export const SIGNED_MEDIA_TTL_SECONDS = 60 * 60; // 1 hour

type SignedMediaPayload = {
  lessonId: string;
  url: string;
  exp: number;
};

function signingSecret() {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    ""
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signBody(body: string) {
  const secret = signingSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function safeEqual(a: string, b: string) {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length === 0 || bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/** FILE / attachment URLs we wrap with temporary signed links (not YT/Vimeo). */
export function isSignableMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return false;
    if (host.includes("vimeo.com") || host.includes("player.vimeo.com")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a short-lived app URL: `/api/media?t=...&sig=...`
 * The token embeds lessonId + target URL + expiry (HMAC).
 */
export function createSignedMediaUrl(
  lessonId: string,
  targetUrl: string,
  ttlSeconds = SIGNED_MEDIA_TTL_SECONDS
): string | null {
  if (!isSignableMediaUrl(targetUrl)) return null;
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload: SignedMediaPayload = { lessonId, url: targetUrl, exp };
  const token = base64UrlEncode(JSON.stringify(payload));
  const sig = signBody(token);
  if (!sig) return null;
  const params = new URLSearchParams({ t: token, sig });
  return `/api/media?${params.toString()}`;
}

export function verifySignedMediaToken(
  token: string,
  sig: string
):
  | { ok: true; lessonId: string; url: string; exp: number }
  | { ok: false; reason: "bad_sig" | "expired" | "malformed" | "no_secret" } {
  if (!signingSecret()) return { ok: false, reason: "no_secret" };
  const expected = signBody(token);
  if (!expected || !safeEqual(expected, sig)) {
    return { ok: false, reason: "bad_sig" };
  }
  try {
    const payload = JSON.parse(base64UrlDecode(token)) as SignedMediaPayload;
    if (
      typeof payload.lessonId !== "string" ||
      typeof payload.url !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return { ok: false, reason: "malformed" };
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false, reason: "expired" };
    }
    if (!isSignableMediaUrl(payload.url)) {
      return { ok: false, reason: "malformed" };
    }
    return {
      ok: true,
      lessonId: payload.lessonId,
      url: payload.url,
      exp: payload.exp,
    };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

/** Replace signable media fields with temporary `/api/media` links. */
export function withSignedLessonMedia<
  T extends {
    id: string;
    videoProvider?: string | null;
    videoSrc?: string | null;
    pdfUrl?: string | null;
    resources?: { id?: string; title: string; url: string; mimeType?: string | null }[];
  },
>(lesson: T): T {
  const videoSrc =
    lesson.videoProvider === "FILE" && lesson.videoSrc
      ? createSignedMediaUrl(lesson.id, lesson.videoSrc) ?? lesson.videoSrc
      : lesson.videoSrc;

  const pdfUrl = lesson.pdfUrl
    ? createSignedMediaUrl(lesson.id, lesson.pdfUrl) ?? lesson.pdfUrl
    : lesson.pdfUrl;

  const resources = lesson.resources?.map((r) => ({
    ...r,
    url: createSignedMediaUrl(lesson.id, r.url) ?? r.url,
  }));

  return {
    ...lesson,
    videoSrc,
    pdfUrl,
    ...(resources ? { resources } : {}),
  };
}
