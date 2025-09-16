import { TaskStatus } from "@prisma/client";
import z from "zod";

export const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  status: z.enum(TaskStatus, { error: "Required" }),
  workspaceId: z.string().trim().min(1, "Required"),
  projectId: z.string().trim().min(1, "Required"),
dueDate: z.iso.datetime(),
  assigneeId: z.string().trim().min(1, "Required"),
  description: z.string().optional(),
});

export const updateTaskSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  status: z.enum(TaskStatus, { error: "Required" }),
  workspaceId: z.string().trim().min(1, "Required"),
  projectId: z.string().trim().min(1, "Required"),
  dueDate: z.iso.datetime(),
  assigneeId: z.string().trim().min(1, "Required"),
  description: z.string().optional(),
});

export const createTaskFormSchema = createTaskSchema
  .omit({ workspaceId: true })
  // .extend({
  //   dueDate: z.string().min(1, "Required")
  // });


export type CreateTaskFormType = z.infer<typeof createTaskFormSchema>;

export type CreateTaskType = z.infer<typeof createTaskSchema>;
export type UpdateTaskType = z.infer<typeof updateTaskSchema>;

