# Deployments — Production + Preview only

Vercel’s Deployments filter shows **two** environments (Hobby):

- **Production**
- **Preview**

There is **no Staging** environment on this plan. Don’t add a third Vercel project or wait for a Staging label.

## Naming (consistent)

| Layer | Production | Everything else |
|-------|------------|-----------------|
| **GitHub** | branch `main` (default) | any other branch (`stage`, `develop`, features…) |
| **Vercel** | **Production** → https://veo-lms.vercel.app | **Preview** → auto URL in Deployments |
| **Neon** | branch `main` | branch `dev` |

`main` stays `main` on GitHub — not `prod`.

## Flow

```
git push origin main
  → Vercel Production
  → Neon main
  → https://veo-lms.vercel.app

git push origin <any-other-branch>
  → Vercel Preview
  → Neon dev
  → Preview URL (send this to testers)

npm run dev
  → Neon dev (same as Preview)
  → http://localhost:3000
```

## How testers test

1. Push to `stage` / `develop` / a feature branch  
2. Open Vercel → Deployments → filter **Preview**  
3. Copy that deployment’s URL and share it  

Same Neon **`dev`** DB as your laptop — no re-creating data.

## Optional stable Preview hostname later

Project → Settings → Domains → assign a domain to git branch `stage` if you want something like `stage.yourdomain.com`. Still one Vercel project, still Preview env.

## Daily commands

```bash
npm run dev                      # Neon dev

git checkout -b feature/foo
git push -u origin feature/foo   # Preview URL

git checkout main
git merge feature/foo
git push origin main             # Production URL
```
