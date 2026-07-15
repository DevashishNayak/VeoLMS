"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/admin/file-upload-field";

export type VideoProviderValue = "" | "YOUTUBE" | "VIMEO" | "FILE";

type Props = {
  provider: VideoProviderValue;
  src: string;
  onProviderChange: (provider: VideoProviderValue) => void;
  onSrcChange: (src: string) => void;
  /** When provided, shows “Fetch duration” for YouTube/Vimeo. */
  durationSeconds?: number;
  onDurationChange?: (seconds: number) => void;
  idPrefix?: string;
  label?: string;
};

export function VideoSourceFields({
  provider,
  src,
  onProviderChange,
  onSrcChange,
  durationSeconds,
  onDurationChange,
  idPrefix = "video",
  label = "Video",
}: Props) {
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const srcLabel =
    provider === "VIMEO"
      ? "Vimeo id or URL"
      : provider === "FILE"
        ? "Video file URL"
        : provider === "YOUTUBE"
          ? "YouTube id or URL"
          : "Video id or URL";

  async function fetchDuration() {
    if (!src.trim() || !onDurationChange) return;
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/video-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider || "", src }),
      });
      const data = (await res.json()) as { duration?: number; error?: string };
      if (!res.ok || !data.duration) {
        setFetchError(data.error || "Could not read duration");
        return;
      }
      onDurationChange(data.duration);
    } catch {
      setFetchError("Could not read duration");
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-provider`}>{label} provider</Label>
        <Select
          id={`${idPrefix}-provider`}
          value={provider}
          onChange={(e) =>
            onProviderChange(e.target.value as VideoProviderValue)
          }
        >
          <option value="">Auto-detect from URL</option>
          <option value="YOUTUBE">YouTube</option>
          <option value="VIMEO">Vimeo</option>
          <option value="FILE">Uploaded / direct file</option>
        </Select>
      </div>
      {provider === "FILE" ? (
        <FileUploadField
          label={srcLabel}
          kind="video"
          value={src}
          onChange={onSrcChange}
          hint="Upload mp4/webm, or paste a CDN URL"
        />
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-src`}>{srcLabel}</Label>
          <Input
            id={`${idPrefix}-src`}
            value={src}
            onChange={(e) => onSrcChange(e.target.value)}
            placeholder={
              provider === "VIMEO"
                ? "76979871 or https://vimeo.com/76979871"
                : "dQw4w9WgXcQ or https://youtu.be/…"
            }
          />
        </div>
      )}
      {onDurationChange && provider !== "FILE" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!src.trim() || fetching}
            onClick={() => void fetchDuration()}
          >
            {fetching ? "Fetching…" : "Fetch duration from video"}
          </Button>
          {typeof durationSeconds === "number" && durationSeconds > 0 ? (
            <span className="text-xs text-muted-foreground">
              {Math.floor(durationSeconds / 60)}m {durationSeconds % 60}s
            </span>
          ) : null}
          {fetchError ? (
            <span className="text-xs text-destructive">{fetchError}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
