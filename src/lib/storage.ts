import { put } from "@vercel/blob";

export type UploadKind = "image" | "video" | "pdf" | "file";

const ALLOWED: Record<UploadKind, { mime: string[]; maxBytes: number }> = {
  image: {
    mime: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxBytes: 8 * 1024 * 1024,
  },
  video: {
    mime: ["video/mp4", "video/webm", "video/quicktime"],
    maxBytes: 200 * 1024 * 1024,
  },
  pdf: {
    mime: ["application/pdf"],
    maxBytes: 50 * 1024 * 1024,
  },
  file: {
    mime: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "video/mp4",
      "video/webm",
      "application/zip",
    ],
    maxBytes: 100 * 1024 * 1024,
  },
};

export function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadToBlob(
  file: File,
  kind: UploadKind,
  folder = "veolms"
): Promise<{ url: string }> {
  if (!blobConfigured()) {
    throw new Error(
      "File uploads need BLOB_READ_WRITE_TOKEN. Create a Vercel Blob store, or paste a public URL instead."
    );
  }
  const rules = ALLOWED[kind];
  if (!rules.mime.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > rules.maxBytes) {
    throw new Error(
      `File too large (max ${Math.round(rules.maxBytes / (1024 * 1024))}MB)`
    );
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const pathname = `${folder}/${kind}/${Date.now()}-${safeName}`;
  const blob = await put(pathname, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: file.type,
  });
  return { url: blob.url };
}
