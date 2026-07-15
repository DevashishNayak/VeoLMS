import Link from "next/link";
import { BookOpen, Clock, Star } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";

interface CourseCardProps {
  course: {
    slug: string;
    title: string;
    subtitle?: string | null;
    thumbnail: string;
    priceInPaise: number;
    instructor: { name: string };
    lessonCount?: number;
    totalDuration?: number;
    ratingAvg?: number;
    ratingCount?: number;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  const lessonCount = course.lessonCount ?? 0;
  const duration = course.totalDuration ?? 0;
  const ratingCount = course.ratingCount ?? 0;
  const ratingAvg = course.ratingAvg ?? 0;
  const pitch = (course.subtitle?.trim() || "")
    .replace(/(?:\u2026|\.{3})+\s*$/g, "")
    .trim() || null;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={course.thumbnail}
          alt={course.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] font-semibold text-foreground group-hover:text-primary">
          {course.title}
        </h3>
        {pitch ? (
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
            {pitch}
          </p>
        ) : (
          <p className="mt-1 min-h-[2.5rem] text-sm text-muted-foreground">
            {course.instructor.name}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{course.instructor.name}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span
            className={
              ratingCount > 0
                ? "flex items-center gap-1 text-amber-600"
                : "flex items-center gap-1"
            }
          >
            <Star
              className={
                ratingCount > 0
                  ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  : "h-3.5 w-3.5"
              }
            />
            {ratingCount > 0 ? ratingAvg.toFixed(1) : "New"}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {lessonCount} lessons
          </span>
          {duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(duration)}
            </span>
          )}
        </div>
        <p className="mt-auto pt-3 text-lg font-bold text-foreground">
          {course.priceInPaise === 0 ? "Free" : formatPrice(course.priceInPaise)}
        </p>
      </div>
    </Link>
  );
}
