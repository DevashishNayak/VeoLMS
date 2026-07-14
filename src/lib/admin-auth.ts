import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
