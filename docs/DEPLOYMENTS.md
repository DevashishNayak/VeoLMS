# Environments (final)

One Vercel project. Two sides only:

| | Production | Non-production |
|--|------------|----------------|
| **GitHub** | `main` | `dev` (default) + feature branches |
| **Vercel** | **Production** | **Preview** |
| **Neon** | `main` | `dev` |
| **URL** | https://veo-lms.vercel.app | Preview URL in Deployments |

```
main     → Vercel Production → Neon main → https://veo-lms.vercel.app
dev / *  → Vercel Preview    → Neon dev → Preview link for testers
local    → Neon dev          → http://localhost:3000
```

## Commands

```bash
npm run dev                 # local app → Neon dev

git checkout dev
git push -u origin dev      # Preview deploy → Neon dev

git checkout main
git merge dev
git push origin main        # Production → Neon main
```

## Tester

Push `dev` (or a feature branch) → Vercel → Deployments → **Preview** → copy URL.
