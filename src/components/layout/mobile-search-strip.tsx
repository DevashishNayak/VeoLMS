"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/layout/search-bar";

/** Secondary search row for small screens — hidden on learn (toolbars collide). */
export function MobileSearchStrip() {
  const pathname = usePathname();
  if (pathname?.startsWith("/learn")) return null;

  return (
    <div className="border-t border-slate-100 px-4 py-2 md:hidden">
      <Suspense fallback={<div className="h-10 rounded-lg bg-slate-100" />}>
        <SearchBar />
      </Suspense>
    </div>
  );
}
