# Database

Two Neon branches (matches Vercel Production + Preview):

| Neon | Vercel | Used by |
|------|--------|---------|
| `main` | Production | https://veo-lms.vercel.app |
| `dev` | Preview | Preview URLs + local `npm run dev` |

No other Neon branches are used.

## Content model (lessons)

Lessons use `LessonType`: `VIDEO` | `TEXT` | `PDF`.

- **VIDEO** — `youtubeId` and/or `videoUrl` (self-hosted / CDN)
- **TEXT** — markdown in `content`
- **PDF** — `pdfUrl`
- Optional **LessonResource** rows for extra downloads

Store large files in object storage (see `docs/STORAGE.md`); keep only URLs (or small thumbnail data URLs) in Postgres.

