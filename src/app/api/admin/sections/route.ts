import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sectionSchema } from "@/lib/validations";
import { z } from "zod";

const createSectionSchema = sectionSchema.extend({
  courseId: z.string().cuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const section = await prisma.section.create({ data: parsed.data });
  return NextResponse.json({ section }, { status: 201 });
}
