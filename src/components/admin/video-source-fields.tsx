"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FileUploadField } from "@/components/admin/file-upload-field";

export type VideoProviderValue = "" | "YOUTUBE" | "VIMEO" | "FILE";

type Props = {
  provider: VideoProviderValue;
  src: string;
  onProviderChange: (provider: VideoProviderValue) => void;
  onSrcChange: (src: string) => void;
  idPrefix?: string;
  label?: string;
};

export function VideoSourceFields({
  provider,
  src,
  onProviderChange,
  onSrcChange,
  idPrefix = "video",
  label = "Video",
}: Props) {
  const srcLabel =
    provider === "VIMEO"
      ? "Vimeo id or URL"
      : provider === "FILE"
        ? "Video file URL"
        : provider === "YOUTUBE"
          ? "YouTube id or URL"
          : "Video id or URL";

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
    </div>
  );
}
