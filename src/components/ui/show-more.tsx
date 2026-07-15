"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShowMoreText({
  text,
  collapsedClassName,
  className,
}: {
  text: string;
  /** Tailwind line-clamp class when collapsed, e.g. line-clamp-5 */
  collapsedClassName?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const trimmed = text.trim();
  // Prefer line-based reveal: char length alone lied when text fit in 5 lines.
  // Show control when content is long enough that clamp can hide something.
  const long = trimmed.length > 320 || trimmed.split("\n").length > 5;

  return (
    <div className={className}>
      <p
        className={cn(
          "text-sm leading-relaxed text-muted-foreground",
          // whitespace-pre-wrap breaks CSS line-clamp — only use it when expanded.
          open
            ? "whitespace-pre-wrap"
            : (collapsedClassName ?? "line-clamp-5")
        )}
      >
        {trimmed}
      </p>
      {long ? (
        <button
          type="button"
          className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

type ListVariant = "outcomes" | "requirements";

export function ShowMoreList({
  items,
  visibleCount,
  variant,
  className,
}: {
  items: string[];
  visibleCount: number;
  variant: ListVariant;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const hidden = Math.max(0, items.length - visibleCount);
  const shown = open ? items : items.slice(0, visibleCount);

  return (
    <div className={className}>
      {variant === "outcomes" ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((item) => (
            <li key={item} className="flex min-w-0 gap-2 text-sm">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span className="min-w-0 truncate" title={item}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {shown.map((item) => (
            <li key={item} className="line-clamp-2">
              {item}
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 ? (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-emerald-700 hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Show less" : `Show ${hidden} more`}
        </button>
      ) : null}
    </div>
  );
}
