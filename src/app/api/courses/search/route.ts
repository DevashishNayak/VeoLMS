import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Lightweight typeahead for the header search.
 * GET /api/courses/search?q=react
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 80);

  if (q.length < 2) {
    return NextResponse.json({ courses: [] });
  }

  const courses = await prisma.course.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { subtitle: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      thumbnail: true,
      priceInPaise: true,
      instructor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return NextResponse.json(
    { courses },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
