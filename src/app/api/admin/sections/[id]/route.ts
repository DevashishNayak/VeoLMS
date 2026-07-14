import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sectionSchema } from "@/lib/validations";
import {
  assertCanManageSection,
  forbidden,
  requireStaffSession,
} from "@/lib/admin-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const { id } = await params;
  if (!(await assertCanManageSection(session, id)).ok) return forbidden();

  const body = await request.json();
  const parsed = sectionSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const section = await prisma.section.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ section });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const { id } = await params;
  if (!(await assertCanManageSection(session, id)).ok) return forbidden();

  await prisma.section.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
