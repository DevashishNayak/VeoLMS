/** Production LMS content limits — enforced in Zod + surfaced in admin copy. */

export const COURSE_LIMITS = {
  /** Keep ≤ ~60 for a single-line hero on desktop; UI line-clamps to 1. */
  title: { min: 5, max: 80, recommended: 60 },
  subtitle: { min: 20, max: 160 },
  description: { min: 80, max: 8000 },
  /** Short enough to stay one line in the 2-col “What you’ll learn” grid. */
  outcome: { min: 8, max: 70, recommended: 55 },
  outcomes: { min: 4, max: 12 },
  requirement: { min: 8, max: 150 },
  requirements: { min: 1, max: 8 },
} as const;

/** How many items to show before “Show more” on the public course page. */
export const COURSE_DISPLAY = {
  outcomesVisible: 6,
  requirementsVisible: 4,
  descriptionLinesCollapsed: 5,
  sectionsVisible: 8,
} as const;
