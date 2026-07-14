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
});

export const sectionSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.coerce.number().int().min(0).optional(),
});

export const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  youtubeId: z
    .string()
    .min(6)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid YouTube video ID"),
  duration: z.coerce.number().int().min(0).optional(),
  order: z.coerce.number().int().min(0).optional(),
  isPreview: z.boolean().optional(),
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
