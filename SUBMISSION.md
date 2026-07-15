# Submission Email Template

**To:** contact@procodrr.com  
**Subject:** VeoLMS Core Team Submission

---

## 1. Live Application URL

https://veo-lms.vercel.app

## 2. GitHub Repository

https://github.com/DevashishNayak/VeoLMS

## 3. Admin Credentials

Email: admin@veolms.com  
Password: Admin@12345

## 4. Student Credentials

Email: student@veolms.com  
Password: Student@12345

## 5. Contact Information

Mobile Number: +91 XXXXXXXXXX  
WhatsApp Number: +91 XXXXXXXXXX

## 6. Architecture Explanation

### Tech Stack
Next.js 16 (App Router) + TypeScript + PostgreSQL (Neon) + Prisma + Auth.js + Razorpay + Tailwind CSS.

### Database Choice
PostgreSQL via Neon — relational model fits enrollments, payments, and lesson progress with ACID guarantees. Free tier is sufficient for this scale.

### Authentication Strategy
Auth.js with credentials provider. Passwords bcrypt-hashed. JWT sessions (24h). Middleware protects `/dashboard`, `/learn`, `/admin`.

### Deployment Strategy
Vercel for Next.js hosting (serverless, zero ops). Neon for managed Postgres. Environment variables for secrets.

### Storage Strategy
Primary lesson video via **YouTube / Vimeo embeds** (provider CDN + egress, not billed to us). Optional **Vercel Blob** for self-hosted FILE videos, PDFs, and profile avatars. Course thumbnails can use public URLs. No always-on media transcoding servers.

**Secure delivery:** authorized FILE/PDF/resource links are issued as short-lived HMAC URLs (`/api/media`) that re-check enrollment before redirecting. **HLS:** Vidstack plays `.m3u8` (demo course + quality ladder). **Tests:** Vitest coverage for OTP, access policy, Razorpay signatures, and signed media.

### Security Considerations
- Server-side RBAC on all mutations
- Email OTP at signup; bcrypt password hashing; JWT sessions
- Razorpay HMAC signature verification with timing-safe comparison (+ webhook enroll failsafe)
- Enrollment-gated lesson access / sanitized payloads for locked lessons
- Zod input validation on all APIs
- No secrets in client bundle

### Cost Optimization

#### Estimated monthly cost (demo / early stage)

| Service | Role | Typical cost |
|---------|------|----------------|
| **Vercel Hobby** | Next.js app (serverless) | ₹0 |
| **Neon Free** | PostgreSQL | ₹0 |
| **YouTube / Vimeo** | Video delivery | ₹0 (their bandwidth) |
| **Vercel Blob** | Optional FILE/PDF/avatar | Free/small usage tier |
| **Gmail SMTP / Resend free** | Signup OTP email | ₹0 (low volume) |
| **Razorpay Test** | Payments | ₹0 (no real money) |
| **Total** | | **~₹0 – ₹500/mo** |

At this scale there is no need for a ₹5,000/mo architecture (dedicated VM + always-on transcoder + paid CDN for every lesson).

#### Services used & why

1. **Vercel (serverless)** — Host App Router API + UI with zero server ops. Scales to zero when idle; fits assignment + early LMS traffic.  
2. **Neon (serverless Postgres)** — Relational data (users, enrollments, payments, progress) with ACID. Free tier covers demo load; no self-managed Postgres VM.  
3. **YouTube/Vimeo as default video** — Biggest cost win: no storage, no encoding farm, no egress bill for lesson streams. FILE via Blob only when needed.  
4. **Vercel Blob (optional)** — Simple object storage for uploads without running S3/MinIO. Trade-off vs R2/B2: slightly higher $/GB later, but same Vercel account and fewer moving parts for the challenge.  
5. **Gmail App Password / Resend free** — OTP without buying SMS or running mail servers.  
6. **Razorpay test mode** — Real payment *flow* without live settlement fees.

#### Trade-offs considered

| Choice | Alternative | Why we chose this |
|--------|-------------|-------------------|
| YouTube/Vimeo embeds | Self-host all video on R2 + BunnyCDN | Near-zero media cost for demo; trade-off = less DRM / public-CDN URLs. Enrollment still gates URLs in the app. |
| Vercel Blob | Cloudflare R2 / Backblaze B2 | Faster to ship with Next.js; would migrate hot FILE assets to R2 later if egress grew. |
| Serverless (Vercel + Neon) | Always-on VPS | Slightly colder starts, but no idle ₹/hour for 24×7 compute. |
| No FFmpeg farm | Always-on GPU/CPU transcoder | Prefer embed providers (or future: temporary Worker/job that shuts down after process). |
| Email OTP (not SMS) | Twilio/Firebase Phone Auth | Free/cheap for auth; SMS is pay-per-message. |

#### How this maps to “₹500 vs ₹5000”

We deliberately avoided: dedicated video servers, always-on encoding, multi-region Kubernetes, and charging ourselves for every streamed MB.  
**Outcome:** full LMS (auth, catalog, learn player, Razorpay enrollments, admin) on free/cheap tiers — same product goals with minimal monthly burn.

## 7. Why I Want To Join VeoLMS

[Write your personal motivation here — why open-source LMS interests you, what you bring to the team]

## 8. Challenges Faced

[Write about technical challenges, trade-offs, lessons learned — e.g. payment verification flow, video progress with YouTube API, balancing cost vs features]

---
