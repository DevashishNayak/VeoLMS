import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaffSession, forbidden } from "@/lib/admin-auth";
import { resolveVideoDurationSeconds } from "@/lib/video-duration";

const bodySchema = z.object({
  provider: z.enum(["YOUTUBE", "VIMEO", "FILE", ""]).optional().nullable(),
  src: z.string().min(1),
});

/** Staff helper: resolve YouTube/Vimeo length for the admin duration field. */
export async function POST(request: Request) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid video input" }, { status: 400 });
  }

  const duration = await resolveVideoDurationSeconds({
    provider: parsed.data.provider,
    src: parsed.data.src,
  });

  if (!duration) {
    return NextResponse.json(
      {
        error:
          "Could not read duration. Check the URL, or set seconds manually.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ duration });
}
