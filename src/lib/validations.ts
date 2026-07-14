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
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  thumbnail: z.string().url("Must be a valid URL"),
  priceInPaise: z.number().int().min(0).max(100000000),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

export const sectionSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.number().int().min(0),
});

export const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  youtubeId: z
    .string()
    .min(6)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid YouTube video ID"),
  duration: z.number().int().min(0).optional(),
  order: z.number().int().min(0),
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
