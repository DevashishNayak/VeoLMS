# Database — matches Vercel’s 3 environments

Vercel has **three** environments. Neon has **three** matching branches:

| Vercel environment | Neon branch | Who uses it |
|--------------------|-------------|-------------|
| **Production** | `main` | Live site https://veo-lms.vercel.app |
| **Preview** | `preview` | Branch/PR Preview URLs (testers) |
| **Development** | `development` | Local `npm run dev` (+ `vercel env pull`) |

```
Vercel Production  ──►  Neon main
Vercel Preview     ──►  Neon preview
Vercel Development ──►  Neon development   ← your laptop .env
```

Ignore any leftover Neon branch named `staging` if it still appears in the console — it is unused.

## Local setup

`.env` should point at Neon **`development`** (already configured).

```bash
npm run dev
```

## Tester workflow

1. Push a non-`main` branch (e.g. `staging` or a feature branch)
2. Vercel creates a **Preview** deployment
3. Send the Preview URL to the tester  
   → that app uses Neon **`preview`**

Production stays on Neon **`main`**.

See [DEPLOYMENTS.md](./DEPLOYMENTS.md).

## Create another Neon branch later

```bash
neonctl branches create \
  --project-id lucky-glitter-50126763 \
  --org-id org-calm-glade-51982106 \
  --name qa \
  --parent preview
```

## Safety

- Do not put Neon `main` in local `.env` for daily work  
- Do not seed production unless intentional  
