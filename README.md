# VeoLMS — Learning Management System

A production-like LMS built for the **VeoLMS Core Team Selection Challenge**. Browse courses publicly, enroll via Razorpay test payments, watch lessons with progress tracking, and manage content through an admin dashboard.

## Live Demo

**https://veo-lms.vercel.app**

GitHub: https://github.com/DevashishNayak/VeoLMS


## Demo Credentials

| Role    | Email               | Password       |
|---------|---------------------|----------------|
| Admin   | admin@veolms.com    | Admin@12345    |
| Student | student@veolms.com  | Student@12345    |

## Tech Stack

| Layer        | Choice              | Why |
|--------------|---------------------|-----|
| Framework    | Next.js 16 (App Router) | Full-stack React, SSR, API routes, Vercel-native |
| Language     | TypeScript          | Type safety across frontend and backend |
| Database     | PostgreSQL (Neon)   | Relational data, enrollments, payments, progress |
| ORM          | Prisma 6            | Schema migrations, type-safe queries |
| Auth         | Auth.js (NextAuth v5) | JWT sessions, credentials provider, middleware |
| Payments     | Razorpay (test mode)| India-friendly, server-side signature verification |
| Video        | YouTube embeds      | Zero video hosting/CDN cost |
| Styling      | Tailwind CSS 4      | Responsive, modern UI |
| Testing      | Vitest              | Validation and payment signature tests |

## Architecture

```
┌─────────────┐     HTTPS      ┌──────────────────────────────┐
│   Browser   │ ─────────────► │  Vercel (Next.js App)        │
└─────────────┘                │  ├── Server Components (SSR)  │
                               │  ├── API Routes (mutations)   │
                               │  └── Middleware (auth/RBAC)    │
                               └──────────┬───────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │ Neon Postgres │    │   Razorpay   │    │   YouTube    │
            │  (free tier)  │    │  (test API)  │    │  (embeds)    │
            └──────────────┘    └──────────────┘    └──────────────┘
```

## Features

- **Public homepage** — hero, featured courses, search
- **Public course pages** — curriculum, preview lessons, trailer video
- **Auth** — signup, login, logout, JWT sessions
- **RBAC** — Student vs Admin roles with middleware protection
- **Payments** — Razorpay order creation + HMAC signature verification
- **Enrollment** — created only after verified payment (or free courses)
- **Student dashboard** — my courses, continue learning, progress, recently watched
- **Admin dashboard** — CRUD courses/sections/lessons, view students & enrollments
- **Video player** — keyboard shortcuts, speed control, progress saving, resume playback

## Security

- Passwords hashed with **bcrypt** (cost factor 12)
- **Server-side authorization** on every protected API route
- **Enrollment checks** before lesson access (preview lessons excepted)
- **Razorpay signature verification** with `crypto.timingSafeEqual`
- **Zod validation** on all API inputs
- **JWT sessions** with 24h expiry via Auth.js
- Admin routes protected by middleware + API role checks
- No secrets in client bundle (Razorpay secret server-only)
- Generic error messages in production API responses

## Cost Optimization (~₹0–₹200/month)

| Service        | Tier           | Est. Cost |
|----------------|----------------|-----------|
| Vercel         | Hobby (free)   | ₹0        |
| Neon PostgreSQL| Free (0.5 GB)  | ₹0        |
| YouTube embeds | Free           | ₹0        |
| Unsplash CDN   | Free thumbnails| ₹0        |
| Razorpay       | Test mode      | ₹0        |
| **Total**      |                | **~₹0**   |

**Trade-off:** YouTube embeds instead of self-hosted HLS saves storage and CDN costs but means videos are accessible via YouTube directly. For a portfolio LMS this is the right cost/feature balance.

## Database environments

Local, staging/preview, and production use **separate Postgres databases**.

See [docs/DATABASE.md](docs/DATABASE.md) for Neon branches and how to add stage/prod later.


### Setup

```bash
git clone <your-repo>
cd VeoLMS
npm install

cp .env.example .env
# Edit .env with DATABASE_URL, AUTH_SECRET, Razorpay keys

npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Razorpay Test Keys

1. Create account at [razorpay.com](https://razorpay.com)
2. Dashboard → Settings → API Keys → Generate Test Keys
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`

Test card: `4111 1111 1111 1111`, any future expiry, any CVV.

## Deployment

### 1. Neon PostgreSQL

1. Create free database at [neon.tech](https://neon.tech)
2. Copy connection string
3. Use pooled URL for `DATABASE_URL` (append `?sslmode=require`)
4. Use direct URL for migrations if needed

### 2. Vercel

1. Push repo to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET` (generate: `openssl rand -base64 32`)
   - `AUTH_URL` (your production URL)
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
4. Deploy
5. Run seed: `npx prisma db push && npm run db:seed` (via Vercel CLI or locally against prod DB)

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run test       # Run Vitest tests
npm run db:seed    # Seed courses and demo users
npm run db:push    # Push schema to database
```

## Submission Checklist

- [ ] Deploy to Vercel (or equivalent)
- [ ] Public GitHub repository
- [ ] Admin + Student credentials in email
- [ ] Architecture explanation (use sections above)
- [ ] Why you want to join VeoLMS
- [ ] Challenges faced

Email: **contact@procodrr.com**  
Subject: **VeoLMS Core Team Submission**

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & API
│   ├── api/              # REST endpoints
│   ├── admin/            # Admin dashboard
│   ├── courses/          # Public course pages
│   ├── dashboard/        # Student dashboard
│   └── learn/            # Video lesson player
├── components/           # React components
├── lib/                  # Auth, Prisma, validations, access control
└── middleware.ts         # Route protection
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Demo data (3 courses, 6 lessons each)
```

## License

MIT — built for the VeoLMS open-source project challenge.

## Environments

**One** Vercel project + git branches (not three projects). See [docs/DEPLOYMENTS.md](docs/DEPLOYMENTS.md).
