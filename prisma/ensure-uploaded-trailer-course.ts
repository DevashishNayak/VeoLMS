/**
 * Sample course whose landing trailer is a self-hosted mp4 (Blob or public CDN),
 * so you can compare UX vs YouTube trailers.
 */
import type { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";

/** Short CC-ish demo clip (reliable CDN). Not scraped from YouTube. */
const SAMPLE_MP4 = "https://www.w3schools.com/html/mov_bbb.mp4";

async function resolveTrailerUrl(): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.log("  No BLOB_READ_WRITE_TOKEN — using public sample mp4 URL");
    return SAMPLE_MP4;
  }

  try {
    const res = await fetch(SAMPLE_MP4);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const blob = await put(
      `veolms/video/sample-trailer-${Date.now()}.mp4`,
      buf,
      {
        access: "public",
        token,
        contentType: "video/mp4",
      }
    );
    console.log("  Uploaded sample trailer to Vercel Blob");
    return blob.url;
  } catch (e) {
    console.warn("  Blob upload skipped, using CDN URL:", e);
    return SAMPLE_MP4;
  }
}

export async function ensureUploadedTrailerCourse(
  prisma: PrismaClient,
  instructorId: string
) {
  const slug = "product-design-bootcamp";
  const existing = await prisma.course.findUnique({ where: { slug } });
  if (existing?.trailerSrc) {
    // Keep title short for a single-line hero (demo parenthetical belongs in description).
    if (existing.title !== "Product Design Bootcamp") {
      await prisma.course.update({
        where: { id: existing.id },
        data: { title: "Product Design Bootcamp" },
      });
    }
    console.log(`  Uploaded-trailer sample already present: /courses/${slug}`);
    return existing.id;
  }

  const trailerSrc = await resolveTrailerUrl();

  if (existing) {
    await prisma.course.update({
      where: { id: existing.id },
      data: {
        trailerProvider: "FILE",
        trailerSrc,
        title: "Product Design Bootcamp",
      },
    });
    console.log(`  Updated trailer for /courses/${slug}`);
    return existing.id;
  }

  const course = await prisma.course.create({
    data: {
      title: "Product Design Bootcamp",
      slug,
      description:
        "Demo course to compare a self-hosted / Blob promo video with YouTube trailers. Open the sticky purchase card and tap Preview — the mp4 plays in a large popup (Udemy-style).",
      thumbnail:
        "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=1200",
      priceInPaise: 79900,
      featured: true,
      published: true,
      deliveryType: "SELF_PACED",
      trailerProvider: "FILE",
      trailerSrc,
      instructorId,
      learningOutcomes: [
        "See uploaded trailers on the course page",
        "Compare Blob/CDN video with YouTube",
        "Use Free Preview lectures in the curriculum",
        "Preview before enroll with the sticky card",
      ],
      requirements: ["A modern browser", "Speakers or headphones"],
      sections: {
        create: [
          {
            title: "1. Getting oriented",
            order: 0,
            lessons: {
              create: [
                {
                  title: "Welcome",
                  type: "VIDEO",
                  videoProvider: "YOUTUBE" as const, videoSrc: "yfoY53QXEnI",
                  duration: 420,
                  order: 0,
                  isPreview: true,
                  description: "Curriculum Free Preview (YouTube lesson)",
                },
                {
                  title: "Design process overview",
                  type: "TEXT",
                  duration: 300,
                  order: 1,
                  isPreview: true,
                  content:
                    "## Process\n\nDiscover → Define → Design → Deliver.\n\nThis lesson is a Free Preview reading — separate from the landing trailer.",
                },
                {
                  title: "Deep dive (enrolled only)",
                  type: "VIDEO",
                  videoProvider: "YOUTUBE" as const, videoSrc: "JJSoEo8JSnc",
                  duration: 900,
                  order: 2,
                  isPreview: false,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`  Created uploaded-trailer sample: /courses/${slug}`);
  return course.id;
}
