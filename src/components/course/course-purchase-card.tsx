"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  Clock,
  FileText,
  Film,
  MonitorPlay,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutButton } from "@/components/payment/checkout-button";
import { cn, formatDuration, formatPrice } from "@/lib/utils";

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
  className?: string;
};

function ProgressRing({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const size = 72;
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
          className="text-primary transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
        {clamped}%
      </span>
    </div>
  );
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
  className,
}: Props) {
  return (
    <Card className={cn("overflow-hidden shadow-lg", className)}>
      <div className="relative aspect-video bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="space-y-4 p-5">
        {enrolled ? (
          <div className="flex items-center gap-4 rounded-xl border border-primary/25 bg-primary/5 p-3 motion-safe:animate-[course-card-in_0.55s_ease-out]">
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
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-3xl font-bold tracking-tight">
            {priceInPaise === 0 ? "Free" : formatPrice(priceInPaise)}
          </p>
        )}

        {enrolled && resumeLessonId ? (
          <Button size="lg" className="w-full" asChild>
            <Link href={`/learn/${courseSlug}/${resumeLessonId}`}>
              {progress > 0 ? "Continue learning" : "Go to course"}
            </Link>
          </Button>
        ) : isLoggedIn ? (
          <CheckoutButton
            courseId={courseId}
            courseTitle={courseTitle}
            priceInPaise={priceInPaise}
            userName={userName}
            userEmail={userEmail}
          />
        ) : (
          <Button size="lg" className="w-full" asChild>
            <Link href={`/login?callbackUrl=/courses/${courseSlug}`}>
              Log in to enroll
            </Link>
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">{accessNote}</p>

        <div>
          <p className="text-sm font-semibold">This course includes:</p>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-foreground" />
              {videoCount} video lessons
            </li>
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-foreground" />
              {articleCount} reading articles
            </li>
            <li className="flex items-center gap-2">
              <Film className="h-4 w-4 text-foreground" />
              {pdfCount} PDF resources
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-foreground" />
              {formatDuration(totalDuration)} {durationLabel}
            </li>
            <li className="flex items-center gap-2">
              <Award className="h-4 w-4 text-foreground" />
              Completion progress tracking
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
