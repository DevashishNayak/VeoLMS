"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  CreditCard,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  Layers,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Users,
  UserPlus,
  ListVideo,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};
type NavGroup = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    id: "courses",
    label: "Course Management",
    icon: BookOpen,
    items: [
      { href: "/admin/courses", label: "Courses", icon: BookOpen },
      { href: "/admin/sections", label: "Sections", icon: Layers },
      { href: "/admin/lessons", label: "Lessons", icon: ListVideo },
    ],
  },
  {
    id: "users",
    label: "User Management",
    icon: Users,
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/enrollments", label: "Enrollments", icon: UserPlus },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/progress", label: "Lesson Progress", icon: Activity },
    ],
  },
];

function isItemActive(pathname: string, href: string) {
  if (href === "/admin/courses") {
    return pathname === "/admin/courses" || pathname.startsWith("/admin/courses/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    courses: true,
    users: true,
  });

  useEffect(() => {
    // Auto-expand the group that contains the active page
    for (const group of groups) {
      if (group.items.some((item) => isItemActive(pathname, item.href))) {
        setOpenGroups((s) => ({ ...s, [group.id]: true }));
      }
    }
  }, [pathname]);

  function groupActive(group: NavGroup) {
    return group.items.some((item) => isItemActive(pathname, item.href));
  }

  const flatItems = groups.flatMap((g) => g.items);

  return (
    <div className="fixed inset-0 z-[60] flex bg-background">
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                VeoLMS Admin
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground">
                Content & students
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {collapsed ? (
            <ul className="space-y-1">
              {flatItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className={cn(
                        "flex h-10 w-full cursor-pointer items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-ring/40"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            groups.map((group) => {
              const GroupIcon = group.icon;
              const open = openGroups[group.id] ?? true;
              return (
                <div key={group.id} className="mb-2">
                  <button
                    type="button"
                    title={group.label}
                    onClick={() =>
                      setOpenGroups((s) => ({ ...s, [group.id]: !open }))
                    }
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors",
                      groupActive(group)
                        ? "bg-sidebar-primary/25 text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <GroupIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{group.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        open ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>

                  {open && (
                    <ul className="mt-1 space-y-0.5 border-l border-sidebar-border ml-3 pl-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(pathname, item.href);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                                active
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-ring/30"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center px-0" : "justify-start"
            )}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                Collapse
              </>
            )}
          </Button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="View site (new tab)"
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!collapsed && "View site"}
          </a>
          <Link
            href="/dashboard"
            title="Student dashboard"
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {!collapsed && "Student dashboard"}
          </Link>
          <button
            type="button"
            title="Log out"
            onClick={() => signOut({ callbackUrl: "/" })}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Log out"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4 sm:px-6">
          <AdminBreadcrumbs />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-8 sm:p-6 sm:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
