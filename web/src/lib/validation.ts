import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
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
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  password: passwordSchema,
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

export const courseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(5000, "Description must be less than 5000 characters").optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  thumbnailKey: z.string().optional().nullable(),
});

export const lessonSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  position: z.number().int().min(0).default(0),
  lessonType: z.enum(["VIDEO", "TEXT", "QUIZ", "ASSIGNMENT"]).default("VIDEO"),
  videoId: z.string().optional().nullable(),
  duration: z.number().int().min(0).optional().nullable(),
});

export const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(5000, "Description must be less than 5000 characters").optional(),
  dueDate: z.string().datetime().optional().nullable(),
  maxScore: z.number().min(0),
  weight: z.number().min(0).default(1.0),
});

export const quizSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  timeLimit: z.number().int().min(0).optional().nullable(),
  maxScore: z.number().min(0),
  weight: z.number().min(0).default(1.0),
  dueDate: z.string().datetime().optional().nullable(),
});

export const quizQuestionSchema = z.object({
  question: z.string().min(1, "Question text is required").max(2000),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]).default("MULTIPLE_CHOICE"),
  options: z.array(z.string()).default([]),
  correctAnswer: z.union([
    z.array(z.number()),  // MULTIPLE_CHOICE: array of indices
    z.boolean(),           // TRUE_FALSE
    z.string(),            // SHORT_ANSWER
  ]),
  points: z.number().min(0).default(1.0),
  position: z.number().int().min(0).optional(),
});

export const submissionSchema = z.object({
  content: z.string().max(10000).optional().nullable(),
  fileUrl: z.string().url().optional().nullable(),
});

export const gradeSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  value: z.number().min(0),
  scale: z.enum(["PERCENT", "POINTS", "LETTER"]).default("PERCENT"),
  letterGrade: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const enrollmentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});
