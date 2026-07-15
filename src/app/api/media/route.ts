import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessLesson } from "@/lib/access";
import { verifySignedMediaToken } from "@/lib/signed-media";

/**
 * Temporary signed media delivery.
 * Token encodes lessonId + target URL + expiry; HMAC must match.
 * Access is re-checked server-side (preview / enrollment / staff).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("t") ?? "";
  const sig = searchParams.get("sig") ?? "";

  const verified = verifySignedMediaToken(token, sig);
  if (!verified.ok) {
    const status =
      verified.reason === "expired"
        ? 410
        : verified.reason === "no_secret"
          ? 503
          : 403;
    return NextResponse.json(
      { error: "Invalid or expired media link", code: verified.reason },
      { status }
    );
  }

  const session = await auth();
  const allowed = await canAccessLesson(session?.user?.id, verified.lessonId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Enrollment required", code: "LOCKED" },
      { status: 403 }
    );
  }

  return NextResponse.redirect(verified.url, {
    status: 302,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
