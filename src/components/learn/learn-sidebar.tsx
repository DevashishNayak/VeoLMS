"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  FileText,
  Film,
  Lock,
} from "lucide-react";
import { formatDuration, cn } from "@/lib/utils";

type LessonRow = {
  id: string;
  title: string;
  type: string;
  duration: number;
  isPreview: boolean;
};

type SectionRow = {
  id: string;
  title: string;
  lessons: LessonRow[];
};

export function LearnSidebar({
  courseSlug,
  sections,
  currentLessonId,
  pendingLessonId,
  accessibleIds,
  completedIds,
  progressPercent,
  onToggleComplete,
  canToggleComplete,
}: {
  courseSlug: string;
  sections: SectionRow[];
  currentLessonId: string;
  /** URL target while RSC catches up — keeps the row highlighted instantly. */
  pendingLessonId?: string | null;
  accessibleIds: string[];
  completedIds: string[];
  progressPercent: number;
  /** Udemy-style checkbox — toggle completion without navigating. */
  onToggleComplete?: (lessonId: string, completed: boolean) => void;
  canToggleComplete?: boolean;
}) {
  const router = useRouter();
  const accessible = useMemo(() => new Set(accessibleIds), [accessibleIds]);
  const completed = useMemo(() => new Set(completedIds), [completedIds]);
  const highlightId = pendingLessonId || currentLessonId;

  const currentSectionId =
    sections.find((s) => s.lessons.some((l) => l.id === highlightId))?.id ??
    sections[0]?.id;

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.id, s.id === currentSectionId]))
  );

  useEffect(() => {
    if (!currentSectionId) return;
    setOpen((s) => ({ ...s, [currentSectionId]: true }));
  }, [currentSectionId]);

  function typeIcon(type: string) {
    if (type === "PDF" || type === "TEXT") return FileText;
    return Film;
  }

  const total = sections.reduce((n, s) => n + s.lessons.length, 0);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-card">
      <div className="shrink-0 border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold">Course content</h2>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{progressPercent}% complete</span>
            <span>
              {completed.size}/{total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {sections.map((section) => {
          const doneInSection = section.lessons.filter((l) =>
            completed.has(l.id)
          ).length;
          const isOpen = open[section.id];
          return (
            <div key={section.id} className="border-b border-border/70">
              <button
                type="button"
                className="flex w-full cursor-pointer items-start gap-2 bg-muted/30 px-3 py-2.5 text-left hover:bg-muted/50"
                onClick={() =>
                  setOpen((s) => ({ ...s, [section.id]: !s[section.id] }))
                }
              >
                <ChevronDown
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 transition-transform",
                    isOpen ? "rotate-0" : "-rotate-90"
                  )}
                />
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
                  {section.title}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {doneInSection}/{section.lessons.length}
                </span>
              </button>
              {isOpen &&
                section.lessons.map((l) => {
                  const can = accessible.has(l.id);
                  const isCurrent = l.id === highlightId;
                  const isDone = completed.has(l.id);
                  const Icon = typeIcon(l.type);
                  const href = can
                    ? `/learn/${courseSlug}/${l.id}`
                    : `/courses/${courseSlug}`;
                  return (
                    <div
                      key={l.id}
                      className={cn(
                        "flex items-start gap-2 border-t border-border/40 px-3 py-2 text-sm",
                        isCurrent && "bg-emerald-50",
                        !can && "opacity-60"
                      )}
                    >
                      {can && canToggleComplete && onToggleComplete ? (
                        <button
                          type="button"
                          aria-label={
                            isDone ? "Mark lesson incomplete" : "Mark lesson complete"
                          }
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors",
                            isDone
                              ? "text-emerald-700"
                              : "text-muted-foreground hover:text-emerald-700"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleComplete(l.id, !isDone);
                          }}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border",
                              isDone
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-muted-foreground/40"
                            )}
                          >
                          {isDone ? (
                            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                              <path
                                d="M3.5 8.5 6.5 11.5 12.5 4.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : null}
                          </span>
                        </button>
                      ) : can ? (
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <Link
                        href={href}
                        prefetch
                        onMouseEnter={() => {
                          if (can) router.prefetch(href);
                        }}
                        className={cn(
                          "min-w-0 flex-1 leading-snug hover:underline",
                          isCurrent && "font-medium text-foreground",
                          isDone && !isCurrent && "text-muted-foreground"
                        )}
                      >
                        {l.title}
                      </Link>
                      {l.duration > 0 && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatDuration(l.duration)}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
