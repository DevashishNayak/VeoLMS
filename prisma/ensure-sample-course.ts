/** Append / upsert a Udemy-style demo course into the database (idempotent by slug). */
import type { PrismaClient } from "@prisma/client";

const SAMPLE_PDF =
  "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf";

export async function ensureUdemyStyleCourse(
  prisma: PrismaClient,
  instructorId: string
) {
  const slug = "web-dev-bootcamp";
  const existing = await prisma.course.findUnique({
    where: { slug },
    include: { sections: { include: { lessons: true } } },
  });
  if (existing && existing.sections.length >= 3) {
    console.log(`  Sample course already present: /courses/${slug}`);
    return existing.id;
  }

  if (existing) {
    await prisma.course.delete({ where: { id: existing.id } });
  }

  const course = await prisma.course.create({
    data: {
      title: "The Complete Web Development Bootcamp",
      slug,
      description:
        "A Udemy-style full course experience on VeoLMS. Mix of video lectures, reading articles, and PDF handouts — organized into clear sections with free previews so you can try before you enroll.\n\nYou'll go from HTML basics through styling and JavaScript fundamentals, then finish with a small project checklist.",
      thumbnail:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200",
      priceInPaise: 99900,
      featured: true,
      published: true,
      deliveryType: "SELF_PACED",
      instructorId,
      learningOutcomes: [
        "Build multipage HTML structures with semantic tags",
        "Style layouts with Flexbox and responsive CSS",
        "Write JavaScript for interactivity and the DOM",
        "Follow a project checklist from idea to shipped page",
        "Use a real LMS player with progress tracking",
      ],
      requirements: [
        "A laptop or desktop with a modern browser",
        "No prior coding experience required",
        "Ability to install free tools (VS Code recommended)",
      ],
      sections: {
        create: [
          {
            title: "1. Getting started",
            order: 0,
            lessons: {
              create: [
                {
                  title: "Welcome & how this course works",
                  type: "VIDEO",
                  youtubeId: "PkZNo7MFNFg",
                  duration: 480,
                  order: 0,
                  isPreview: true,
                  description: "Course walkthrough and learning tips",
                  content:
                    "## Tips\n\n- Watch at 1.25× if you prefer\n- Use **Mark as complete** after each lecture\n- Open free **Preview** lectures without enrolling",
                  resources: {
                    create: [
                      {
                        title: "Course outline (PDF sample)",
                        url: SAMPLE_PDF,
                        mimeType: "application/pdf",
                        order: 0,
                      },
                    ],
                  },
                },
                {
                  title: "Setup: browser + editor",
                  type: "TEXT",
                  duration: 360,
                  order: 1,
                  isPreview: true,
                  content: `# Developer setup

1. Install [VS Code](https://code.visualstudio.com/)
2. Install the **Live Server** extension
3. Create a folder \`my-first-site\`

\`\`\`bash
mkdir my-first-site && cd my-first-site
touch index.html styles.css app.js
\`\`\`

You're ready for HTML.
`,
                },
              ],
            },
          },
          {
            title: "2. HTML foundations",
            order: 1,
            lessons: {
              create: [
                {
                  title: "HTML document structure",
                  type: "VIDEO",
                  youtubeId: "qz0aGYrrlhU",
                  duration: 720,
                  order: 0,
                  isPreview: true,
                  content:
                    "Focus on `<!DOCTYPE html>`, `head`, and `body`. Semantic structure first.",
                },
                {
                  title: "Links, images & lists",
                  type: "VIDEO",
                  youtubeId: "9OV1eJ2_euI",
                  duration: 900,
                  order: 1,
                  isPreview: false,
                },
                {
                  title: "HTML cheat sheet",
                  type: "TEXT",
                  duration: 420,
                  order: 2,
                  isPreview: false,
                  content: `# HTML quick reference

| Tag | Use |
| --- | --- |
| \`h1\`–\`h6\` | Headings |
| \`p\` | Paragraph |
| \`a\` | Link |
| \`img\` | Image |
| \`ul\` / \`ol\` | Lists |

Always add meaningful \`alt\` text on images.
`,
                },
                {
                  title: "Forms worksheet (PDF)",
                  type: "PDF",
                  pdfUrl: SAMPLE_PDF,
                  duration: 600,
                  order: 3,
                  isPreview: false,
                  description: "Practice form layout against this worksheet",
                },
              ],
            },
          },
          {
            title: "3. CSS & layout",
            order: 2,
            lessons: {
              create: [
                {
                  title: "CSS selectors & box model",
                  type: "VIDEO",
                  youtubeId: "yfoY53QXEnI",
                  duration: 780,
                  order: 0,
                  isPreview: false,
                },
                {
                  title: "Flexbox layouts",
                  type: "VIDEO",
                  youtubeId: "JJSoEo8JSnc",
                  duration: 1200,
                  order: 1,
                  isPreview: false,
                  content:
                    "Practice: make a navbar with `display: flex` and `justify-content: space-between`.",
                },
                {
                  title: "Responsive checklist",
                  type: "TEXT",
                  duration: 300,
                  order: 2,
                  isPreview: false,
                  content: `# Responsive checklist

- [ ] Viewport meta tag present
- [ ] Fluid widths (\`%\` / \`max-width\`)
- [ ] One mobile breakpoint (\`@media (max-width: 768px)\`)
- [ ] Touch targets ≥ 44px
`,
                },
              ],
            },
          },
          {
            title: "4. JavaScript basics",
            order: 3,
            lessons: {
              create: [
                {
                  title: "Variables, functions & DOM",
                  type: "VIDEO",
                  youtubeId: "PkZNo7MFNFg",
                  duration: 900,
                  order: 0,
                  isPreview: false,
                },
                {
                  title: "Mini project brief",
                  type: "TEXT",
                  duration: 480,
                  order: 1,
                  isPreview: false,
                  content: `# Mini project

Build a **landing page** with:

1. Hero section + CTA button
2. Features grid (3 cards)
3. Contact form (HTML only is fine)

Bonus: toggle a dark mode class with JavaScript.
`,
                  resources: {
                    create: [
                      {
                        title: "Project rubric (PDF)",
                        url: SAMPLE_PDF,
                        mimeType: "application/pdf",
                        order: 0,
                      },
                    ],
                  },
                },
                {
                  title: "Congratulations & next steps",
                  type: "VIDEO",
                  youtubeId: "PoRJizFvM7s",
                  duration: 540,
                  order: 2,
                  isPreview: false,
                  content:
                    "You've finished the bootcamp path on VeoLMS. Enroll in the deeper HTML/CSS/JS courses next.",
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Enroll demo student for a ready "Continue learning" experience
  const student = await prisma.user.findUnique({
    where: { email: "student@veolms.com" },
  });
  if (student) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: { userId: student.id, courseId: course.id },
      },
      update: {},
      create: { userId: student.id, courseId: course.id },
    });
  }

  console.log(`  Created Udemy-style sample: /courses/${slug}`);
  return course.id;
}
