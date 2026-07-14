# Database environments
#
# | Environment | Where it runs              | Neon branch / DB              |
# |-------------|----------------------------|-------------------------------|
# | local       | your machine (`npm run dev`)| Local Postgres (`prisma dev`) |
# | development | `vercel env pull` / cloud  | Neon branch: `preview`        |
# | preview     | Vercel Preview / PR deploys| Neon branch: `staging`        |
# | production  | https://veo-lms.vercel.app | Neon branch: `main`           |
#
# Local and production are already separate.
# Preview no longer shares the production database.

## Local development (default)

Use `.env` (never commit it):

```env
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
DIRECT_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
```

Start local DB and seed:

```bash
npx prisma dev --detach   # local Postgres
npx prisma db push
npm run db:seed
npm run dev
```

## Production / Staging (Neon)

We use **Neon branches** (copy-on-write, cheap, fast):

```bash
# Create a new environment branch from production data
neonctl branches create \
  --project-id lucky-glitter-50126763 \
  --org-id org-calm-glade-51982106 \
  --name my-feature \
  --parent main

# Get connection string
neonctl connection-string my-feature \
  --project-id lucky-glitter-50126763 \
  --org-id org-calm-glade-51982106
```

Then set that URL as `DATABASE_URL` + `DIRECT_URL` on the matching Vercel environment.

## How to scale later

1. **Staging app** — create a Vercel "Preview" custom domain or a second Vercel project pointed at Neon `staging`.
2. **Ephemeral PR DBs** — Neon + Vercel can create a branch per PR (Neon GitHub integration).
3. **Protect production** — In Neon console, mark `main` as protected so it can't be deleted.
4. **Migrations** — run against `DIRECT_URL` (unpooled):

```bash
# Local
npx prisma migrate dev

# Against staging (example)
DIRECT_URL="postgresql://...staging..." DATABASE_URL="postgresql://...staging-pooler..." npx prisma migrate deploy
```

## Safety rules

- Never point local `.env` at Neon `main` while developing.
- Never run `db:seed` against production unless intentional.
- Prefer branching Neon for experiments instead of cloning whole projects.
