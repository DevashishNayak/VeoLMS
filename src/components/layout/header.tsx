import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { GraduationCap } from "lucide-react";
import { SearchBar } from "@/components/layout/search-bar";
import { SiteHeaderNav } from "@/components/layout/site-header-nav";
import { MobileSearchStrip } from "@/components/layout/mobile-search-strip";

export async function Header() {
  const session = await auth();

  return (
    <header className="relative sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] md:gap-8 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 justify-self-start font-bold text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">VeoLMS</span>
        </Link>

        <div className="hidden min-w-0 md:flex md:justify-center">
          <div className="w-full max-w-md">
            <Suspense fallback={<div className="h-10 rounded-lg bg-muted" />}>
              <SearchBar />
            </Suspense>
          </div>
        </div>

        <div className="justify-self-end">
          <SiteHeaderNav
            isLoggedIn={Boolean(session?.user)}
            role={session?.user?.role}
            userName={session?.user?.name}
            userEmail={session?.user?.email}
            userImage={session?.user?.image}
          />
        </div>
      </div>

      <MobileSearchStrip />
    </header>
  );
}
