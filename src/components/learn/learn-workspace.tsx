"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { VideoProvider } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Share2,
  Star,
} from "lucide-react";
import { LmsMediaPlayer } from "@/components/video/lms-media-player";
import { LearnSidebar } from "@/components/learn/learn-sidebar";
import { LearnStageSkeleton } from "@/components/learn/learn-stage-skeleton";
import { Button } from "@/components/ui/button";
import { postLessonProgress } from "@/lib/lesson-progress-client";
import {
  LEARN_SIDEBAR_COOKIE,
  LEARN_SIDEBAR_KEY,
  parseSidebarOpen,
  writeSidebarOpenPref,
} from "@/lib/learn-sidebar-pref";
import { cn, formatDuration } from "@/lib/utils";

type LessonType = "VIDEO" | "TEXT" | "PDF";

type Resource = { id: string; title: string; url: string };

type SectionRow = {
  id: string;
  title: string;
  lessons: {
    id: string;
    title: string;
    type: string;
    duration: number;
    isPreview: boolean;
  }[];
};

type NavLesson = { id: string; title: string } | null;

type TabId = "overview" | "resources" | "notes" | "review";

/** PDF keeps a tall consistent viewer; TEXT is dynamic (paper), not forced empty height. */
const STAGE_PDF =
  "relative flex h-[min(70vh,720px)] max-h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-xl border border-border bg-card";

const mdClass =
  "text-sm leading-relaxed text-foreground [&_a]:text-emerald-700 [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:mb-3";

function noteStorageKey(lessonId: string) {
  return `veolms:lesson-notes:${lessonId}`;
}

/** Udemy-style stage chevrons — mid of the lecture stage, reveal on hover. */
function StageNavButton({
  href,
  side,
  label,
  titleAttr,
}: {
  href: string;
  side: "left" | "right";
  label: string;
  titleAttr?: string;
}) {
  const isLeft = side === "left";
  return (
    <Link
      href={href}
      title={titleAttr}
      aria-label={
        isLeft
          ? `Previous lecture${titleAttr ? `: ${titleAttr}` : ""}`
          : `Next lecture${titleAttr ? `: ${titleAttr}` : ""}`
      }
      className={cn(
        "absolute top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 rounded-full",
        "border border-border bg-card/95 px-2.5 py-2 text-xs font-semibold text-foreground",
        "shadow-md backdrop-blur-sm transition hover:bg-card",
        isLeft ? "left-2 sm:left-3" : "right-2 sm:right-3",
        "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {isLeft ? (
        <>
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">{label}</span>
          <ChevronRight className="h-4 w-4" />
        </>
      )}
    </Link>
  );
}

