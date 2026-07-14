import Link from "next/link";
import { Suspense } from "react";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, Search } from "lucide-react";
import { SearchBar } from "@/components/layout/search-bar";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex cursor-pointer items-center gap-2 font-bold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">VeoLMS</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <Suspense fallback={<div className="h-10 max-w-xl rounded-lg bg-muted" />}>
            <SearchBar />
          </Suspense>
        </div>

        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="/courses"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:inline"
          >
            Courses
          </Link>

          {session?.user ? (
            <>
              {(session.user.role === "ADMIN" ||
                session.user.role === "INSTRUCTOR") && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">
                    {session.user.role === "ADMIN" ? "Admin" : "Teaching"}
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button variant="outline" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>

      <div className="border-t border-slate-100 px-4 py-2 md:hidden">
        <Suspense fallback={<div className="h-10 rounded-lg bg-slate-100" />}>
          <SearchBar />
        </Suspense>
      </div>
    </header>
  );
}
