import { NextResponse } from "next/server";
import { forbidden, requireStaffSession } from "@/lib/admin-auth";
import { blobConfigured, uploadToBlob, type UploadKind } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireStaffSession();
  if (!session) return forbidden();
  return NextResponse.json({
    uploadsEnabled: blobConfigured(),
    provider: blobConfigured() ? "vercel-blob" : null,
    hint: blobConfigured()
      ? null
      : "Set BLOB_READ_WRITE_TOKEN (Vercel Blob) to enable uploads. You can still paste public URLs.",
  });
}

export async function POST(request: Request) {
  const session = await requireStaffSession();
  if (!session) return forbidden();

  const form = await request.formData();
  const file = form.get("file");
  const kind = (form.get("kind") as UploadKind) || "file";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!["image", "video", "pdf", "file"].includes(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  try {
    const { url } = await uploadToBlob(file, kind);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
