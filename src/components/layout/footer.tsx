import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { auth } from "@/lib/auth";

const footerLinkClass =
  "text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline decoration-primary/70";

export async function Footer() {
  const session = await auth();
  const loggedIn = Boolean(session?.user);

  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </span>
          VeoLMS
        </Link>
        <p className="text-sm text-muted-foreground">
          Built for the VeoLMS Core Team Challenge
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/courses" className={footerLinkClass}>
            Courses
          </Link>
          {loggedIn ? (
            <>
              <Link href="/dashboard" className={footerLinkClass}>
                Dashboard
              </Link>
              <Link href="/profile" className={footerLinkClass}>
                Profile
              </Link>
            </>
          ) : (
            <Link href="/login" className={footerLinkClass}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </footer>
  );
}
