"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FileUp, Link2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Kind = "image" | "video" | "pdf" | "file";

const ACCEPT: Record<Kind, string> = {
  image: "image/jpeg,image/png,image/webp,image/gif",
  video: "video/mp4,video/webm,video/quicktime",
  pdf: "application/pdf",
  file: "image/*,application/pdf,video/mp4,video/webm,.zip",
};

export function FileUploadField({
  value,
  onChange,
  label,
  kind,
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
  kind: Kind;
  hint?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploadsEnabled, setUploadsEnabled] = useState<boolean | null>(null);
  const [showUrl, setShowUrl] = useState(Boolean(value));

  useEffect(() => {
    void fetch("/api/admin/upload")
      .then((r) => r.json())
      .then((d) => setUploadsEnabled(Boolean(d.uploadsEnabled)))
      .catch(() => setUploadsEnabled(false));
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("kind", kind);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url as string);
      setShowUrl(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-primary hover:underline"
          >
            {value}
          </a>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => onChange("")}
            title="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT[kind]}
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || uploadsEnabled === false}
          onClick={() => inputRef.current?.click()}
          title={
            uploadsEnabled === false
              ? "Configure Vercel Blob to enable uploads"
              : undefined
          }
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileUp className="h-3.5 w-3.5" />
          )}
          {busy ? "Uploading…" : "Upload"}
        </Button>
        <button
          type="button"
          className={cn(
            "inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
          )}
          onClick={() => setShowUrl((v) => !v)}
        >
          <Link2 className="h-3.5 w-3.5" />
          {showUrl ? "Hide URL" : "Paste URL"}
        </button>
      </div>

      {showUrl && (
        <Input
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {uploadsEnabled === false && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Uploads offline — paste a public URL, or add BLOB_READ_WRITE_TOKEN (see docs/STORAGE.md).
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