export function LearnWorkspace({
  initialSidebarOpen = true,
  courseId,
  courseSlug,
  courseTitle,
  sectionTitle,
  lessonId,
  lessonIndex,
  lessonTotal,
  type,
  title,
  description,
  duration,
  videoProvider,
  videoSrc,
  content,
  pdfUrl,
  initialProgress,
  initiallyCompleted,
  resources,
  sections,
  accessibleIds,
  completedIds: initialCompletedIds,
  progressPercent: initialProgressPercent,
  prevLesson,
  nextLesson,
  canMutateProgress,
  userRating,
}: {
  /** From cookie so SSR / refresh match the last collapse choice. */
  initialSidebarOpen?: boolean;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  sectionTitle: string;
  lessonId: string;
  lessonIndex: number;
  lessonTotal: number;
  type: LessonType;
  title: string;
  description?: string | null;
  duration: number;
  videoProvider?: VideoProvider | null;
  videoSrc?: string | null;
  content?: string | null;
  pdfUrl?: string | null;
  initialProgress: number;
  initiallyCompleted: boolean;
  resources: Resource[];
  sections: SectionRow[];
  accessibleIds: string[];
  completedIds: string[];
  progressPercent: number;
  prevLesson: NavLesson;
  nextLesson: NavLesson;
  canMutateProgress: boolean;
  userRating: number | null;
}) {
  const router = useRouter();
  const params = useParams();
  const routeLessonId =
    typeof params?.lessonId === "string" ? params.lessonId : lessonId;
  /** URL moved, RSC props not yet — show skeleton instead of old lesson. */
  const isPending = routeLessonId !== lessonId;
  const stageRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const [sidebarHydrated, setSidebarHydrated] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");
  const [completedIds, setCompletedIds] = useState(initialCompletedIds);
  const [progressPercent, setProgressPercent] = useState(initialProgressPercent);
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [note, setNote] = useState("");
  const [shareToast, setShareToast] = useState(false);
  const [rating, setRating] = useState(userRating ?? 0);
  const [ratingSaving, setRatingSaving] = useState(false);
  /** Countdown seconds before auto-opening the next lecture (null = idle). */
  const [advanceIn, setAdvanceIn] = useState<number | null>(null);
  /** LMS standard: autoplay on open / lesson change (browser may still require gesture). */
  const [autoPlay, setAutoPlay] = useState(true);
  const seenLessonRef = useRef<string | null>(null);
  const advanceNavRef = useRef(false);

  const totalLessons = useMemo(
    () => sections.reduce((n, s) => n + s.lessons.length, 0),
    [sections]
  );

  const hasDescription = Boolean(description?.trim());
  const hasContent = Boolean(content?.trim());
  // Overview uses description + (for VIDEO/PDF) markdown notes. TEXT already shows content in-stage.
  const overviewBody =
    type === "TEXT"
      ? hasDescription
      : hasDescription || hasContent;
  const showResourcesTab = resources.length > 0;

  // Prefer localStorage when cookie is missing so collapsed stays collapsed after refresh.
  useEffect(() => {
    try {
      const fromLs = localStorage.getItem(LEARN_SIDEBAR_KEY);
      const hasCookie = document.cookie.includes(`${LEARN_SIDEBAR_COOKIE}=`);
      if (!hasCookie && (fromLs === "0" || fromLs === "1")) {
        const open = parseSidebarOpen(fromLs);
        setSidebarOpen(open);
        writeSidebarOpenPref(open);
      } else {
        writeSidebarOpenPref(sidebarOpen);
      }
    } catch {
      /* ignore */
    }
    setSidebarHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time migrate
  }, []);

  // When the list is hidden, the player gets wider/taller — keep it in the viewport.
  useEffect(() => {
    if (!sidebarHydrated || sidebarOpen || type !== "VIDEO") return;
    stageRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [sidebarOpen, sidebarHydrated, type]);

  useEffect(() => {
    setCompleted(initiallyCompleted);
    setCompletedIds(initialCompletedIds);
    setProgressPercent(initialProgressPercent);
  }, [initiallyCompleted, initialCompletedIds, initialProgressPercent]);

  useEffect(() => {
    try {
      setNote(localStorage.getItem(noteStorageKey(lessonId)) ?? "");
    } catch {
      setNote("");
    }
    setTab(overviewBody ? "overview" : showResourcesTab ? "resources" : "notes");
  }, [lessonId, overviewBody, showResourcesTab]);

  useEffect(() => {
    try {
      localStorage.setItem(noteStorageKey(lessonId), note);
    } catch {
      /* ignore */
    }
  }, [lessonId, note]);

  const recomputePercent = useCallback(
    (ids: string[]) => {
      if (totalLessons === 0) return 0;
      return Math.round((ids.length / totalLessons) * 100);
    },
    [totalLessons]
  );

  const markComplete = useCallback(
    async (id: string, next: boolean, watchedSeconds = 0) => {
      if (!canMutateProgress) return;
      const ok = await postLessonProgress({
        lessonId: id,
        watchedSeconds,
        completed: next,
      });
      if (!ok) return;

      setCompletedIds((prev) => {
        const set = new Set(prev);
        if (next) set.add(id);
        else set.delete(id);
        const arr = Array.from(set);
        setProgressPercent(recomputePercent(arr));
        return arr;
      });
      if (id === lessonId) setCompleted(next);
      router.refresh();
    },
    [canMutateProgress, lessonId, recomputePercent, router]
  );

  const completedRef = useRef(completed);
  completedRef.current = completed;

  const handleProgress = useCallback(
    async (seconds: number, done: boolean) => {
      if (!canMutateProgress) return;
      const firstComplete = done && !completedRef.current;
      await postLessonProgress({
        lessonId,
        watchedSeconds: seconds,
        ...(done ? { completed: true } : {}),
      });
      // Update local UI only — router.refresh() remounts the YouTube host and
      // seeks back to a near-end resume point, which looks like a replay reload.
      if (firstComplete) {
        completedRef.current = true;
        setCompleted(true);
        setCompletedIds((prev) => {
          if (prev.includes(lessonId)) return prev;
          const arr = [...prev, lessonId];
          setProgressPercent(recomputePercent(arr));
          return arr;
        });
      }
    },
    [canMutateProgress, lessonId, recomputePercent]
  );

  const nextHref =
    nextLesson && accessibleIds.includes(nextLesson.id)
      ? `/learn/${courseSlug}/${nextLesson.id}`
      : null;
  // Advance even if the access map hasn't refreshed after just completing this lesson.
  const nextAdvanceHref = nextLesson
    ? `/learn/${courseSlug}/${nextLesson.id}`
    : null;

  // Lesson change only — never clear the up-next countdown on progress refresh.
  useEffect(() => {
    advanceNavRef.current = false;
    setAdvanceIn(null);
    if (seenLessonRef.current === null) {
      seenLessonRef.current = lessonId;
      return;
    }
    if (seenLessonRef.current !== lessonId) {
      seenLessonRef.current = lessonId;
      setAutoPlay(true);
    }
  }, [lessonId]);

  // Udemy-style: after the video actually ends, countdown then open next lecture.
  const handleVideoEnded = useCallback(() => {
    if (!nextAdvanceHref || advanceNavRef.current) return;
    setAdvanceIn(3);
  }, [nextAdvanceHref]);

  useEffect(() => {
    if (advanceIn === null) return;

    if (advanceIn > 0) {
      const t = window.setTimeout(() => {
        setAdvanceIn((n) => (n == null || n <= 0 ? n : n - 1));
      }, 1000);
      return () => window.clearTimeout(t);
    }

    // advanceIn === 0 → navigate once (never deferred — cleanup used to cancel push)
    if (advanceNavRef.current) return;
    const href = nextAdvanceHref;
    if (!href) {
      setAdvanceIn(null);
      return;
    }
    advanceNavRef.current = true;
    setAutoPlay(true);
    setAdvanceIn(null);
    router.push(href);
  }, [advanceIn, nextAdvanceHref, router]);

  useEffect(() => {
    if (!canMutateProgress || completed) return;
    if (type !== "TEXT" && type !== "PDF") return;
    const ms = type === "TEXT" ? 8000 : 12000;
    const t = window.setTimeout(() => {
      void markComplete(lessonId, true, 0);
    }, ms);
    return () => window.clearTimeout(t);
  }, [canMutateProgress, completed, type, lessonId, markComplete]);

  async function shareLesson() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareToast(true);
        window.setTimeout(() => setShareToast(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  }

  async function submitRating(value: number) {
    if (!canMutateProgress) return;
    setRatingSaving(true);
    setRating(value);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, rating: value }),
      });
    } finally {
      setRatingSaving(false);
    }
  }

  const hasVideo = Boolean(videoProvider && videoSrc);
  /** Soft-hold the Vidstack instance under the skeleton — never hard-unmount on nav. */
  const holdVideoDuringPending = isPending && type === "VIDEO" && hasVideo;
  // Keep the player active during the up-next countdown so replay works.
  const playerActive = !isPending;
  const prevHref =
    prevLesson && accessibleIds.includes(prevLesson.id)
      ? `/learn/${courseSlug}/${prevLesson.id}`
      : null;

  const tabs = (
    [
      overviewBody ? ({ id: "overview", label: "Overview" } as const) : null,
      showResourcesTab
        ? ({
            id: "resources",
            label: "Resources",
            badge: resources.length,
          } as const)
        : null,
      { id: "notes", label: "Notes" } as const,
      { id: "review", label: "Review" } as const,
    ] as const
  ).filter(Boolean) as { id: TabId; label: string; badge?: number }[];

  const typeLabel =
    type === "VIDEO" ? "Video" : type === "PDF" ? "PDF" : "Article";

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href={`/courses/${courseSlug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {courseTitle}
          </Link>
          <span className="hidden text-muted-foreground sm:inline">/</span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {sectionTitle}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            Lecture {lessonIndex + 1} of {lessonTotal}
          </span>
          <button
            type="button"
            onClick={() => void shareLesson()}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Share2 className="h-3.5 w-3.5" />
            {shareToast ? "Copied" : "Share"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSidebarOpen((v) => {
                const next = !v;
                writeSidebarOpenPref(next);
                return next;
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
            aria-pressed={sidebarOpen}
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
            Content
          </button>
        </div>
      </div>

      {/* Workspace card — continuous column divider (avoids sticky cut borders). */}
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-4 sm:px-6">
        <div
          className={cn(
            "grid gap-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm",
            sidebarOpen
              ? "lg:grid-cols-[minmax(0,1fr)_360px] lg:divide-x lg:divide-border"
              : "lg:grid-cols-1"
          )}
        >
        <div className="min-w-0 px-4 py-4 sm:px-6">
          {/*
            VIDEO: height capped to viewport so controls stay on-screen when the
            sidebar collapses (full-width 16:9 can otherwise overflow).
            PDF: fixed tall viewer. TEXT: dynamic paper — not empty 70vh.
          */}
          <div
            ref={stageRef}
            className={cn(
              "group relative",
              (type === "VIDEO" || holdVideoDuringPending) &&
                "flex justify-center overflow-hidden rounded-xl border border-border bg-black",
              !isPending && type === "PDF" && STAGE_PDF,
              !isPending &&
                type === "TEXT" &&
                "min-h-[16rem] rounded-xl"
            )}
            aria-busy={isPending}
          >
            {/*
              VIDEO stays mounted while pending (auto-next / sidebar click).
              Hard-unmounting under a skeleton is what threw "provider destroyed".
            */}
            {type === "VIDEO" && hasVideo ? (
              <div
                className="relative w-full"
                style={{
                  aspectRatio: "16 / 9",
                  maxHeight: "calc(100dvh - 10rem)",
                  maxWidth: "min(100%, calc((100dvh - 10rem) * 16 / 9))",
                }}
              >
                <div
                  className={cn(
                    "h-full w-full",
                    isPending && "pointer-events-none invisible absolute inset-0"
                  )}
                  aria-hidden={isPending}
                >
                  <LmsMediaPlayer
                    videoProvider={videoProvider}
                    videoSrc={videoSrc}
                    title={title}
                    lessonId={lessonId}
                    initialProgress={initialProgress}
                    storedDuration={duration}
                    onProgress={handleProgress}
                    onEnded={handleVideoEnded}
                    autoPlay={autoPlay}
                    active={playerActive}
                    showControls={playerActive}
                    className="h-full w-full rounded-none [&_media-player]:!h-full [&_media-player]:!max-h-full"
                  />
                </div>
                {isPending ? (
                  <div className="absolute inset-0 z-[1]">
                    <LearnStageSkeleton />
                  </div>
                ) : null}
              </div>
            ) : null}

            {type === "VIDEO" && !hasVideo && !isPending ? (
              <div className="flex aspect-video w-full max-h-[calc(100dvh-10rem)] items-center justify-center text-sm text-muted-foreground">
                No video source configured
              </div>
            ) : null}

            {isPending && type !== "VIDEO" ? <LearnStageSkeleton /> : null}

            {!isPending && type === "PDF" && pdfUrl ? (
              <>
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    PDF lecture
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        if (canMutateProgress && !completed) {
                          void markComplete(lessonId, true, 0);
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Open PDF
                    </a>
                  </Button>
                </div>
                <iframe
                  title={title}
                  src={`${pdfUrl}#toolbar=1`}
                  className="min-h-0 w-full flex-1 bg-muted"
                />
              </>
            ) : null}

            {!isPending && type === "TEXT" ? (
              <div className="overflow-hidden rounded-xl border-2 border-zinc-300/90 bg-[#f7f4ef] shadow-[0_1px_2px_rgba(0,0,0,0.05),0_10px_28px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
                <div className="flex items-center justify-between border-b border-zinc-300/70 bg-[#efebe3] px-4 py-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                    Reading
                  </span>
                  {duration > 0 ? (
                    <span className="text-[11px] text-zinc-500">
                      {formatDuration(duration)}
                    </span>
                  ) : null}
                </div>
                <article
                  className={cn(
                    "mx-auto min-h-[12rem] max-w-3xl px-6 py-8 sm:px-10 sm:py-12",
                    mdClass
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || "_No content yet._"}
                  </ReactMarkdown>
                </article>
              </div>
            ) : null}

            {!isPending && prevHref ? (
              <StageNavButton
                href={prevHref}
                side="left"
                label="Prev"
                titleAttr={prevLesson?.title}
              />
            ) : null}
            {!isPending && nextHref ? (
              <StageNavButton
                href={nextHref}
                side="right"
                label="Next"
                titleAttr={nextLesson?.title}
              />
            ) : null}
          </div>

          {advanceIn != null && nextAdvanceHref && nextLesson ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
              <p className="text-emerald-900">
                Up next: <span className="font-semibold">{nextLesson.title}</span>
                {" · "}
                starting in {advanceIn}s
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-white/80"
                  onClick={() => setAdvanceIn(null)}
                >
                  Stay here
                </button>
                <Link
                  href={nextAdvanceHref}
                  className="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                  onClick={() => {
                    setAutoPlay(true);
                    setAdvanceIn(null);
                  }}
                >
                  Play now
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              {type === "VIDEO" && hasVideo ? (
                <>
                  Shortcuts:{" "}
                  <kbd className="rounded border border-border px-1">K</kbd> play ·{" "}
                  <kbd className="rounded border border-border px-1">J</kbd>/
                  <kbd className="rounded border border-border px-1">L</kbd> seek ·{" "}
                  <kbd className="rounded border border-border px-1">F</kbd>{" "}
                  fullscreen
                  {" · "}
                </>
              ) : null}
              Mark complete in the course list
              {prevHref || nextHref
                ? " · hover the lecture for Prev/Next"
                : ""}
            </p>
          )}

          {/* Single title block under stage (not repeated in a footer) */}
          <div className="mt-5">
            {isPending ? (
              <div className="space-y-2">
                <div className="h-7 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {title}
                  </h1>
                  <span className="text-xs text-muted-foreground">
                    {typeLabel}
                    {duration > 0 ? ` · ${formatDuration(duration)}` : ""}
                    {completed ? " · Completed" : ""}
                  </span>
                </div>
                {hasDescription ? (
                  <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </>
            )}
          </div>

          {/* Tabs — only panels that have a job */}
          <div
            className={cn(
              "mt-5 border-b border-border",
              isPending && "pointer-events-none opacity-50"
            )}
          >
            <nav
              className="-mb-px flex flex-wrap gap-1"
              aria-label="Lesson panels"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    tab === t.id
                      ? "border-emerald-700 text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                  {t.badge ? (
                    <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                      {t.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>
          </div>

          <div className={cn("mt-4 pb-8", isPending && "opacity-40")}>
            {tab === "overview" && overviewBody ? (
              <div className="space-y-4">
                {hasDescription && type !== "TEXT" ? (
                  <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
                {type !== "TEXT" && hasContent ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Lecture notes
                    </h2>
                    <div className={`mt-3 ${mdClass}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content!}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : null}
                {type === "TEXT" && hasDescription ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      About this reading
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === "resources" && showResourcesTab ? (
              <ul className="space-y-2 rounded-xl border border-border bg-card p-4">
                {resources.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {r.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            {tab === "notes" ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">
                  Private notes for this lecture — saved on this device (not synced
                  yet).
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={8}
                  placeholder="Jot down key takeaways…"
                  className="mt-2 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30"
                />
              </div>
            ) : null}

            {tab === "review" ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold">Rate this course</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {canMutateProgress
                    ? "Stored on your enrollment — same reviews as the course page."
                    : "Sign in and enroll to leave a rating."}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={!canMutateProgress || ratingSaving}
                      onClick={() => void submitRating(n)}
                      className="rounded p-0.5 disabled:opacity-50"
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6",
                          n <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Link
                  href={`/courses/${courseSlug}`}
                  className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
                >
                  Full course page & reviews →
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {sidebarOpen ? (
          <div className="min-h-0 border-t border-border lg:sticky lg:top-20 lg:max-h-[calc(100dvh-5.5rem)] lg:self-start lg:overflow-y-auto lg:border-t-0">
            <LearnSidebar
              courseSlug={courseSlug}
              currentLessonId={lessonId}
              pendingLessonId={isPending ? routeLessonId : null}
              accessibleIds={accessibleIds}
              completedIds={completedIds}
              progressPercent={progressPercent}
              canToggleComplete={canMutateProgress}
              onToggleComplete={(id, next) => void markComplete(id, next, 0)}
              sections={sections}
            />
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
