import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Rewrite Unsplash CDN URLs for a target display width.
 * Next/Image still re-encodes to WebP/AVIF; this avoids requesting a 1200px
 * source when the card only shows ~400–800 CSS pixels.
 */
export function optimizeRemoteImageUrl(src: string, width: number): string {
  try {
    const url = new URL(src);
    if (!url.hostname.includes("images.unsplash.com")) return src;
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", "75");
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    return url.toString();
  } catch {
    return src;
  }
}

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** CSS sizes hint for responsive srcset (critical for Lighthouse). */
  sizes: string;
  /** Max source width to request from Unsplash before Next optimizes. */
  sourceWidth?: number;
  priority?: boolean;
};

/** Course / catalog thumbnail via next/image (WebP/AVIF + responsive sizes). */
export function CourseThumbnail({
  src,
  alt,
  className,
  sizes,
  sourceWidth = 800,
  priority = false,
}: Props) {
  const optimized = optimizeRemoteImageUrl(src, sourceWidth);

  if (!optimized.startsWith("http://") && !optimized.startsWith("https://")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn("object-cover", className)} />
    );
  }

  return (
    <Image
      src={optimized}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
