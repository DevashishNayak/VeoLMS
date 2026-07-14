# Deployments (dev / staging / production)

You get **three stable public URLs**, each with its own Neon database:

| Env | URL | Git branch (optional) | Neon DB branch | Vercel project |
|-----|-----|----------------------|----------------|----------------|
| **Production** | https://veo-lms.vercel.app | `main` | `main` | `veo-lms` |
| **Staging** | https://veo-lms-staging.vercel.app | `staging` | `staging` | `veo-lms-staging` |
| **Dev** | https://veo-lms-dev.vercel.app | `develop` | `preview` | `veo-lms-dev` |
| **Local** | http://localhost:3000 | any | `staging` (shared with Staging) | — |

## How to use day to day

- **Build features locally** → http://localhost:3000 (same data as Staging)
- **Share for testing** → https://veo-lms-staging.vercel.app
- **Experimental / throwaway cloud** → https://veo-lms-dev.vercel.app
- **Live users / submission** → https://veo-lms.vercel.app

## Redeploy an environment

Default CLI link is production (`veo-lms`). To deploy another:

```bash
# Staging
vercel link --yes --project veo-lms-staging
vercel --prod

# Dev
vercel link --yes --project veo-lms-dev
vercel --prod

# Back to production as default
vercel link --yes --project veo-lms
```

Or from the Vercel dashboard: open the project → Deployments → Redeploy.

## GitHub auto-deploy (recommended)

In each Vercel project → **Settings → Git**:

1. Connect `DevashishNayak/VeoLMS`
2. Set **Production Branch**:
   - `veo-lms` → `main`
   - `veo-lms-staging` → `staging`
   - `veo-lms-dev` → `develop`

Then:

```bash
git push origin develop   # → updates Dev URL
git push origin staging   # → updates Staging URL
git push origin main      # → updates Production URL
```

## Adding more environments later

1. `neonctl branches create --name qa --parent main ...`
2. `vercel project add veo-lms-qa`
3. Set `DATABASE_URL` / `DIRECT_URL` / `AUTH_URL` on that project
4. Deploy with `vercel --prod` after `vercel link --project veo-lms-qa`
