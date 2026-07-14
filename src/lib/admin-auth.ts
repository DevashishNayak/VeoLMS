import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type StaffSession = {
  user: {
    id: string;
    role: Role;
    name?: string | null;
    email?: string | null;
  };
};

export function isStaffRole(role: Role | string | undefined) {
  return role === "ADMIN" || role === "INSTRUCTOR";
}

/** ADMIN only — users, payments, global settings. */
export async function requireAdminSession(): Promise<StaffSession | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session as StaffSession;
}

/** ADMIN or INSTRUCTOR — course curriculum management. */
export async function requireStaffSession(): Promise<StaffSession | null> {
  const session = await auth();
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    return null;
  }
  return session as StaffSession;
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** Instructors only see/edit courses they own; admins see all. */
export function coursesOwnedWhere(session: StaffSession) {
  if (session.user.role === "ADMIN") return {};
  return { instructorId: session.user.id };
}

export async function assertCanManageCourse(
  session: StaffSession,
  courseId: string
): Promise<boolean> {
  if (session.user.role === "ADMIN") return true;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  return !!course && course.instructorId === session.user.id;
}

export async function assertCanManageSection(
  session: StaffSession,
  sectionId: string
): Promise<{ ok: true; courseId: string } | { ok: false }> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { courseId: true, course: { select: { instructorId: true } } },
  });
  if (!section) return { ok: false };
  if (
    session.user.role === "ADMIN" ||
    section.course.instructorId === session.user.id
  ) {
    return { ok: true, courseId: section.courseId };
  }
  return { ok: false };
}

export async function assertCanManageLesson(
  session: StaffSession,
  lessonId: string
): Promise<{ ok: true; courseId: string } | { ok: false }> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      section: {
        select: {
          courseId: true,
          course: { select: { instructorId: true } },
        },
      },
    },
  });
  if (!lesson) return { ok: false };
  if (
    session.user.role === "ADMIN" ||
    lesson.section.course.instructorId === session.user.id
  ) {
    return { ok: true, courseId: lesson.section.courseId };
  }
  return { ok: false };
}
