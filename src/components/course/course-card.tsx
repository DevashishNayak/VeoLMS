import Link from "next/link";
import { BookOpen, Clock, Star } from "lucide-react";
import { formatPrice, formatDuration } from "@/lib/utils";

interface CourseCardProps {
  course: {
    slug: string;
    title: string;
    thumbnail: string;
    priceInPaise: number;
    instructor: { name: string };
    _count?: { sections: number };
    lessonCount?: number;
    totalDuration?: number;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  const lessonCount = course.lessonCount ?? 0;
  const duration = course.totalDuration ?? 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
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
        <h3 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">
          {course.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{course.instructor.name}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            4.8
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
