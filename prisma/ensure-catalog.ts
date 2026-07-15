import type { PrismaClient } from "@prisma/client";

function clip(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  // Hard cut at a word boundary — never store "…" (UI uses line-clamp for overflow).
  const sliced = t.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > max * 0.55 ? sliced.slice(0, lastSpace) : sliced).trimEnd();
}

function stripStoredEllipsis(text: string) {
  return text.replace(/(?:\u2026|\.{3})+\s*$/g, "").trim();
}

const DEFAULT_OUTCOMES = [
  "Build real projects with clear guidance",
  "Learn core concepts through video lessons",
  "Practice with notes and downloadable resources",
  "Track progress through every lecture",
];

const CURATED_OUTCOMES: Record<string, string[]> = {
  "web-dev-bootcamp": [
    "Build multipage HTML with semantic tags",
    "Style layouts with Flexbox and CSS",
    "Write JavaScript for the DOM",
    "Ship a small project from idea to page",
    "Use the LMS player with progress tracking",
  ],
  "product-design-bootcamp": [
    "See uploaded trailers on the course page",
    "Compare Blob/CDN video with YouTube",
    "Use Free Preview lectures in the curriculum",
    "Preview before enroll with the sticky card",
  ],
};

/** Long-form descriptions so the course page “Show more” control can be tested. */
const CURATED_DESCRIPTIONS: Record<string, string> = {
  "web-dev-bootcamp": `A Udemy-style full course experience on VeoLMS. Mix of video lectures, reading articles, and PDF handouts — organized into clear sections with free previews so you can try before you enroll.

You'll go from HTML basics through styling and JavaScript fundamentals, then finish with a small project checklist. Each section builds on the last, so you can pause and resume without losing your place.

What this course covers
• Semantic HTML structure for multipage sites
• Flexbox and responsive CSS layouts used in production
• JavaScript fundamentals for DOM interactivity
• How to organize an LMS curriculum with previews and enrolled lessons
• Using progress tracking so you know what to study next

How to learn with VeoLMS
Open free Preview lectures from the curriculum without enrolling. After you enroll, the sticky purchase card becomes your progress hub — resume where you left off, and mark lectures complete as you go. Prefer reading? Several lectures include article content and downloadable PDF handouts alongside the videos.

Who this is for
Absolute beginners who want a realistic LMS experience, instructors evaluating how VeoLMS presents a mixed media course, and developers comparing trailer, curriculum, and player UX before building their own catalog.

By the end you will have built small pages, practiced CSS layout, written interactive scripts, and used the same patterns real students see when they buy a course on VeoLMS.`,
};

/** Hand-written pitches — complete sentences, no mid-cut. */
const CURATED_SUBTITLES: Record<string, string> = {
  "web-dev-bootcamp":
    "A full course mix of video lectures, articles, and PDF handouts — with free previews so you can try before you enroll.",
  "product-design-bootcamp":
    "Compare a self-hosted Blob promo trailer with YouTube. Open the sticky card and tap Preview to play the mp4.",
  "hls-streaming-demo":
    "Smoke-test adaptive HLS in VeoLMS. The free preview uses a public multi-bitrate playlist — switch Quality in the player.",
};

function ensureMinSentence(text: string, min: number, fallback: string) {
  const t = text.trim();
  if (t.length >= min) return t;
  return fallback;
}

/** Categories, subtitles, bios, and a sample review for course pages. */
export async function ensureCatalogExtras(prisma: PrismaClient) {
  const development = await prisma.category.upsert({
    where: { slug: "development" },
    create: { name: "Development", slug: "development" },
    update: { name: "Development" },
  });

  const webDev = await prisma.category.upsert({
    where: { slug: "web-development" },
    create: {
      name: "Web Development",
      slug: "web-development",
      parentId: development.id,
    },
    update: { name: "Web Development", parentId: development.id },
  });

  const design = await prisma.category.upsert({
    where: { slug: "design" },
    create: { name: "Design", slug: "design" },
    update: { name: "Design" },
  });

  const productDesign = await prisma.category.upsert({
    where: { slug: "product-design" },
    create: {
      name: "Product Design",
      slug: "product-design",
      parentId: design.id,
    },
    update: { name: "Product Design", parentId: design.id },
  });

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      subtitle: true,
      categoryId: true,
      learningOutcomes: true,
      requirements: true,
      instructorId: true,
    },
  });

  for (const c of courses) {
    const curatedSubtitle = CURATED_SUBTITLES[c.slug];
    const rawSubtitle = stripStoredEllipsis(c.subtitle?.trim() || "");
    const subtitle =
      curatedSubtitle ||
      ensureMinSentence(
        rawSubtitle || clip(c.description, 160),
        20,
        `Learn ${c.title} with practical, project-based lessons on VeoLMS.`
      );

    let categoryId = c.categoryId;
    if (!categoryId) {
      if (c.slug.includes("design") || c.slug.includes("product")) {
        categoryId = productDesign.id;
      } else {
        categoryId = webDev.id;
      }
    }

    let outcomes = CURATED_OUTCOMES[c.slug] ?? c.learningOutcomes.filter(Boolean);
    if (outcomes.length < 4 || outcomes.some((o) => o.length > 70)) {
      outcomes = DEFAULT_OUTCOMES;
    }
    outcomes = outcomes.slice(0, 12).map((o) => clip(o, 70));

    let requirements = c.requirements.filter(Boolean);
    if (requirements.length < 1) {
      requirements = [
        "A computer with internet access and a modern browser",
      ];
    }
    requirements = requirements.slice(0, 8).map((r) => clip(r, 150));

    const description =
      CURATED_DESCRIPTIONS[c.slug] ??
      (c.description.trim().length >= 80
        ? c.description
        : `${c.description.trim()}\n\nThis course on VeoLMS is structured into sections and lectures so you can learn at your own pace, preview selected content, and track completion as you go.`);

    await prisma.course.update({
      where: { id: c.id },
      data: {
        subtitle,
        categoryId,
        learningOutcomes: outcomes,
        requirements,
        description,
      },
    });
  }

  await prisma.user.updateMany({
    where: {
      role: { in: ["ADMIN", "INSTRUCTOR"] },
      OR: [{ bio: null }, { bio: "" }],
    },
    data: {
      bio: "Experienced instructor helping learners ship real projects with clear, practical teaching.",
    },
  });

  const student = await prisma.user.findUnique({
    where: { email: "student@veolms.com" },
    select: { id: true },
  });
  const bootcamp = await prisma.course.findUnique({
    where: { slug: "web-dev-bootcamp" },
    select: { id: true },
  });
  if (student && bootcamp) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: { userId: student.id, courseId: bootcamp.id },
      },
      create: { userId: student.id, courseId: bootcamp.id },
      update: {},
    });
    await prisma.courseReview.upsert({
      where: {
        courseId_userId: { courseId: bootcamp.id, userId: student.id },
      },
      create: {
        courseId: bootcamp.id,
        userId: student.id,
        rating: 5,
        comment:
          "Clear structure and the player resume feature makes it easy to learn in short sessions.",
      },
      update: {
        rating: 5,
        comment:
          "Clear structure and the player resume feature makes it easy to learn in short sessions.",
      },
    });
  }

  console.log("  Catalog extras: categories, subtitles, bios, sample review");
}
