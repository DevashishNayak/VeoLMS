"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type CatalogCategoryOption = {
  slug: string;
  name: string;
  parentName?: string | null;
};

function buildHref(
  searchParams: URLSearchParams,
  updates: Record<string, string | null>
) {
  const next = new URLSearchParams(searchParams.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
  }
  // Public catalog doesn't expose page size
  next.delete("pageSize");
  const qs = next.toString();
  return qs ? `?${qs}` : "?";
}

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push("…");
    out.push(sorted[i]!);
  }
  return out;
}

export function CoursesCatalogToolbar({
  categories,
  featuredOnly,
  total,
  page = 1,
  pageSize = 12,
}: {
  categories: CatalogCategoryOption[];
  featuredOnly: boolean;
  total: number;
  page?: number;
  pageSize?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") || "newest";
  const category = searchParams.get("category") || "";
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function pushUpdates(updates: Record<string, string | null>) {
    const href = buildHref(searchParams, { page: null, ...updates });
    router.push(`${pathname}${href === "?" ? "" : href}`);
  }

  const featuredHref = buildHref(searchParams, {
    featured: featuredOnly ? null : "1",
    page: null,
  });
  const featuredLink = `${pathname}${featuredHref === "?" ? "" : featuredHref}`;

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-sm font-semibold text-emerald-900 ring-1 ring-primary/30">
          {total} {total === 1 ? "course" : "courses"}
        </span>
        {total > 0 ? (
          <span className="text-sm text-muted-foreground">
            Showing {from}–{to}
          </span>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        <label className="sr-only" htmlFor="catalog-category">
          Category
        </label>
        <Select
          id="catalog-category"
          className="h-10 w-full border-border/80 bg-background sm:h-9 sm:w-[13rem]"
          value={category}
          onChange={(e) =>
            pushUpdates({ category: e.target.value || null })
          }
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.parentName ? `${c.parentName} · ${c.name}` : c.name}
            </option>
          ))}
        </Select>

        <label className="sr-only" htmlFor="catalog-sort">
          Sort
        </label>
        <Select
          id="catalog-sort"
          className="h-10 w-full border-border/80 bg-background sm:h-9 sm:w-[13rem]"
          value={sort}
          onChange={(e) => pushUpdates({ sort: e.target.value })}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="rating">Highest rated</option>
          <option value="title">Title A–Z</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </Select>

        <Link
          href={featuredLink}
          className="inline-flex w-full items-center justify-center gap-1 py-2 text-sm font-semibold text-foreground underline-offset-4 transition hover:underline sm:w-auto sm:justify-start sm:py-0"
        >
          {featuredOnly ? "View all courses" : "View featured courses"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export function CoursesPagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
  total?: number;
  pageSize?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function pageHref(nextPage: number) {
    const href = buildHref(searchParams, {
      page: nextPage <= 1 ? null : String(nextPage),
    });
    return `${pathname}${href === "?" ? "" : href}`;
  }

  const pages = pageList(page, totalPages);

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Course pages"
    >
      {page > 1 ? (
        <Link
          href={pageHref(page - 1)}
          className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm text-muted-foreground/40">
          <ChevronLeft className="h-4 w-4" />
          Prev
        </span>
      )}

      {pages.map((item, i) =>
        item === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex h-10 w-10 items-center justify-center text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={pageHref(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition",
              item === page
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link
          href={pageHref(page + 1)}
          className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm text-muted-foreground/40">
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
