import Link from "next/link";
import Image from "next/image";
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
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-violet-700">
          {course.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{course.instructor.name}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
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
        <p className="mt-auto pt-3 text-lg font-bold text-slate-900">
          {course.priceInPaise === 0 ? "Free" : formatPrice(course.priceInPaise)}
        </p>
      </div>
    </Link>
  );
}
