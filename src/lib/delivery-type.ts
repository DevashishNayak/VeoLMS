import type { CourseDeliveryType } from "@prisma/client";

/** Student-facing labels — never hardcode these in pages. */
export const DELIVERY_TYPE_LABEL: Record<CourseDeliveryType, string> = {
  SELF_PACED: "On-demand course",
  LIVE: "Live course",
  OFFLINE: "In-person course",
};

export const DELIVERY_TYPE_ACCESS_NOTE: Record<CourseDeliveryType, string> = {
  SELF_PACED: "Full lifetime access · Progress tracking",
  LIVE: "Live session access · Recordings when available",
  OFFLINE: "Classroom seat · Included course materials",
};

export const DELIVERY_TYPE_DURATION_LABEL: Record<CourseDeliveryType, string> = {
  SELF_PACED: "on-demand content",
  LIVE: "live + materials",
  OFFLINE: "guided sessions",
};

export const DELIVERY_TYPE_OPTIONS: {
  value: CourseDeliveryType;
  label: string;
  hint: string;
}[] = [
  {
    value: "SELF_PACED",
    label: "On-demand (online)",
    hint: "Students watch anytime after enroll. Free Preview lessons work without buying.",
  },
  {
    value: "LIVE",
    label: "Live",
    hint: "Scheduled sessions. Content still gated by enroll + Preview flags.",
  },
  {
    value: "OFFLINE",
    label: "In-person / offline",
    hint: "Classroom cohort. Same enroll gate; use for marketing type only for now.",
  },
];
