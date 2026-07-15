"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VideoProvider } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { LmsMediaPlayer } from "@/components/video/lms-media-player";
import { Button } from "@/components/ui/button";

export type LessonContentProps = {
  lessonId: string;
  type: "VIDEO" | "TEXT" | "PDF";
  title: string;
  videoProvider?: VideoProvider | null;
  videoSrc?: string | null;
  content?: string | null;
  pdfUrl?: string | null;
  initialProgress?: number;
  initiallyCompleted?: boolean;
  resources?: { id: string; title: string; url: string }[];
};

const mdClass =
  "text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:mb-3";

export function LessonContentView({
  lessonId,
  type,
  title,
  videoProvider,
  videoSrc,
  content,
  pdfUrl,
  initialProgress = 0,
  initiallyCompleted = false,
  resources = [],
}: LessonContentProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [saving, setSaving] = useState(false);

  async function handleProgress(seconds: number, done: boolean) {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        watchedSeconds: seconds,
        completed: done,
      }),
    });
    if (done) {
      setCompleted(true);
      router.refresh();
    }
  }

  async function markComplete() {
    setSaving(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        watchedSeconds: initialProgress,
        completed: true,
      }),
    });
    setCompleted(true);
    setSaving(false);
    router.refresh();
  }

  const hasVideo = Boolean(videoProvider && videoSrc);

  return (
    <div className="space-y-6">
      {type === "VIDEO" && hasVideo && (
        <div className="space-y-2">
          <LmsMediaPlayer
            videoProvider={videoProvider}
            videoSrc={videoSrc}
            title={title}
            lessonId={lessonId}
            initialProgress={initialProgress}
            onProgress={handleProgress}
          />
          <p className="text-xs text-muted-foreground">
            Click the player, then:{" "}
            <kbd className="rounded border border-border px-1">Space</kbd>/
            <kbd className="rounded border border-border px-1">K</kbd> play ·{" "}
            <kbd className="rounded border border-border px-1">J</kbd>/
            <kbd className="rounded border border-border px-1">←</kbd> back ·{" "}
            <kbd className="rounded border border-border px-1">L</kbd>/
            <kbd className="rounded border border-border px-1">→</kbd> forward ·{" "}
            <kbd className="rounded border border-border px-1">M</kbd> mute ·{" "}
            <kbd className="rounded border border-border px-1">F</kbd> fullscreen ·{" "}
            <kbd className="rounded border border-border px-1">C</kbd> captions ·{" "}
            <kbd className="rounded border border-border px-1">&lt;</kbd>/
            <kbd className="rounded border border-border px-1">&gt;</kbd> speed
          </p>
        </div>
      )}

      {type === "PDF" && pdfUrl && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              {title}
            </p>
            <Button asChild size="sm" variant="outline">
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4" />
                Open PDF
              </a>
            </Button>
          </div>
          <iframe
            title={title}
            src={`${pdfUrl}#toolbar=1`}
            className="h-[min(70vh,720px)] w-full bg-muted"
          />
        </div>
      )}

      {type === "TEXT" && (
        <article className={`rounded-xl border border-border bg-card p-6 ${mdClass}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || "_No content yet._"}
          </ReactMarkdown>
        </article>
      )}

      {type !== "TEXT" && content?.trim() && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Lesson notes
          </h2>
          <div className={`mt-3 ${mdClass}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      )}

      {resources.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Resources</h2>
          <ul className="mt-2 space-y-2">
            {resources.map((r) => (
              <li key={r.id}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  {r.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {completed ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Lecture completed
          </p>
        ) : (
          <Button type="button" onClick={() => void markComplete()} disabled={saving}>
            {saving ? "Saving…" : "Mark as complete"}
          </Button>
        )}
      </div>
    </div>
  );
}
