# Database

Two Neon branches (matches Vercel Production + Preview):

| Neon | Vercel | Used by |
|------|--------|---------|
| `main` | Production | https://veo-lms.vercel.app |
| `dev` | Preview | Preview URLs + local `npm run dev` |

No other Neon branches are used.

## Local Prisma + Next restart

`npm run dev` watches `prisma/schema.prisma`. After a schema edit — or after `npm run db:push` / `db:generate` / `db:migrate` — it regenerates the Prisma client and restarts Next so you don’t keep a stale client in memory.

Escape hatch (no auto-restart): `npm run dev:next`.

## Content model (lessons)

Lessons use `LessonType`: `VIDEO` | `TEXT` | `PDF`.

- **VIDEO** — `videoProvider` (`YOUTUBE` | `VIMEO` | `FILE`) + `videoSrc` (platform id or https URL)
- **TEXT** — markdown in `content`
- **PDF** — `pdfUrl`
- Optional **LessonResource** rows for extra downloads

Store large files in object storage (see `docs/STORAGE.md`); keep only URLs (or small thumbnail data URLs) in Postgres.

