# Media storage (videos, images, PDFs)

VeoLMS supports **both** YouTube embeds and self-hosted files. Thumbnails can still be compressed data URLs or public HTTPS URLs.

## Playback (one player)

All sources use **Vidstack** (same controls as a modern LMS): 16:9 layout, keyboard shortcuts, speed, PiP, fullscreen, resume + progress for enrolled lessons. YouTube / Vimeo URL / uploaded mp4 should feel the same — only the CDN behind the video differs.

| Source | Typical LMS use |
|--------|------------------|
| YouTube / Vimeo | Free previews & marketing (cheap hosting) |
| Upload / Blob / Mux / R2 | Paid curriculum (control + no YT branding) |

## What to use when

| Asset | Recommended | Why |
|-------|-------------|-----|
| Lesson video (demo / challenge) | **YouTube** | Free hosting + CDN, no bandwidth bill |
| Lesson video (your own IP) | **Upload / CDN URL** | Full control; needs object storage |
| Images / PDFs / attachments | **Object storage URL** | Don’t put large blobs in Postgres |

## Free / cheap options

### 1. Vercel Blob (easiest with this repo)
- Works with `POST /api/admin/upload` when `BLOB_READ_WRITE_TOKEN` is set.
- Hobby: free within Vercel’s shared Hobby usage; exceeding limits **pauses** Blob until the period resets (not a surprise invoice).
- Good for **images + PDFs + small demos**. Heavy streaming video can burn transfer quickly.

**Setup**
1. Vercel dashboard → Storage → create **Blob** store.
2. Connect it to the VeoLMS project.
3. Copy `BLOB_READ_WRITE_TOKEN` into local `.env` and Vercel env (Preview + Production).
4. Redeploy.

Without the token, admin still works — use **Paste URL** for any public HTTPS file.

### 2. Cloudflare R2 (best long-term free-ish for video)
- Permanent free tier (approx.): **10 GB storage / month**, Class A/B op allowances, **$0 egress**.
- S3-compatible API → swap the storage helper later without changing the lesson schema (`videoSrc` for FILE / `pdfUrl` stay URLs).

### 3. Amazon S3
- **12-month** free tier (typical): ~**5 GB** storage, limited PUT/GET.
- After free tier, you pay for storage **and egress** (egress is the expensive part for video).
- Fine for production if you budget for bandwidth or put CloudFront in front; **not** “forever free”.

## Schema (already in Prisma)

Lessons are one of:

- `VIDEO` — `videoProvider` + `videoSrc` (YouTube/Vimeo id, or file URL)
- `TEXT` — markdown `content`
- `PDF` — `pdfUrl`
- Optional `LessonResource` rows for extra downloads

## Recommendation for VeoLMS

1. **Ship with both**: YouTube for curriculum demos + upload/URL for custom media.
2. For the challenge: prefer **YouTube + pasted public URLs**; add **Vercel Blob** if you want one-click uploads.
3. For real production scale: move blobs to **Cloudflare R2** (or S3 + CDN) and keep only URLs in Neon.

## HLS streaming (playback)

Vidstack plays **HLS** when `videoProvider = FILE` and `videoSrc` is a master `.m3u8` URL (quality ladder appears in Settings when the playlist is multi-bitrate).

**Try it:** seed creates `/courses/hls-streaming-demo` (and a Free Preview on `/courses/web-dev-bootcamp`) using Mux’s public test stream:

`https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`

Open the lecture → **Settings → Quality**. Packaging MP4 → HLS still needs a transcoder (Mux / Cloudflare Stream / ffmpeg) — VeoLMS only stores the playlist URL today.
