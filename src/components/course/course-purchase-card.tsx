"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  Clock,
  FileText,
  Film,
  MonitorPlay,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutButton } from "@/components/payment/checkout-button";
import { CourseTrailerModal } from "@/components/course/course-trailer-modal";
import type { VideoProvider } from "@prisma/client";
import { cn, formatDuration, formatPrice } from "@/lib/utils";

type Trailer = {
  videoProvider?: VideoProvider | null;
  videoSrc?: string | null;
};

type Props = {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  thumbnail: string;
  priceInPaise: number;
  enrolled: boolean;
  progress: number;
  resumeLessonId?: string;
  accessNote: string;
  durationLabel: string;
  totalDuration: number;
  videoCount: number;
  articleCount: number;
  pdfCount: number;
  userName?: string;
  userEmail?: string;
  isLoggedIn: boolean;
  trailer?: Trailer | null;
  className?: string;
};

/** Shared height for price strip vs enrolled strip — avoids sticky-card jump. */
const STATUS_PANEL =
  "flex h-24 items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5";

function ProgressRing({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, value));

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(clamped));
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  const offset = c - (shown / 100) * c;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${clamped}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-emerald-700 transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function CoursePurchaseCard({
  courseId,
  courseSlug,
  courseTitle,
  thumbnail,
  priceInPaise,
  enrolled,
  progress,
  resumeLessonId,
  accessNote,
  durationLabel,
  totalDuration,
  videoCount,
  articleCount,
  pdfCount,
  userName,
  userEmail,
  isLoggedIn,
  trailer,
  className,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const canPreview = Boolean(trailer?.videoProvider && trailer?.videoSrc);

  // Always 5 rows — real counts when present, honest fallbacks when not —
  // so sticky card height stays stable across courses.
  const includes = [
    {
      key: "video",
      icon: MonitorPlay,
      label:
        videoCount > 0
          ? plural(videoCount, "video lesson", "video lessons")
          : "Structured lecture content",
    },
    {
      key: "article",
      icon: FileText,
      label:
        articleCount > 0
          ? plural(articleCount, "reading article", "reading articles")
          : "Reading notes & articles",
    },
    {
      key: "pdf",
      icon: Film,
      label:
        pdfCount > 0
          ? plural(pdfCount, "PDF resource", "PDF resources")
          : "Downloadable study materials",
    },
    {
      key: "duration",
      icon: Clock,
      label:
        totalDuration > 0
          ? `${formatDuration(totalDuration)} ${durationLabel}`
          : "Learn at your own pace",
    },
    {
      key: "progress",
      icon: Award,
      label: "Completion progress tracking",
    },
  ] as const;

  return (
    <>
      <Card className={cn("overflow-hidden shadow-lg", className)}>
        <div className="relative aspect-video bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
          {canPreview && (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-black/40 transition-colors hover:bg-black/50"
              aria-label="Play course preview"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg ring-4 ring-white/30 transition-transform duration-200 group-hover:scale-105 sm:h-16 sm:w-16">
                <Play className="h-7 w-7 fill-current pl-0.5" />
              </span>
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm sm:text-sm">
                Preview this course
              </span>
            </button>
          )}
        </div>
        <CardContent className="space-y-4 p-5">
          {enrolled ? (
            <div className={STATUS_PANEL}>
              <ProgressRing value={progress} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  You’re enrolled
                </p>
                <p className="text-xs text-muted-foreground">
                  {progress > 0
                    ? `${progress}% of lectures complete`
                    : "Ready when you are — start the first lecture"}
                </p>
              </div>
            </div>
          ) : priceInPaise === 0 ? (
            <div className={cn(STATUS_PANEL, "justify-between")}>
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  Free
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  No payment required
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-flex rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Enroll free
                </span>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Start today
                </p>
              </div>
            </div>
          ) : (
            <div className={cn(STATUS_PANEL, "justify-between")}>
              <div>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatPrice(priceInPaise)}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  One-time purchase
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="inline-flex rounded-full bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Lifetime
                </span>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Access forever
                </p>
              </div>
            </div>
          )}

          {/* Fixed CTA footprint so Buy now / Go to course align the same */}
          <div className="flex min-h-11 flex-col justify-center">
            {enrolled && resumeLessonId ? (
              <Button size="lg" className="h-11 w-full" asChild>
                <Link href={`/learn/${courseSlug}/${resumeLessonId}`}>
                  {progress > 0 ? "Continue learning" : "Go to course"}
                </Link>
              </Button>
            ) : enrolled ? (
              <Button size="lg" className="h-11 w-full" asChild>
                <Link href={`/dashboard`}>Go to dashboard</Link>
              </Button>
            ) : isLoggedIn ? (
              <CheckoutButton
                courseId={courseId}
                courseTitle={courseTitle}
                priceInPaise={priceInPaise}
                userName={userName}
                userEmail={userEmail}
                label={priceInPaise === 0 ? "Enroll for free" : "Buy now"}
              />
            ) : (
              <Button size="lg" className="h-11 w-full" asChild>
                <Link href={`/login?callbackUrl=/courses/${courseSlug}`}>
                  Log in to enroll
                </Link>
              </Button>
            )}
          </div>

          <p className="h-4 text-center text-xs leading-4 text-muted-foreground">
            {accessNote}
          </p>

          <div>
            <p className="text-sm font-semibold">This course includes:</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {includes.map(({ key, icon: Icon, label }) => (
                <li key={key} className="flex h-5 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-foreground" />
                  <span className="truncate">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <CourseTrailerModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview: ${courseTitle}`}
        videoProvider={trailer?.videoProvider}
        videoSrc={trailer?.videoSrc}
      />
    </>
  );
}
