import "dotenv/config";
import { readFileSync } from "node:fs";
import { put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

const SAMPLE =
  "https://www.w3schools.com/html/mov_bbb.mp4";

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("Missing BLOB_READ_WRITE_TOKEN");

  const res = await fetch(SAMPLE);
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const blob = await put(`veolms/video/promo-big-buck-bunny.mp4`, buf, {
    access: "public",
    token,
    contentType: "video/mp4",
    allowOverwrite: true,
  });
  console.log("Blob URL:", blob.url);

  const prisma = new PrismaClient();
  await prisma.course.updateMany({
    where: { slug: "product-design-bootcamp" },
    data: { trailerVideoUrl: blob.url, trailerYoutubeId: null },
  });
  await prisma.$disconnect();
  console.log("Updated /courses/product-design-bootcamp");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
