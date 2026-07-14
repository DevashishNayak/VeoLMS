import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-semibold text-violet-700">
          <GraduationCap className="h-5 w-5" />
          VeoLMS
        </div>
        <p className="text-sm text-slate-500">
          Built for the VeoLMS Core Team Challenge
        </p>
        <div className="flex gap-4 text-sm text-slate-600">
          <Link href="/courses" className="hover:text-violet-700">
            Courses
          </Link>
          <Link href="/login" className="hover:text-violet-700">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
