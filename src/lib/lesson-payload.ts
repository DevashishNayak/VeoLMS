/**
 * Strip paid media from lesson objects before sending to browsers / public APIs.
 * Metadata (title, type, duration, isPreview) is always safe.
 */

export type LessonMediaFields = {
  youtubeId?: string | null;
  videoUrl?: string | null;
  content?: string | null;
  pdfUrl?: string | null;
  description?: string | null;
  resources?: { id?: string; title: string; url: string; mimeType?: string | null }[];
};

/** Fields that must never leave the server for locked (paid) lessons. */
const LOCKED_NULL = {
  youtubeId: null,
  videoUrl: null,
  content: null,
  pdfUrl: null,
  description: null as string | null,
  resources: [] as { id?: string; title: string; url: string; mimeType?: string | null }[],
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

/** Prisma select for curriculum lists (no paid bodies). */
export const lessonCatalogSelect = {
  id: true,
  title: true,
  type: true,
  duration: true,
  order: true,
  isPreview: true,
  description: true,
} as const;

/** Prisma select for full media (only after canAccessLesson). */
export const lessonContentSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  youtubeId: true,
  videoUrl: true,
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
