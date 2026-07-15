import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireStaffSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const forSelect = new URL(request.url).searchParams.get("forSelect") === "1";

  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: { parent: { select: { name: true } } },
    take: forSelect ? 200 : 500,
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      parentName: c.parent?.name ?? null,
    })),
  });
}
