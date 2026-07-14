"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  FileText,
  Film,
  Lock,
  Play,
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

export function CourseCurriculum({
  sections,
  courseSlug,
  enrolled,
}: {
  sections: SectionRow[];
  courseSlug: string;
  enrolled: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s, i) => [s.id, i === 0]))
  );

  const totals = useMemo(() => {
    const lessons = sections.reduce((n, s) => n + s.lessons.length, 0);
    const seconds = sections.reduce(
      (n, s) => n + s.lessons.reduce((a, l) => a + l.duration, 0),
      0
    );
    return { lessons, seconds };
  }, [sections]);

  function typeIcon(type: string) {
    if (type === "PDF" || type === "TEXT") return FileText;
    return Film;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">Course content</h2>
          <p className="text-sm text-muted-foreground">
            {sections.length} sections · {totals.lessons} lectures ·{" "}
            {formatDuration(totals.seconds)} total
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => {
            const allOpen = sections.every((s) => open[s.id]);
            setOpen(
              Object.fromEntries(sections.map((s) => [s.id, !allOpen]))
            );
          }}
        >
          {sections.every((s) => open[s.id]) ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {sections.map((section) => {
        const sectionSeconds = section.lessons.reduce(
          (a, l) => a + l.duration,
          0
        );
        const isOpen = open[section.id];
        return (
          <div key={section.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-3 bg-muted/40 px-4 py-3 text-left hover:bg-muted/70"
              onClick={() =>
                setOpen((s) => ({ ...s, [section.id]: !s[section.id] }))
              }
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  isOpen ? "rotate-0" : "-rotate-90"
                )}
              />
              <span className="min-w-0 flex-1 font-medium">{section.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {section.lessons.length} lectures · {formatDuration(sectionSeconds)}
              </span>
            </button>
            {isOpen && (
              <ul className="divide-y divide-border/60">
                {section.lessons.map((lesson) => {
                  const Icon = typeIcon(lesson.type);
                  const canOpen = enrolled || lesson.isPreview;
                  if (canOpen) {
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/learn/${courseSlug}/${lesson.id}`}
                          className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/40"
                        >
                          <Play className="h-4 w-4 shrink-0 text-primary" />
                          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">{lesson.title}</span>
                          {lesson.isPreview && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                              Preview
                            </span>
                          )}
                          <span className="shrink-0 text-[10px] uppercase text-muted-foreground">
                            {lesson.type}
                          </span>
                          {lesson.duration > 0 && (
                            <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                              {formatDuration(lesson.duration)}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  }
                  return (
                    <li key={lesson.id}>
                      <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground">
                        <Lock className="h-4 w-4 shrink-0" />
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="min-w-0 flex-1">{lesson.title}</span>
                        <span className="shrink-0 text-[10px] uppercase">
                          {lesson.type}
                        </span>
                        {lesson.duration > 0 && (
                          <span className="w-12 shrink-0 text-right text-xs">
                            {formatDuration(lesson.duration)}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
