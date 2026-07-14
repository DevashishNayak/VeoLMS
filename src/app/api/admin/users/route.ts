import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAdminSession } from "@/lib/admin-auth";
import { pageMeta, parseListQuery } from "@/lib/admin-query";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).default("STUDENT"),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).optional(),
});

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const url = new URL(request.url);
  const { page, pageSize, q, skip } = parseListQuery(url);
  const role = url.searchParams.get("role"); // all | STUDENT | ADMIN
  const forSelect = url.searchParams.get("forSelect") === "1";

  if (forSelect) {
    const roleFilter = url.searchParams.get("role");
    const staffOnly = url.searchParams.get("staff") === "1";
    const users = await prisma.user.findMany({
      where: staffOnly
        ? { role: { in: ["ADMIN", "INSTRUCTOR"] } }
        : roleFilter === "STUDENT" ||
            roleFilter === "ADMIN" ||
            roleFilter === "INSTRUCTOR"
          ? { role: roleFilter }
          : undefined,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
      take: 500,
    });
    return NextResponse.json({ users });
  }

  const where: Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (role === "STUDENT" || role === "ADMIN" || role === "INSTRUCTOR") {
    where.role = role;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            payments: true,
            lessonProgress: true,
            courses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    users,
    meta: pageMeta(total, page, pageSize),
  });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: parsed.data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const body = await request.json();
  const id = z.string().cuid().safeParse(body.id);
  if (!id.success) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const data: {
    name?: string;
    email?: string;
    role?: "STUDENT" | "INSTRUCTOR" | "ADMIN";
    passwordHash?: string;
  } = {};

  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.email) data.email = parsed.data.email.toLowerCase();
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  try {
    const user = await prisma.user.update({
      where: { id: id.data },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) return forbidden();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
