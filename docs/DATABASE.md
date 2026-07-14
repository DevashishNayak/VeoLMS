# Database environments

## Model (recommended)

**One Neon project**, multiple **branches**.  
**One Vercel project**, Production vs Preview.

| Where | Neon branch |
|-------|-------------|
| Local (`npm run dev`) | `staging` |
| Vercel Preview (`staging` / `develop` / PRs) | `staging` |
| Vercel Production (`main` → https://veo-lms.vercel.app) | `main` |

Production stays isolated. Local and Preview share staging so you don’t recreate data.

See also [DEPLOYMENTS.md](./DEPLOYMENTS.md).

## Why not “switch” production to stage?

Changing Vercel’s Production Branch or pointing local `.env` at Neon `main` mixes test data with live data. Prefer:

- code path: git branch  
- data path: Neon branch  

## Create another Neon environment

```bash
neonctl branches create \
  --project-id lucky-glitter-50126763 \
  --org-id org-calm-glade-51982106 \
  --name qa \
  --parent main

neonctl connection-string qa \
  --project-id lucky-glitter-50126763 \
  --org-id org-calm-glade-51982106
```

Then either:

- set that URL as Vercel **Preview** `DATABASE_URL`, or  
- use Neon ← GitHub integration for a DB branch per PR

## Safety

- Never use Neon `main` in local `.env` for daily work  
- Never seed production unless intentional  
- Prefer Neon branches over new Neon projects  
