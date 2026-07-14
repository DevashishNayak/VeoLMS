"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminAlert({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        error
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      )}
    >
      {error || message}
    </div>
  );
}

export function AdminSearch({
  value,
  onChange,
  onClear,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  /** Clears only the search text (keeps selects). Falls back to onChange(""). */
  onClear?: () => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full min-w-0 sm:max-w-md sm:flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9 pr-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <button
          type="button"
          title="Clear search"
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => (onClear ? onClear() : onChange(""))}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Fixed-width clear control for the right-side filter group (no layout shift).
 */
export function AdminClearFilters({
  show,
  onClear,
}: {
  show: boolean;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      disabled={!show}
      title="Clear search and filters"
      className={cn(
        "inline-flex h-10 w-[4.75rem] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md text-xs font-medium transition-colors",
        show
          ? "text-muted-foreground hover:bg-muted hover:text-foreground"
          : "cursor-default text-muted-foreground/35"
      )}
    >
      <X className="h-3.5 w-3.5" />
      Clear
    </button>
  );
}

export function AdminTableShell({
  children,
  footer,
  refreshing = false,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Background refetch — thin bar only, never dim the table. */
  refreshing?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {refreshing ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-muted"
        >
          <div className="h-full w-1/3 animate-[admin-progress_1.1s_ease-in-out_infinite] bg-primary" />
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}

export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
};
