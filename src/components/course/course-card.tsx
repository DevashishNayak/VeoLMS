import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock, Layers, Star } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";

interface CourseCardProps {
  course: {
    slug: string;
    title: string;
    subtitle?: string | null;
    thumbnail: string;
    priceInPaise: number;
    featured?: boolean;
    instructor: { name: string };
    category?: {
      name: string;
      parent?: { name: string } | null;
    } | null;
    sectionCount?: number;
    lessonCount?: number;
    totalDuration?: number;
    ratingAvg?: number;
    ratingCount?: number;
  };
  /** Show mint Featured chip (skip in Featured sections / featured-only lists). */
  showFeaturedBadge?: boolean;
}

/** Course-level duration reads cleaner as h/m (skip leftover seconds). */
function formatCourseDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return formatDuration(seconds);
}

export function CourseCard({
  course,
  showFeaturedBadge = false,
}: CourseCardProps) {
  const sectionCount = course.sectionCount ?? 0;
  const lessonCount = course.lessonCount ?? 0;
  const duration = course.totalDuration ?? 0;
  const ratingCount = course.ratingCount ?? 0;
  const ratingAvg = course.ratingAvg ?? 0;
  const isFree = course.priceInPaise === 0;
  const categoryLabel = course.category?.name?.trim() || null;
  const showFeatured = showFeaturedBadge && Boolean(course.featured);
  const pitch =
    (course.subtitle?.trim() || "")
      .replace(/(?:\u2026|\.{3})+\s*$/g, "")
      .trim() || null;
  const instructorInitial =
    course.instructor.name.trim().charAt(0).toUpperCase() || "I";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_16px_36px_-22px_rgba(0,0,0,0.32)]"
    >
      <div className="relative aspect-[2/1] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={course.thumbnail}
          alt={course.title}
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
          aria-hidden
        />

        {showFeatured ? (
          <div className="absolute left-2.5 top-2.5">
            <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
              Featured
            </span>
          </div>
        ) : null}

        {categoryLabel ? (
          <div className="absolute right-2.5 top-2.5 max-w-[65%]">
            <span className="block truncate rounded-md bg-emerald-100/95 px-2 py-0.5 text-xs font-semibold text-emerald-950 shadow-sm ring-1 ring-emerald-900/10 backdrop-blur-sm">
              {categoryLabel}
            </span>
          </div>
        ) : null}

        <div className="absolute bottom-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-black/5">
            <Star
              className={
                ratingCount > 0
                  ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  : "h-3.5 w-3.5 text-muted-foreground"
              }
            />
            {ratingCount > 0 ? (
              <>
                {ratingAvg.toFixed(1)}
                <span className="font-normal text-slate-500">
                  ({ratingCount})
                </span>
              </>
            ) : (
              <span className="text-slate-500">New</span>
            )}
          </span>
        </div>

        <span className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-900 opacity-0 shadow-sm ring-1 ring-black/5 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground transition-colors duration-200 group-hover:text-emerald-700">
            {course.title}
          </h3>
          {pitch ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {pitch}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center gap-2.5 border-t border-border/70 pt-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-foreground">
            {instructorInitial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {course.instructor.name}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {sectionCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {sectionCount} {sectionCount === 1 ? "section" : "sections"}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
              </span>
              {duration > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatCourseDuration(duration)}
                </span>
              ) : null}
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-primary/25 px-2.5 py-1 text-sm font-bold text-emerald-800 transition duration-200 group-hover:bg-primary/40">
            {isFree ? "Free" : formatPrice(course.priceInPaise)}
          </span>
        </div>
      </div>
    </Link>
  );
}
