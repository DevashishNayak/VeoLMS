# Database environments

## Recommended setup (solo / small team)

| What you use | Database | Purpose |
|--------------|----------|---------|
| **Local app** (`npm run dev`) | Neon branch **`staging`** | Day-to-day development — same data whenever you work |
| **Vercel Preview** | Neon branch **`staging`** | Test deploys with the same data |
| **Production** | Neon branch **`main`** | Live site only — never develop against this |

**Practice:** Keep **production** separate. You do **not** need a second “local-only” DB unless you want offline work.

If you create a course while developing locally, it is on `staging` — not production. Refresh local and it is still there. No re-creating.

## Why you had to recreate courses

| Place you created data | Where it lived |
|------------------------|----------------|
| Local (`localhost` Postgres) | Only your machine |
| Live site (`veo-lms.vercel.app`) | Neon **`main`** (production) |

Those were different databases. Creating on production does not appear locally, and vice versa. That was expected — but painful for active development.

Your local `.env` now uses Neon **`staging`**, so local + preview share one development DB.

## Optional: true offline local Postgres

Only if you need to work without internet:

```env
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
DIRECT_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
```

Then:

```bash
npx prisma dev --detach
npx prisma db push
npm run db:seed
```

## Creating more environments later

```bash
# Branch from production snapshot when you need a clean test DB
neonctl branches create \
  --project-id lucky-glitter-50126763 \
  --org-id org-calm-glade-51982106 \
  --name qa \
  --parent main

neonctl connection-string qa \
  --project-id lucky-glitter-50126763 \
  --org-id org-calm-glade-51982106
```

Point a Vercel Preview / new project at that URL.

## Safety rules

- Never put Neon **`main`** in local `.env` for daily coding.
- Never run `npm run db:seed` against production unless intentional.
- Prefer Neon branches over cloning whole projects.
