"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/** Trim + collapse spaces so similar searches share one cache entry. */
export function normalizeSearch(q: string) {
  return q.trim().replace(/\s+/g, " ");
}

/**
 * Keeps admin list page/pageSize/q/filters in the URL so refresh & share preserve state.
 */
export function useAdminListQuery(options?: {
  defaultPageSize?: number;
  /** Filter keys synced to the URL (values of "all" are omitted). */
  filterKeys?: string[];
}) {
  const defaultPageSize = options?.defaultPageSize ?? 10;
  const filterKeys = options?.filterKeys ?? [];
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
  const rawSize = Number(searchParams.get("pageSize") || defaultPageSize) || defaultPageSize;
  const pageSize = [10, 20, 50].includes(rawSize) ? rawSize : defaultPageSize;
  const qParam = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(qParam);
  const debouncedQ = useDebouncedValue(query, 400);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  const replaceParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "" || value === "all") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      if (next.get("page") === "1") next.delete("page");
      if (next.get("pageSize") === String(defaultPageSize)) next.delete("pageSize");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname, defaultPageSize]
  );

  useEffect(() => {
    const nextQ = normalizeSearch(debouncedQ);
    const liveQ = normalizeSearch(query);
    const currentQ = normalizeSearch(qParam);
    // Wait until input has settled — prevents clear/type races putting old `q` back in the URL
    if (liveQ !== nextQ) return;
    if (nextQ === currentQ) return;
    replaceParams({ q: nextQ || null, page: "1" });
  }, [debouncedQ, query, qParam, replaceParams]);

  function getFilter(key: string, fallback = "all") {
    return searchParams.get(key) || fallback;
  }

  const filters = Object.fromEntries(
    filterKeys.map((key) => [key, getFilter(key)])
  ) as Record<string, string>;

  const hasSearch = normalizeSearch(query) !== "" || normalizeSearch(qParam) !== "";
  const hasFilterValues = filterKeys.some((key) => {
    const v = searchParams.get(key);
    return Boolean(v && v !== "all");
  });
  const hasActiveFilters = hasSearch || hasFilterValues;

  const clearFilters = useCallback(() => {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const clearSearch = useCallback(() => {
    setQuery("");
    replaceParams({ q: null, page: "1" });
  }, [replaceParams]);

  return {
    page,
    pageSize,
    query,
    setQuery,
    /** Normalized search string for API + cache keys. */
    q: normalizeSearch(qParam).toLowerCase(),
    filters,
    getFilter,
    setPage: (p: number) => replaceParams({ page: String(Math.max(1, p)) }),
    setPageSize: (size: number) =>
      replaceParams({ pageSize: String(size), page: "1" }),
    setFilter: (key: string, value: string) =>
      replaceParams({ [key]: value, page: "1" }),
    hasActiveFilters,
    hasFilterValues,
    clearFilters,
    clearSearch,
  };
}
