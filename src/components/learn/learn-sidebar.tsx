"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  FileText,
  Film,
  Lock,
  PlayCircle,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  accessibleIds,
  completedIds,
  progressPercent,
}: {
  courseSlug: string;
  sections: SectionRow[];
  currentLessonId: string;
  accessibleIds: string[];
  completedIds: string[];
  progressPercent: number;
}) {
  const accessible = useMemo(() => new Set(accessibleIds), [accessibleIds]);
  const completed = useMemo(() => new Set(completedIds), [completedIds]);

  const currentSectionId =
    sections.find((s) => s.lessons.some((l) => l.id === currentLessonId))?.id ??
    sections[0]?.id;

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      sections.map((s) => [s.id, s.id === currentSectionId])
    )
  );

  function typeIcon(type: string) {
    if (type === "PDF" || type === "TEXT") return FileText;
    return Film;
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="shrink-0 border-b border-border p-4">
        <h2 className="font-semibold">Course content</h2>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{progressPercent}% complete</span>
            <span>
              {completed.size}/
              {sections.reduce((n, s) => n + s.lessons.length, 0)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
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
                  const isCurrent = l.id === currentLessonId;
                  const isDone = completed.has(l.id);
                  const Icon = typeIcon(l.type);
                  return (
                    <Link
                      key={l.id}
                      href={
                        can
                          ? `/learn/${courseSlug}/${l.id}`
                          : `/courses/${courseSlug}`
                      }
                      className={cn(
                        "flex items-start gap-2 border-t border-border/40 px-3 py-2.5 text-sm",
                        isCurrent && "bg-primary/10",
                        can ? "hover:bg-muted/40" : "opacity-60"
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      ) : isCurrent ? (
                        <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : can ? (
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 leading-snug">{l.title}</span>
                      {l.duration > 0 && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatDuration(l.duration)}
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
