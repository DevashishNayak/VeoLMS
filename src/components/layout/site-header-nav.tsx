"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  isLoggedIn: boolean;
  role?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
};

function initials(name?: string | null, email?: string | null) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function UserAvatar({
  name,
  email,
  image,
  className,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  className?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Blob / URL avatars
      <img
        src={image}
        alt=""
        className={cn("h-8 w-8 rounded-full object-cover ring-1 ring-border", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200/80",
        className
      )}
      aria-hidden
    >
      {initials(name, email)}
    </span>
  );
}

export function SiteHeaderNav({
  isLoggedIn,
  role,
  userName,
  userEmail,
  userImage,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const staff = role === "ADMIN" || role === "INSTRUCTOR";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setOpen(false);
    try {
      await signOut({ callbackUrl: "/" });
    } catch {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const navLinkClass =
    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

  const mobileLinkClass =
    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100";

  return (
    <>
      <nav className="hidden items-center gap-6 md:flex">
        <Link
          href="/courses"
          className={cn(
            navLinkClass,
            "underline-offset-4 hover:underline decoration-primary/70"
          )}
        >
          Courses
        </Link>

        {isLoggedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-foreground outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <UserAvatar name={userName} email={userEmail} image={userImage} />
                <span className="hidden max-w-[7rem] truncate lg:inline">
                  {userName?.split(" ")[0] || "Account"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold text-foreground">
                  {userName || "Account"}
                </p>
                {userEmail ? (
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                ) : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {staff ? (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="gap-2">
                    <Shield className="h-4 w-4" />
                    {role === "ADMIN" ? "Admin" : "Teaching"}
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="gap-2">
                  <UserRound className="h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={loggingOut}
                className="gap-2 text-emerald-900 focus:text-emerald-950"
                onSelect={(e) => {
                  // Radix closes the menu and can cancel nested form submits —
                  // sign out explicitly from the client instead.
                  e.preventDefault();
                  void handleLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Signing out…" : "Logout"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className={cn(
                navLinkClass,
                "underline-offset-4 hover:underline decoration-primary/70"
              )}
            >
              Login
            </Link>
            <Button size="sm" asChild>
              <Link href="/register">Sign Up</Link>
            </Button>
          </div>
        )}
      </nav>

      <div className="flex items-center gap-1.5 md:hidden">
        {!isLoggedIn ? (
          <Button size="sm" asChild>
            <Link href="/register">Sign Up</Link>
          </Button>
        ) : (
          <UserAvatar name={userName} email={userEmail} image={userImage} />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-10 px-0"
          aria-expanded={open}
          aria-controls="site-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open ? (
        <div
          id="site-mobile-menu"
          className="absolute inset-x-0 top-full z-50 border-b border-border bg-card shadow-lg md:hidden"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-0.5 px-4 py-3">
            {isLoggedIn ? (
              <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-3">
                <UserAvatar name={userName} email={userEmail} image={userImage} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {userName || "Account"}
                  </p>
                  {userEmail ? (
                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
            <Link href="/courses" className={mobileLinkClass} onClick={() => setOpen(false)}>
              Courses
            </Link>
            {isLoggedIn ? (
              <>
                {staff ? (
                  <Link
                    href="/admin"
                    className={mobileLinkClass}
                    onClick={() => setOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    {role === "ADMIN" ? "Admin" : "Teaching"}
                  </Link>
                ) : null}
                <Link
                  href="/dashboard"
                  className={mobileLinkClass}
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={mobileLinkClass}
                  onClick={() => setOpen(false)}
                >
                  <UserRound className="h-4 w-4" />
                  Profile
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled={loggingOut}
                  className="mt-2 w-full bg-emerald-100 text-emerald-950 hover:bg-emerald-200/90"
                  onClick={() => void handleLogout()}
                >
                  {loggingOut ? "Signing out…" : "Logout"}
                </Button>
              </>
            ) : (
              <Link href="/login" className={mobileLinkClass} onClick={() => setOpen(false)}>
                Login
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </>
  );
}
