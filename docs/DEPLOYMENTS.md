# Deployments — one Vercel project, three environments

Vercel supports **Production / Preview / Development**.  
Neon mirrors that with **main / preview / development**.

```
git push main      →  Vercel Production  →  Neon main       →  https://veo-lms.vercel.app
git push <branch>  →  Vercel Preview     →  Neon preview    →  Preview URL (Deployments tab)
npm run dev        →  Vercel Development →  Neon development →  http://localhost:3000
```

## Do not flip the Production Branch

Leave Production Branch = **`main`**.  
Switching it to `staging`/`develop` would point the live URL at the wrong DB.

| Goal | Action | DB |
|------|--------|-----|
| Ship live | `git push origin main` | Neon `main` |
| Share with testers | `git push origin <branch>` → copy **Preview** URL | Neon `preview` |
| Build on laptop | `npm run dev` | Neon `development` |

## Tester URL (no fixed stage hostname required)

1. Push your branch  
2. Open [Deployments](https://vercel.com/devashish-projects/veo-lms) → **Preview**  
3. Send that link to the tester  

Optional later: Settings → Domains → assign a hostname to git branch `staging` for a stable QA URL.

## Env vars (on project `veo-lms`)

| Vercel env | `DATABASE_URL` Neon branch |
|------------|----------------------------|
| Production | `main` |
| Preview | `preview` |
| Development | `development` |

## Daily workflow

```bash
npm run dev                         # Neon development

git checkout -b feature/foo
git push -u origin feature/foo      # Preview URL → Neon preview

git checkout main
git merge feature/foo
git push origin main                # Production → Neon main
```
