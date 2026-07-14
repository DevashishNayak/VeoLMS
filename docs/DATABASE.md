# Database — 2 Neon branches (matches Vercel)

Vercel has **Production** and **Preview** only → Neon keeps **two** branches:

| Vercel | Neon | Purpose |
|--------|------|---------|
| **Production** | `main` | Live site |
| **Preview** (+ local) | `dev` | Testers Preview URLs + `npm run dev` |

```
Production  →  Neon main
Preview     →  Neon dev
Local       →  Neon dev
```

Extra Neon branches (`preview`, `development`, `staging`) are leftovers — ignore them in the console; only **`main`** and **`dev`** are used.

## Safety

- Never point local `.env` at Neon `main` for daily coding  
- Never seed Neon `main` unless shipping intentionally  
