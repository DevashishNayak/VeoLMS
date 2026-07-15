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
import { formatDuration, cn } from "@/lib/utils";
import { COURSE_DISPLAY } from "@/lib/course-limits";

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
  const [showAllSections, setShowAllSections] = useState(false);

  const totals = useMemo(() => {
    const lessons = sections.reduce((n, s) => n + s.lessons.length, 0);
    const seconds = sections.reduce(
      (n, s) => n + s.lessons.reduce((a, l) => a + l.duration, 0),
      0
    );
    return { lessons, seconds };
  }, [sections]);

  const visibleSections = showAllSections
    ? sections
    : sections.slice(0, COURSE_DISPLAY.sectionsVisible);
  const hiddenSections = Math.max(
    0,
    sections.length - COURSE_DISPLAY.sectionsVisible
  );
  const allExpanded = visibleSections.every((s) => open[s.id]);

  function typeIcon(type: string) {
    if (type === "PDF" || type === "TEXT") return FileText;
    return Film;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">Course content</h2>
          <p className="text-sm text-muted-foreground">
            {sections.length} sections · {totals.lessons} lectures ·{" "}
            {formatDuration(totals.seconds)} total
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground shadow-xs hover:bg-muted"
          onClick={() => {
            setOpen(
              Object.fromEntries(
                sections.map((s) => [s.id, !allExpanded])
              )
            );
          }}
        >
          {allExpanded ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {visibleSections.map((section) => {
        const sectionSeconds = section.lessons.reduce(
          (a, l) => a + l.duration,
          0
        );
        const isOpen = open[section.id];
        return (
          <div key={section.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-3 bg-muted/50 px-4 py-3 text-left hover:bg-muted"
              onClick={() =>
                setOpen((s) => ({ ...s, [section.id]: !s[section.id] }))
              }
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-foreground transition-transform",
                  isOpen ? "rotate-0" : "-rotate-90"
                )}
              />
              <span className="min-w-0 flex-1 font-medium text-foreground">
                {section.title}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {section.lessons.length} lectures ·{" "}
                {formatDuration(sectionSeconds)}
              </span>
            </button>
            {isOpen && (
              <ul className="divide-y divide-border/60">
                {section.lessons.map((lesson) => {
                  const Icon = typeIcon(lesson.type);
                  const canOpen = enrolled || lesson.isPreview;
                  // Fixed columns so Preview / type / duration align across rows.
                  const rowClass =
                    "flex items-center gap-3 px-4 py-2.5 text-sm";
                  const meta = (
                    <>
                      <span className="flex w-[4.75rem] shrink-0 justify-start">
                        {lesson.isPreview ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                            Preview
                          </span>
                        ) : null}
                      </span>
                      <span className="hidden w-12 shrink-0 text-[10px] font-medium uppercase text-muted-foreground sm:block">
                        {lesson.type}
                      </span>
                      <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {lesson.duration > 0
                          ? formatDuration(lesson.duration)
                          : "—"}
                      </span>
                    </>
                  );

                  if (canOpen) {
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/learn/${courseSlug}/${lesson.id}`}
                          className={cn(rowClass, "hover:bg-muted/50")}
                        >
                          {/*
                            Brand primary is a light mint (button fill). Icons on
                            white need a darker teal for contrast — emerald-700.
                          */}
                          <Play
                            className="h-4 w-4 shrink-0 text-emerald-700"
                            aria-hidden
                          />
                          <Icon className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground sm:block" />
                          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                            {lesson.title}
                          </span>
                          {meta}
                        </Link>
                      </li>
                    );
                  }
                  return (
                    <li key={lesson.id}>
                      <div className={cn(rowClass, "text-muted-foreground")}>
                        <Lock
                          className="h-4 w-4 shrink-0 text-foreground"
                          aria-hidden
                        />
                        <Icon className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
                        <span className="min-w-0 flex-1 truncate">
                          {lesson.title}
                        </span>
                        {meta}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      {hiddenSections > 0 ? (
        <div className="border-t border-border px-4 py-3">
          <button
            type="button"
            className="text-sm font-semibold text-emerald-700 hover:underline"
            onClick={() => setShowAllSections((v) => !v)}
          >
            {showAllSections
              ? "Show fewer sections"
              : `${hiddenSections} more section${hiddenSections === 1 ? "" : "s"}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
