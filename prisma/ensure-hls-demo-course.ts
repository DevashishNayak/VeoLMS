/**
 * Idempotent demo course that plays a public multi-bitrate HLS playlist
 * so you can verify Vidstack quality switching (FILE + .m3u8).
 */
import type { PrismaClient } from "@prisma/client";

/** Well-known Mux test stream (ABR / quality ladder). */
export const HLS_DEMO_PLAYLIST =
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

const SLUG = "hls-streaming-demo";

export async function ensureHlsDemoCourse(
  prisma: PrismaClient,
  instructorId: string
) {
  const existing = await prisma.course.findUnique({
    where: { slug: SLUG },
    include: {
      sections: { include: { lessons: true }, orderBy: { order: "asc" } },
    },
  });

  if (existing) {
    const hasHls = existing.sections.some((s) =>
      s.lessons.some(
        (l) =>
          l.videoProvider === "FILE" &&
          (l.videoSrc?.includes(".m3u8") || l.videoSrc === HLS_DEMO_PLAYLIST)
      )
    );
    if (hasHls) {
      console.log(`  HLS demo already present: /courses/${SLUG}`);
      return existing.id;
    }
    const section =
      existing.sections[0] ??
      (await prisma.section.create({
        data: {
          courseId: existing.id,
          title: "1. HLS playback",
          order: 0,
        },
      }));
    await prisma.lesson.create({
      data: {
        sectionId: section.id,
        title: "HLS quality ladder (demo)",
        type: "VIDEO",
        videoProvider: "FILE",
        videoSrc: HLS_DEMO_PLAYLIST,
        duration: 634,
        order: section.lessons.length,
        isPreview: true,
        description: "Public Mux test stream — open Settings → Quality",
        content:
          "## What to try\n\n1. Play the lecture\n2. Open **Settings → Quality**\n3. Switch between Auto / resolutions\n\nThis lesson uses `videoProvider = FILE` with an `.m3u8` URL (no YouTube).",
      },
    });
    console.log(`  Added HLS lesson to /courses/${SLUG}`);
    return existing.id;
  }

  const course = await prisma.course.create({
    data: {
      title: "HLS Streaming Demo",
      slug: SLUG,
      description:
        "Smoke-test course for adaptive HLS in VeoLMS. The free preview lecture uses a public multi-bitrate .m3u8 playlist — open the player Settings menu and switch Quality (Auto / ladder). Same Vidstack UI as YouTube lessons, with FILE provider + HLS under the hood.",
      thumbnail:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200",
      priceInPaise: 0,
      featured: true,
      published: true,
      deliveryType: "SELF_PACED",
      trailerProvider: "FILE",
      trailerSrc: HLS_DEMO_PLAYLIST,
      instructorId,
      learningOutcomes: [
        "Confirm .m3u8 playback via videoProvider FILE",
        "See multi-bitrate Quality options in the LMS player",
        "Compare HLS FILE lessons vs YouTube embeds",
      ],
      requirements: ["A modern browser", "Network access to the demo CDN"],
      sections: {
        create: [
          {
            title: "1. HLS playback",
            order: 0,
            lessons: {
              create: [
                {
                  title: "HLS quality ladder (demo)",
                  type: "VIDEO",
                  videoProvider: "FILE",
                  videoSrc: HLS_DEMO_PLAYLIST,
                  duration: 634,
                  order: 0,
                  isPreview: true,
                  description: "Public Mux test stream — open Settings → Quality",
                  content:
                    "## What to try\n\n1. Play the lecture (Free Preview — no enrollment needed)\n2. Open **Settings → Quality**\n3. Switch between Auto and listed resolutions\n\nSource: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`",
                },
                {
                  title: "How VeoLMS stores HLS",
                  type: "TEXT",
                  duration: 180,
                  order: 1,
                  isPreview: true,
                  content: `# FILE + .m3u8

VeoLMS does not need a special \`HLS\` provider enum for basic playback:

- \`videoProvider\`: \`FILE\`
- \`videoSrc\`: URL to the master playlist (\`.m3u8\`)

Vidstack loads HLS (native Safari or hls.js). Packaging MP4 → HLS still happens in a transcoder (Mux, Cloudflare Stream, ffmpeg) — this course only proves **playback**.
`,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`  HLS demo course: /courses/${SLUG}`);
  return course.id;
}

/** Ensure web-dev-bootcamp also has a Free Preview HLS lecture (idempotent). */
export async function ensureHlsPreviewOnSampleCourse(prisma: PrismaClient) {
  const course = await prisma.course.findUnique({
    where: { slug: "web-dev-bootcamp" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course?.sections[0]) return;

  const section = course.sections[0];
  const exists = section.lessons.some(
    (l) => l.videoSrc === HLS_DEMO_PLAYLIST || l.title.includes("HLS quality")
  );
  if (exists) return;

  const maxOrder = section.lessons.reduce((m, l) => Math.max(m, l.order), -1);
  await prisma.lesson.create({
    data: {
      sectionId: section.id,
      title: "Bonus: HLS quality ladder (demo)",
      type: "VIDEO",
      videoProvider: "FILE",
      videoSrc: HLS_DEMO_PLAYLIST,
      duration: 634,
      order: maxOrder + 1,
      isPreview: true,
      description: "Free Preview — Settings → Quality for ABR",
      content:
        "Public Mux HLS test stream. Open **Settings → Quality** to switch resolutions.",
    },
  });
  console.log("  Added HLS Free Preview to /courses/web-dev-bootcamp");
}
