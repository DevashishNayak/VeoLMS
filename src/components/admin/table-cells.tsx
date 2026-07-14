"use client";

import Link from "next/link";
import { Pencil, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Empty numeric / missing values — always "—" */
export function EmptyValue({ className }: { className?: string }) {
  return (
    <span className={cn("text-sm text-muted-foreground", className)}>—</span>
  );
}

/** Show count, or "—" when 0 / null / undefined */
export function CountValue({
  value,
  className,
}: {
  value: number | null | undefined;
  className?: string;
}) {
  if (value == null || value === 0) return <EmptyValue className={className} />;
  return (
    <span
      className={cn(
        "text-sm font-medium tabular-nums text-foreground",
        className
      )}
    >
      {value}
    </span>
  );
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function initialsTone(seed: string): string {
  const tones = [
    "bg-sky-100 text-sky-800",
    "bg-emerald-100 text-emerald-800",
    "bg-amber-100 text-amber-900",
    "bg-violet-100 text-violet-800",
    "bg-rose-100 text-rose-800",
    "bg-teal-100 text-teal-800",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * 17) % tones.length;
  }
  return tones[hash] ?? tones[0];
}

export function TextStack({
  title,
  subtitle,
  href,
  className,
  titleClassName,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  href?: string;
  className?: string;
  titleClassName?: string;
}) {
  const titleNode = href ? (
    <Link
      href={href}
      className={cn(
        "cursor-pointer truncate font-semibold text-foreground hover:underline",
        titleClassName
      )}
    >
      {title}
    </Link>
  ) : (
    <p className={cn("truncate font-semibold text-foreground", titleClassName)}>
      {title}
    </p>
  );

  return (
    <div className={cn("flex min-w-0 flex-col justify-center gap-0.5", className)}>
      {titleNode}
      {subtitle != null && subtitle !== "" ? (
        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function EntityCell({
  image,
  imageAlt = "",
  title,
  subtitle,
  href,
  icon: Icon,
  initials,
}: {
  image?: string | null;
  imageAlt?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  href?: string;
  icon?: LucideIcon;
  /** Name for initials avatar when no profile image */
  initials?: string;
}) {
  const showMedia = image !== undefined || Boolean(Icon) || Boolean(initials);

  return (
    <div className="flex items-center gap-3">
      {showMedia && (
        <div className="shrink-0">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={imageAlt}
              className="h-12 w-16 rounded-md object-cover ring-1 ring-border"
            />
          ) : initials ? (
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset ring-black/5",
                initialsTone(initials)
              )}
              aria-hidden
            >
              {getInitials(initials)}
            </div>
          ) : Icon ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted ring-1 ring-border">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          ) : (
            <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground ring-1 ring-border">
              No img
            </div>
          )}
        </div>
      )}
      <TextStack
        title={title}
        subtitle={subtitle}
        href={href}
        className="min-h-12 max-w-[280px]"
      />
    </div>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-1.5">{children}</div>
  );
}

export function IconAction({
  label,
  onClick,
  href,
  external,
  icon: Icon,
  destructive,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  icon?: LucideIcon;
  destructive?: boolean;
}) {
  const className = cn(
    "inline-flex items-center justify-center",
    destructive && "text-destructive hover:bg-destructive/10"
  );

  if (href) {
    return (
      <Button variant="outline" size="icon" asChild title={label}>
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
          </a>
        ) : (
          <Link href={href} className={className}>
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
          </Link>
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      title={label}
      onClick={onClick}
      className={className}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
    </Button>
  );
}

/** Icon-only edit — same on every table */
export function EditAction(props: {
  href?: string;
  onClick?: () => void;
  label?: string;
}) {
  return (
    <IconAction
      label={props.label ?? "Edit"}
      href={props.href}
      onClick={props.onClick}
      icon={Pencil}
    />
  );
}

export function DeleteAction(props: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <IconAction
      label={props.label ?? "Delete"}
      onClick={props.onClick}
      icon={Trash2}
      destructive
    />
  );
}
