import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const THUMBNAILS = {
  html: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800",
  css: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
  js: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800",
};

// FreeCodeCamp & popular tutorial YouTube IDs
const COURSES = [
  {
    title: "Complete HTML Course for Beginners",
    slug: "html-complete-course",
    description:
      "Master HTML from scratch. Learn tags, semantic HTML, forms, tables, and build real-world page structures. Perfect for absolute beginners starting their web development journey.",
    thumbnail: THUMBNAILS.html,
    priceInPaise: 49900,
    featured: true,
    sections: [
      {
        title: "HTML Fundamentals",
        order: 0,
        lessons: [
          { title: "Introduction to HTML", type: "VIDEO" as const, youtubeId: "qz0aGYrrlhU", duration: 720, order: 0, isPreview: true },
          { title: "HTML Document Structure", type: "VIDEO" as const, youtubeId: "PlxWf493en4", duration: 840, order: 1, isPreview: true },
          {
            title: "HTML Cheat Sheet (Reading)",
            type: "TEXT" as const,
            duration: 300,
            order: 2,
            isPreview: true,
            content: `# HTML Cheat Sheet

A quick reference for the tags you'll use most.

## Document skeleton

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Page title</title>
  </head>
  <body>
    <!-- content goes here -->
  </body>
</html>
\`\`\`

## Common tags

- **Headings:** \`h1\` … \`h6\`
- **Paragraphs:** \`p\`
- **Links:** \`a href="..."\`
- **Images:** \`img src="..." alt="..."\`
- **Lists:** \`ul\` / \`ol\` + \`li\`

> Tip: always write semantic HTML — it helps accessibility and SEO.
`,
          },
          { title: "Text Elements & Headings", type: "VIDEO" as const, youtubeId: "1PnVor36_40", duration: 600, order: 3, isPreview: false },
          { title: "Links and Images", type: "VIDEO" as const, youtubeId: "9OV1eJ2_euI", duration: 900, order: 4, isPreview: false },
          { title: "Lists and Tables", type: "VIDEO" as const, youtubeId: "wvEYFOn-3kk", duration: 780, order: 5, isPreview: false },
          { title: "HTML Forms", type: "VIDEO" as const, youtubeId: "fNcJuPIZ2WE", duration: 960, order: 6, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "CSS Crash Course — Modern Styling",
    slug: "css-crash-course",
    description:
      "Learn CSS from the ground up. Covers selectors, box model, flexbox, grid, responsive design, and modern layout techniques used in production websites.",
    thumbnail: THUMBNAILS.css,
    priceInPaise: 59900,
    featured: true,
    sections: [
      {
        title: "CSS Basics",
        order: 0,
        lessons: [
          { title: "CSS Introduction", type: "VIDEO" as const, youtubeId: "yfoY53QXEnI", duration: 660, order: 0, isPreview: true },
          { title: "Selectors & Specificity", type: "VIDEO" as const, youtubeId: "1Rs2ND4ryYc", duration: 720, order: 1, isPreview: false },
          { title: "Box Model Explained", type: "VIDEO" as const, youtubeId: "rIO-6z_ZiME", duration: 540, order: 2, isPreview: false },
          { title: "Flexbox Layout", type: "VIDEO" as const, youtubeId: "JJSoEo8JSnc", duration: 1200, order: 3, isPreview: false },
          { title: "CSS Grid", type: "VIDEO" as const, youtubeId: "EiNiSFIPIQE", duration: 900, order: 4, isPreview: false },
          { title: "Responsive Design", type: "VIDEO" as const, youtubeId: "sQk6mQZL7Zs", duration: 840, order: 5, isPreview: false },
        ],
      },
    ],
  },
  {
    title: "JavaScript Full Course for Beginners",
    slug: "javascript-full-course",
    description:
      "A comprehensive JavaScript course covering variables, functions, arrays, objects, DOM manipulation, async programming, and ES6+ features. Build a strong foundation for React and Node.js.",
    thumbnail: THUMBNAILS.js,
    priceInPaise: 79900,
    featured: true,
    sections: [
      {
        title: "JavaScript Core",
        order: 0,
        lessons: [
          { title: "JavaScript Introduction", type: "VIDEO" as const, youtubeId: "PkZNo7MFNFg", duration: 600, order: 0, isPreview: true },
          { title: "Variables and Data Types", type: "VIDEO" as const, youtubeId: "IsG4Xd6LlsM", duration: 780, order: 1, isPreview: false },
          { title: "Functions in JavaScript", type: "VIDEO" as const, youtubeId: "N8ap4k_4SqY", duration: 900, order: 2, isPreview: false },
          { title: "Arrays and Objects", type: "VIDEO" as const, youtubeId: "orIXdOPFWeM", duration: 840, order: 3, isPreview: false },
          { title: "DOM Manipulation", type: "VIDEO" as const, youtubeId: "5fbzHu5FZTs", duration: 960, order: 4, isPreview: false },
          { title: "Async JavaScript", type: "VIDEO" as const, youtubeId: "PoRJizFvM7s", duration: 1020, order: 5, isPreview: false },
        ],
      },
    ],
  },
];

async function main() {
  const adminHash = await bcrypt.hash("Admin@12345", 12);
  const studentHash = await bcrypt.hash("Student@12345", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@veolms.com" },
    update: {},
    create: {
      email: "admin@veolms.com",
      name: "VeoLMS Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "student@veolms.com" },
    update: {},
    create: {
      email: "student@veolms.com",
      name: "Demo Student",
      passwordHash: studentHash,
      role: "STUDENT",
    },
  });

  for (const courseData of COURSES) {
    const existing = await prisma.course.findUnique({
      where: { slug: courseData.slug },
      include: { sections: { include: { lessons: true } } },
    });
    if (existing) {
      // Ensure demo TEXT lesson exists on already-seeded DBs (schema upgrade path)
      if (courseData.slug === "html-complete-course") {
        const section =
          existing.sections.find((s) => s.title === "HTML Fundamentals") ??
          existing.sections[0];
        if (section) {
          const hasText = section.lessons.some(
            (l) => l.title === "HTML Cheat Sheet (Reading)"
          );
          if (!hasText) {
            const maxOrder = section.lessons.reduce(
              (m, l) => Math.max(m, l.order),
              -1
            );
            await prisma.lesson.create({
              data: {
                sectionId: section.id,
                title: "HTML Cheat Sheet (Reading)",
                type: "TEXT",
                duration: 300,
                order: maxOrder + 1,
                isPreview: true,
                content: `# HTML Cheat Sheet

A quick reference for the tags you'll use most.

## Document skeleton

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Page title</title>
  </head>
  <body>
    <!-- content goes here -->
  </body>
</html>
\`\`\`

## Common tags

- \`<h1>\`–\`<h6>\` — headings
- \`<p>\` — paragraph
- \`<a href="">\` — links
- \`<img src="" alt="">\` — images
- \`<ul>\` / \`<ol>\` + \`<li>\` — lists
- \`<form>\`, \`<input>\`, \`<button>\` — forms
`,
              },
            });
            console.log("  Added TEXT demo lesson to html-complete-course");
          }
        }
      }
      continue;
    }

    const { sections, ...courseFields } = courseData;
    await prisma.course.create({
      data: {
        ...courseFields,
        instructorId: admin.id,
        sections: {
          create: sections.map((section) => ({
            title: section.title,
            order: section.order,
            lessons: { create: section.lessons },
          })),
        },
      },
    });
  }

  console.log("Seed completed:");
  console.log("  Admin: admin@veolms.com / Admin@12345");
  console.log("  Student: student@veolms.com / Student@12345");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
