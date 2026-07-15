import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createSignedMediaUrl,
  isSignableMediaUrl,
  verifySignedMediaToken,
  withSignedLessonMedia,
} from "@/lib/signed-media";

describe("signed media URLs", () => {
  const prevSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-auth-secret-for-signed-media";
  });

  afterEach(() => {
    process.env.AUTH_SECRET = prevSecret;
  });

  it("treats Blob / CDN URLs as signable and skips YouTube/Vimeo", () => {
    expect(
      isSignableMediaUrl(
        "https://abc.public.blob.vercel-storage.com/veolms/video/x.mp4"
      )
    ).toBe(true);
    expect(
      isSignableMediaUrl("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8")
    ).toBe(true);
    expect(isSignableMediaUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      false
    );
    expect(isSignableMediaUrl("https://vimeo.com/123456789")).toBe(false);
  });

  it("creates a temporary signed path that verifies", () => {
    const signed = createSignedMediaUrl(
      "clesson123",
      "https://abc.public.blob.vercel-storage.com/lesson.mp4",
      3600
    );
    expect(signed).toMatch(/^\/api\/media\?/);

    const params = new URL(signed!, "http://localhost").searchParams;
    const verified = verifySignedMediaToken(
      params.get("t")!,
      params.get("sig")!
    );
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.lessonId).toBe("clesson123");
      expect(verified.url).toContain("lesson.mp4");
      expect(verified.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    }
  });

  it("rejects forged signatures and expired tokens", () => {
    const signed = createSignedMediaUrl(
      "clesson123",
      "https://cdn.example.com/paid.mp4",
      3600
    )!;
    const params = new URL(signed, "http://localhost").searchParams;
    expect(
      verifySignedMediaToken(params.get("t")!, "not-a-real-signature").ok
    ).toBe(false);

    const expired = createSignedMediaUrl(
      "clesson123",
      "https://cdn.example.com/paid.mp4",
      -10
    )!;
    const expiredParams = new URL(expired, "http://localhost").searchParams;
    const result = verifySignedMediaToken(
      expiredParams.get("t")!,
      expiredParams.get("sig")!
    );
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("rewrites FILE lesson media and resources to /api/media", () => {
    const lesson = withSignedLessonMedia({
      id: "clesson99",
      videoProvider: "FILE" as const,
      videoSrc: "https://cdn.example.com/unit1.mp4",
      pdfUrl: "https://cdn.example.com/notes.pdf",
      resources: [
        {
          id: "r1",
          title: "Slides",
          url: "https://cdn.example.com/slides.pdf",
          mimeType: "application/pdf",
        },
      ],
    });
    expect(lesson.videoSrc).toMatch(/^\/api\/media\?/);
    expect(lesson.pdfUrl).toMatch(/^\/api\/media\?/);
    expect(lesson.resources?.[0].url).toMatch(/^\/api\/media\?/);
  });

  it("does not rewrite YouTube sources", () => {
    const lesson = withSignedLessonMedia({
      id: "clesson99",
      videoProvider: "YOUTUBE" as const,
      videoSrc: "dQw4w9WgXcQ",
      pdfUrl: null,
    });
    expect(lesson.videoSrc).toBe("dQw4w9WgXcQ");
  });
});
