export type AdminLesson = {
  id: string;
  title: string;
  description: string | null;
  type: "VIDEO" | "TEXT" | "PDF";
  youtubeId: string | null;
  videoUrl: string | null;
  content: string | null;
  pdfUrl: string | null;
  duration: number;
  order: number;
  isPreview: boolean;
  sectionId: string;
  resources?: { id: string; title: string; url: string; mimeType?: string | null }[];
};

export type AdminSection = {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: AdminLesson[];
};

export type AdminCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  learningOutcomes?: string[];
  requirements?: string[];
  priceInPaise: number;
  featured: boolean;
  published: boolean;
  deliveryType?: "SELF_PACED" | "LIVE" | "OFFLINE";
  createdAt?: string;
  instructorId?: string;
  instructor?: { id?: string; name: string; email?: string };
  sections: AdminSection[];
  _count: { enrollments: number };
};

export type AdminStudent = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: { enrollments: number };
};

export type AdminEnrollment = {
  id: string;
  enrolledAt: string;
  user: { name: string; email: string };
  course: { title: string; id?: string };
  userId?: string;
  courseId?: string;
};

export function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function apiJson<T>(
  url: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error ?? `Request failed (${res.status})` };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    return { ok: false, error: "Network error" };
  }
}
