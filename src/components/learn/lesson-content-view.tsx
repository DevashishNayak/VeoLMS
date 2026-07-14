"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Download } from "lucide-react";
import { VideoPlayer } from "@/components/video/video-player";
import { Html5VideoPlayer } from "@/components/video/html5-video-player";
import { Button } from "@/components/ui/button";

export type LessonContentProps = {
  lessonId: string;
  type: "VIDEO" | "TEXT" | "PDF";
  title: string;
  youtubeId?: string | null;
  videoUrl?: string | null;
  content?: string | null;
  pdfUrl?: string | null;
  initialProgress?: number;
  resources?: { id: string; title: string; url: string }[];
};

export function LessonContentView({
  lessonId,
  type,
  title,
  youtubeId,
  videoUrl,
  content,
  pdfUrl,
  initialProgress = 0,
  resources = [],
}: LessonContentProps) {
  async function handleProgress(seconds: number, completed: boolean) {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        watchedSeconds: seconds,
        completed,
      }),
    });
  }

  async function markComplete() {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        watchedSeconds: initialProgress,
        completed: true,
      }),
    });
  }

  return (
    <div className="space-y-6">
      {type === "VIDEO" && (
        <>
          {youtubeId ? (
            <VideoPlayer
              youtubeId={youtubeId}
              lessonId={lessonId}
              initialProgress={initialProgress}
              onProgress={handleProgress}
            />
          ) : null}
          {!youtubeId && videoUrl ? (
            <Html5VideoPlayer
              src={videoUrl}
              lessonId={lessonId}
              initialProgress={initialProgress}
              onProgress={handleProgress}
            />
          ) : null}
          {youtubeId && videoUrl ? (
            <details className="rounded-lg border border-border bg-card p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Alternate video file
              </summary>
              <div className="mt-3">
                <Html5VideoPlayer
                  src={videoUrl}
                  lessonId={`${lessonId}-file`}
                  initialProgress={0}
                  onProgress={handleProgress}
                />
              </div>
            </details>
          ) : null}
        </>
      )}

      {type === "PDF" && pdfUrl && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              {title}
            </p>
            <Button asChild size="sm" variant="outline">
              <a href={pdfUrl} target="_blank" rel="noreferrer" download>
                <Download className="h-4 w-4" />
                Download PDF
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
        <article className="rounded-xl border border-border bg-card p-6 text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_ul]:mb-3">
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
          <div className="mt-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_p]:mb-3 [&_ul]:mb-3 [&_li]:ml-4 [&_li]:list-disc">
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
                  rel="noreferrer"
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

      {(type === "TEXT" || type === "PDF") && (
        <Button type="button" onClick={() => void markComplete()}>
          Mark as complete
        </Button>
      )}
    </div>
  );
}
