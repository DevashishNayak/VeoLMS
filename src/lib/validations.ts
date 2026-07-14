import { z } from "zod";

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

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(10000),
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
  /** ADMIN may reassign; instructors ignore this. */
  instructorId: z.string().cuid().optional(),
  learningOutcomes: z.array(z.string().min(1).max(300)).max(20).optional(),
  requirements: z.array(z.string().min(1).max(300)).max(20).optional(),
});

export const sectionSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.coerce.number().int().min(0).optional(),
});

const optionalUrl = z
  .string()
  .url()
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

export const lessonSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional().nullable(),
    type: z.enum(["VIDEO", "TEXT", "PDF"]).default("VIDEO"),
    youtubeId: z
      .string()
      .max(20)
      .regex(/^[a-zA-Z0-9_-]*$/, "Invalid YouTube video ID")
      .optional()
      .nullable()
      .or(z.literal("").transform(() => null)),
    videoUrl: optionalUrl,
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
      const hasYt = Boolean(data.youtubeId && data.youtubeId.length >= 6);
      const hasFile = Boolean(data.videoUrl);
      if (!hasYt && !hasFile) {
        ctx.addIssue({
          code: "custom",
          message: "Add a YouTube ID and/or an uploaded / hosted video URL",
          path: ["youtubeId"],
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
