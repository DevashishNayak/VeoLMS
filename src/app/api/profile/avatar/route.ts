import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blobConfigured, uploadToBlob } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!blobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Avatar uploads need BLOB_READ_WRITE_TOKEN. Add it in Vercel/env, or paste an image URL in your profile.",
      },
      { status: 503 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const { url } = await uploadToBlob(file, "image", "veolms/avatars");
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { imageUrl: url },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        imageUrl: true,
        role: true,
      },
    });

    return NextResponse.json({ user, url });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to upload avatar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
