"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/courses?q=${encodeURIComponent(q)}` : "/courses");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="group relative w-full max-w-xl"
      role="search"
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition group-focus-within:text-foreground" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search courses…"
        aria-label="Search courses"
        className="h-10 w-full rounded-lg border border-border bg-background py-2 pl-10 pr-24 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="submit"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:brightness-105"
      >
        Search
      </button>
    </form>
  );
}
