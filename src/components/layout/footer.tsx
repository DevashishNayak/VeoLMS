import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </span>
          VeoLMS
        </div>
        <p className="text-sm text-muted-foreground">
          Built for the VeoLMS Core Team Challenge
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/courses" className="cursor-pointer hover:text-foreground">
            Courses
          </Link>
          <Link href="/login" className="cursor-pointer hover:text-foreground">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
