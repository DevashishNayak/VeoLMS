import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      imageUrl: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: {
      name: string;
      bio: string | null;
      imageUrl?: string | null;
      passwordHash?: string;
    } = {
      name: parsed.data.name.trim(),
      bio: parsed.data.bio?.trim() ? parsed.data.bio.trim() : null,
    };

    if (parsed.data.imageUrl !== undefined) {
      data.imageUrl = parsed.data.imageUrl;
    }

    if (parsed.data.newPassword) {
      const ok = await bcrypt.compare(
        parsed.data.currentPassword ?? "",
        existing.passwordHash
      );
      if (!ok) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
      data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        imageUrl: true,
        role: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
