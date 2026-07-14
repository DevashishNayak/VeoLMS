# Submission Email Template

**To:** contact@procodrr.com  
**Subject:** VeoLMS Core Team Submission

---

## 1. Live Application URL

https://your-app.vercel.app

## 2. GitHub Repository

https://github.com/yourusername/veo-lms

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
YouTube embeds for video (no self-hosted storage). Unsplash URLs for course thumbnails. Zero storage/CDN cost.

### Security Considerations
- Server-side RBAC on all mutations
- Razorpay HMAC signature verification with timing-safe comparison
- Enrollment-gated lesson access
- Zod input validation on all APIs
- No secrets in client bundle

### Cost Optimization
Estimated monthly cost: **~₹0** on free tiers (Vercel Hobby + Neon Free + YouTube embeds). Avoided S3/CDN/video processing by using YouTube — acceptable trade-off for a demo LMS where content is already public on YouTube.

## 7. Why I Want To Join VeoLMS

[Write your personal motivation here — why open-source LMS interests you, what you bring to the team]

## 8. Challenges Faced

[Write about technical challenges, trade-offs, lessons learned — e.g. payment verification flow, video progress with YouTube API, balancing cost vs features]

---
