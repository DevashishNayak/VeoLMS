import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations";
import {
  assertCanManageCourse,
  forbidden,
  requireStaffSession,
} from "@/lib/admin-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const { id } = await params;
  if (!(await assertCanManageCourse(session, id))) return forbidden();

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { resources: { orderBy: { order: "asc" } } },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ course });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const { id } = await params;
  if (!(await assertCanManageCourse(session, id))) return forbidden();

  const body = await request.json();
  const parsed = courseSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const { instructorId: requestedInstructor, ...data } = parsed.data;
  const updateData: typeof data & { instructorId?: string } = { ...data };

  if (session.user.role === "ADMIN" && requestedInstructor) {
    const instructor = await prisma.user.findFirst({
      where: {
        id: requestedInstructor,
        role: { in: ["ADMIN", "INSTRUCTOR"] },
      },
      select: { id: true },
    });
    if (!instructor) {
      return NextResponse.json(
        { error: "Instructor must be an ADMIN or INSTRUCTOR user" },
        { status: 400 }
      );
    }
    updateData.instructorId = instructor.id;
  }

  const course = await prisma.course.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json({ course });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const { id } = await params;
  if (!(await assertCanManageCourse(session, id))) return forbidden();

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
