import { z } from "zod";
import { normalizeVideoInput } from "@/lib/media-src";
import { COURSE_LIMITS } from "@/lib/course-limits";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    bio: z
      .string()
      .max(2000, "Bio must be at most 2000 characters")
      .optional()
      .nullable(),
    imageUrl: z
      .string()
      .url("Invalid image URL")
      .max(2000)
      .optional()
      .nullable()
      .or(z.literal("").transform(() => null)),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && data.newPassword.length > 0) {
      if (!data.currentPassword) {
        ctx.addIssue({
          code: "custom",
          message: "Current password is required to set a new password",
          path: ["currentPassword"],
        });
      }
    }
  });

const optionalUrl = z
  .string()
  .url()
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

const videoProviderEnum = z.enum(["YOUTUBE", "VIMEO", "FILE"]);

const outcomeItem = z
  .string()
  .trim()
  .min(COURSE_LIMITS.outcome.min, `Each outcome needs at least ${COURSE_LIMITS.outcome.min} characters`)
  .max(COURSE_LIMITS.outcome.max, `Each outcome max ${COURSE_LIMITS.outcome.max} characters`);

const requirementItem = z
  .string()
  .trim()
  .min(
    COURSE_LIMITS.requirement.min,
    `Each requirement needs at least ${COURSE_LIMITS.requirement.min} characters`
  )
  .max(
    COURSE_LIMITS.requirement.max,
    `Each requirement max ${COURSE_LIMITS.requirement.max} characters`
  );

export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(COURSE_LIMITS.title.min, `Title must be at least ${COURSE_LIMITS.title.min} characters`)
    .max(COURSE_LIMITS.title.max, `Title max ${COURSE_LIMITS.title.max} characters`),
  subtitle: z
    .string()
    .trim()
    .transform((s) => s.replace(/(?:\u2026|\.{3})+\s*$/g, "").trim())
    .pipe(
      z
        .string()
        .min(
          COURSE_LIMITS.subtitle.min,
          `Subtitle must be at least ${COURSE_LIMITS.subtitle.min} characters`
        )
        .max(
          COURSE_LIMITS.subtitle.max,
          `Subtitle max ${COURSE_LIMITS.subtitle.max} characters`
        )
    ),
  description: z
    .string()
    .trim()
    .min(
      COURSE_LIMITS.description.min,
      `Description must be at least ${COURSE_LIMITS.description.min} characters`
    )
    .max(
      COURSE_LIMITS.description.max,
      `Description max ${COURSE_LIMITS.description.max} characters`
    ),
  thumbnail: z
    .string()
    .min(1, "Thumbnail is required")
    .refine(
      (v) =>
        v.startsWith("https://") ||
        v.startsWith("http://") ||
        v.startsWith("data:image/"),
      "Thumbnail must be an image URL or uploaded image"
    )
    .refine((v) => v.length <= 1_500_000, "Image is too large — try a smaller file"),
  priceInPaise: z.coerce.number().int().min(0).max(100000000),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  deliveryType: z.enum(["SELF_PACED", "LIVE", "OFFLINE"]).optional(),
  instructorId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  trailerProvider: videoProviderEnum.optional().nullable().or(z.literal("")),
  trailerSrc: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .or(z.literal("")),
  learningOutcomes: z
    .array(outcomeItem)
    .min(
      COURSE_LIMITS.outcomes.min,
      `Add at least ${COURSE_LIMITS.outcomes.min} learning outcomes`
    )
    .max(
      COURSE_LIMITS.outcomes.max,
      `At most ${COURSE_LIMITS.outcomes.max} learning outcomes`
    )
    .optional(),
  requirements: z
    .array(requirementItem)
    .min(
      COURSE_LIMITS.requirements.min,
      `Add at least ${COURSE_LIMITS.requirements.min} requirement`
    )
    .max(
      COURSE_LIMITS.requirements.max,
      `At most ${COURSE_LIMITS.requirements.max} requirements`
    )
    .optional(),
});

export const sectionSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.coerce.number().int().min(0).optional(),
});

export const lessonSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional().nullable(),
    type: z.enum(["VIDEO", "TEXT", "PDF"]).default("VIDEO"),
    videoProvider: videoProviderEnum.optional().nullable().or(z.literal("")),
    videoSrc: z
      .string()
      .max(2000)
      .optional()
      .nullable()
      .or(z.literal("")),
    content: z.string().max(100_000).optional().nullable(),
    pdfUrl: optionalUrl,
    duration: z.coerce.number().int().min(0).optional(),
    order: z.coerce.number().int().min(0).optional(),
    isPreview: z.boolean().optional(),
    resources: z
      .array(
        z.object({
          title: z.string().min(1).max(200),
          url: z.string().url(),
          mimeType: z.string().max(100).optional().nullable(),
        })
      )
      .max(20)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "VIDEO") {
      const normalized = normalizeVideoInput({
        provider: data.videoProvider || null,
        src: data.videoSrc,
      });
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message:
            "Add a video: choose provider (YouTube / Vimeo / File) and paste an id or URL",
          path: ["videoSrc"],
        });
      }
    }
    if (data.type === "TEXT" && !data.content?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Text lessons need lesson content",
        path: ["content"],
      });
    }
    if (data.type === "PDF" && !data.pdfUrl) {
      ctx.addIssue({
        code: "custom",
        message: "PDF lessons need a PDF URL or upload",
        path: ["pdfUrl"],
      });
    }
  });

export const progressSchema = z.object({
  lessonId: z.string().cuid(),
  watchedSeconds: z.number().int().min(0).max(86400),
  completed: z.boolean().optional(),
});

export const paymentVerifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  courseId: z.string().cuid(),
});

export const reviewSchema = z.object({
  courseId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .or(z.literal("")),
});
