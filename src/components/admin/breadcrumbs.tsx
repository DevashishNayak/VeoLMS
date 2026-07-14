"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  admin: "Admin",
  courses: "Courses",
  sections: "Sections",
  lessons: "Lessons",
  users: "Users",
  enrollments: "Enrollments",
  payments: "Payments",
  progress: "Progress",
  students: "Users",
};

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  const crumbs: { href: string; label: string }[] = [];
  let href = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    href += `/${part}`;
    const isId = part.length > 20 || /^c[a-z0-9]{20,}$/i.test(part);
    let label = LABELS[part] ?? part;
    if (isId && parts[i - 1] === "courses") label = "Curriculum";
    else if (isId) label = "Details";
    crumbs.push({ href, label });
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              {last ? (
                <span className="truncate font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href === "/admin" ? "/admin/courses" : crumb.href}
                  className="cursor-pointer truncate text-muted-foreground transition-colors hover:text-foreground hover:underline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
