import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["STUDENT", "TEACHER"]).default("STUDENT"),
  invitationCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === "TEACHER" && !data.invitationCode) {
    return false;
  }
  return true;
}, {
  message: "Invitation code is required for teacher accounts",
  path: ["invitationCode"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const channelSchema = z.object({
  name: z.string().min(2, "Channel name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
});

export const videoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(5000, "Description must be less than 5000 characters").optional(),
  visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]),
  channelId: z.string().min(1, "Channel is required"),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment must be less than 2000 characters"),
  parentId: z.string().optional(),
});

export const playlistSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  isPublic: z.boolean().default(true),
});
