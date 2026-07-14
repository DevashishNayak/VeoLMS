import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Status / role chips — each has its own color family (does not reuse --primary).
 * primary mint stays for buttons / selected nav only.
 */
export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "outline"
    | "featured"
    | "admin"
    | "student";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center rounded-full px-2.5 text-[11px] font-semibold leading-none tracking-wide",
        variant === "default" &&
          "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200",
        variant === "secondary" &&
          "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
        /* Published — green, not theme primary */
        variant === "success" &&
          "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200",
        /* Preview / pending */
        variant === "warning" &&
          "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-200",
        /* Featured — amber/gold (not purple) */
        variant === "featured" &&
          "bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-300",
        variant === "destructive" &&
          "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200",
        variant === "outline" &&
          "bg-transparent text-foreground ring-1 ring-inset ring-border",
        /* Roles — fixed width so ADMIN / STUDENT align */
        variant === "admin" &&
          "min-w-[5.25rem] bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200",
        variant === "student" &&
          "min-w-[5.25rem] bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
        className
      )}
      {...props}
    />
  );
}
