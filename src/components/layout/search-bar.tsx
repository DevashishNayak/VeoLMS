"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

type Suggestion = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  priceInPaise: number;
  instructor: { name: string };
};

function SuggestionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5" aria-hidden>
      <div className="h-10 w-16 shrink-0 animate-pulse rounded-md bg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const urlQuery = searchParams.get("q") ?? "";

  function resetSuggestions() {
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
    setLoading(false);
  }

  function clearQuery() {
    setQuery("");
    resetSuggestions();
  }

  // Keep the input in sync with /courses?q=… (catalog search should persist).
  useEffect(() => {
    setQuery(urlQuery);
    if (!urlQuery) resetSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL is source of truth on navigation
  }, [urlQuery]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Show skeletons immediately — don't wait for the debounce to finish.
    setLoading(true);
    setOpen(true);

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/courses/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { courses: Suggestion[] };
        setSuggestions(data.courses ?? []);
        setActiveIndex(-1);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function goToCatalog(q: string) {
    setOpen(false);
    setActiveIndex(-1);
    // Keep text — it matches the catalog query in the URL.
    startTransition(() => {
      router.push(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
    });
  }

  function goToCourse(slug: string) {
    clearQuery();
    startTransition(() => {
      router.push(`/courses/${slug}`);
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      goToCourse(suggestions[activeIndex].slug);
      return;
    }
    goToCatalog(query.trim());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (suggestions.length || loading) setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      if (open) {
        // First Esc: close suggestions, keep typed text.
        setOpen(false);
        setActiveIndex(-1);
      } else if (query) {
        // Second Esc (panel already closed): clear the field.
        clearQuery();
      }
      return;
    }
    if (!suggestions.length || loading) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <form
      ref={rootRef}
      onSubmit={handleSubmit}
      className={cn("group relative w-full max-w-xl", className)}
      role="search"
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-foreground" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder="Search courses…"
        aria-label="Search courses"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showPanel}
        aria-busy={loading}
        aria-activedescendant={
          activeIndex >= 0 && suggestions[activeIndex]
            ? `${listId}-opt-${suggestions[activeIndex].id}`
            : undefined
        }
        role="combobox"
        autoComplete="off"
        className="h-10 w-full rounded-lg border border-border bg-background py-2 pl-10 pr-24 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="submit"
        className="absolute right-1 top-1/2 z-[1] -translate-y-1/2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-105"
      >
        Search
      </button>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Course suggestions"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[70] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          {loading ? (
            <div className="py-1" aria-live="polite">
              <span className="sr-only">Loading courses</span>
              <SuggestionSkeleton />
              <SuggestionSkeleton />
              <SuggestionSkeleton />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-4">
              <p className="text-sm text-muted-foreground">No courses found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Press Search to browse the full catalog.
              </p>
            </div>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto py-1">
              {suggestions.map((course, index) => (
                <li
                  key={course.id}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <Link
                    id={`${listId}-opt-${course.id}`}
                    href={`/courses/${course.slug}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 transition-colors",
                      index === activeIndex ? "bg-muted" : "hover:bg-muted/80"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => clearQuery()}
                  >
                    <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {course.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.thumbnail}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {course.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {course.instructor.name}
                        {course.subtitle ? ` · ${course.subtitle}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-emerald-800">
                      {course.priceInPaise === 0
                        ? "Free"
                        : formatPrice(course.priceInPaise)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </form>
  );
}
