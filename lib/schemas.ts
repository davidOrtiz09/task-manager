import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

export const EmailSchema = z.object({
  id: z.string().uuid(),
  subject: z.string(),
  body: z.string(),
  createdAt: z.string().datetime(),
  kind: z.enum(["immediate", "recurring"]),
  taskId: z.string().uuid().optional(),
  completionUrl: z.string().url().optional(),
});

export const SmsSchema = z.object({
  id: z.string().uuid(),
  body: z.string(),
  createdAt: z.string().datetime(),
});

export const CreateTaskInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
});

export type Task = z.infer<typeof TaskSchema>;
export type Email = z.infer<typeof EmailSchema>;
export type Sms = z.infer<typeof SmsSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
