# Media storage (videos, images, PDFs)

VeoLMS supports **both** YouTube embeds and self-hosted files. Thumbnails can still be compressed data URLs or public HTTPS URLs.

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
- S3-compatible API → swap the storage helper later without changing the lesson schema (`videoUrl` / `pdfUrl` stay URLs).

### 3. Amazon S3
- **12-month** free tier (typical): ~**5 GB** storage, limited PUT/GET.
- After free tier, you pay for storage **and egress** (egress is the expensive part for video).
- Fine for production if you budget for bandwidth or put CloudFront in front; **not** “forever free”.

## Schema (already in Prisma)

Lessons are one of:

- `VIDEO` — `youtubeId` and/or `videoUrl`
- `TEXT` — markdown `content`
- `PDF` — `pdfUrl`
- Optional `LessonResource` rows for extra downloads

## Recommendation for VeoLMS

1. **Ship with both**: YouTube for curriculum demos + upload/URL for custom media.
2. For the challenge: prefer **YouTube + pasted public URLs**; add **Vercel Blob** if you want one-click uploads.
3. For real production scale: move blobs to **Cloudflare R2** (or S3 + CDN) and keep only URLs in Neon.
