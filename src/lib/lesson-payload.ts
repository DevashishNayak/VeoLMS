/**
 * Strip paid media from lesson objects before sending to browsers / public APIs.
 * Metadata (title, type, duration, isPreview) is always safe.
 */

export type LessonMediaFields = {
  videoProvider?: string | null;
  videoSrc?: string | null;
  content?: string | null;
  pdfUrl?: string | null;
  description?: string | null;
  resources?: { id?: string; title: string; url: string; mimeType?: string | null }[];
};

const LOCKED_NULL = {
  videoProvider: null as string | null,
  videoSrc: null as string | null,
  content: null,
  pdfUrl: null,
  description: null as string | null,
  resources: [] as {
    id?: string;
    title: string;
    url: string;
    mimeType?: string | null;
  }[],
};

export function sanitizeLessonPayload<T extends LessonMediaFields>(
  lesson: T,
  canAccess: boolean
): T {
  if (canAccess) return lesson;
  return {
    ...lesson,
    ...LOCKED_NULL,
  };
}

export const lessonCatalogSelect = {
  id: true,
  title: true,
  type: true,
  duration: true,
  order: true,
  isPreview: true,
  description: true,
} as const;

export const lessonContentSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  videoProvider: true,
  videoSrc: true,
  content: true,
  pdfUrl: true,
  duration: true,
  order: true,
  isPreview: true,
  sectionId: true,
  resources: {
    orderBy: { order: "asc" as const },
    select: { id: true, title: true, url: true, mimeType: true, order: true },
  },
};
