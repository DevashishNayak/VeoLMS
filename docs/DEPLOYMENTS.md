# Deployments — one Vercel project

Use **one** Vercel project (`veo-lms`). Environments come from **git branches**, not from extra projects.

```
                    ┌─────────────────────┐
   git push main ──►│ Production          │──► Neon branch: main
                    │ veo-lms.vercel.app  │
                    └─────────────────────┘

 git push staging ─►│ Preview (staging)   │──► Neon branch: staging
                    │ *-git-staging-*.app │
                    └─────────────────────┘

git push develop ──►│ Preview (develop)   │──► Neon branch: staging*
                    │ *-git-develop-*.app │
                    └─────────────────────┘
```

\*Preview env vars are shared: all non-`main` branches use the Preview `DATABASE_URL` (Neon `staging`).

## Do not flip the “Production Branch”

Avoid changing Vercel’s Production Branch between `dev` / `stage` / `prod`. That swaps what `veo-lms.vercel.app` points at and risks shipping the wrong DB.

| Goal | Action |
|------|--------|
| Update **production** | `git push origin main` |
| Update **staging preview** | `git push origin staging` |
| Try something experimental | `git push origin develop` or open a PR |

## URLs

| Env | How you get it | Neon DB |
|-----|----------------|---------|
| **Production** | https://veo-lms.vercel.app | `main` |
| **Staging / Preview** | Deployments tab → latest **Preview** for branch `staging` | `staging` |
| **Local** | http://localhost:3000 (`.env` → Neon `staging`) | `staging` |

Open previews: [Vercel → veo-lms → Deployments](https://vercel.com/devashish-projects/veo-lms)

Optional stable staging hostname (same project):

1. Vercel → Project → **Settings → Domains**
2. Add a domain / subdomain
3. Assign it to Git branch **`staging`**

## Neon (same idea — branches, not new projects)

| Neon branch | Used by |
|-------------|---------|
| `main` | Production only |
| `staging` | Local + all Vercel Preview deploys |

Create more DB environments without a new Neon “project”:

```bash
neonctl branches create \
  --project-id lucky-glitter-50126763 \
  --org-id org-calm-glade-51982106 \
  --name feature-x \
  --parent staging
```

Wire it later via Preview env vars, or Neon’s GitHub integration (auto DB branch per PR).

## Vercel env vars (already on `veo-lms`)

| Vercel environment | When it applies | `DATABASE_URL` |
|--------------------|-----------------|----------------|
| **Production** | deploys from `main` | Neon `main` |
| **Preview** | deploys from any other branch / PR | Neon `staging` |
| **Development** | `vercel env pull` / `vercel dev` | Neon `preview` (optional) |

## Daily workflow

```bash
# Feature work (same DB as staging)
npm run dev                  # local → Neon staging

git checkout -b feature/foo
# ...code...
git push -u origin feature/foo
# → creates a Preview URL automatically (after GitHub is connected)

# Promote to shared staging branch
git checkout staging && git merge feature/foo && git push

# Release
git checkout main && git merge staging && git push
# → updates https://veo-lms.vercel.app (Neon main)
```

## Connect GitHub (one-time)

If auto Preview URLs are missing:

1. https://vercel.com/devashish-projects/veo-lms/settings/git  
2. Connect `DevashishNayak/VeoLMS`  
3. Production Branch = **`main`** (leave it)

Extra projects `veo-lms-staging` / `veo-lms-dev` are removed — use this flow instead.
