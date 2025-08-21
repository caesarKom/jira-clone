import z from "zod";

export const createProjectsSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === "" ? undefined : value)),
    ])
    .optional(),
    workspaceId: z.string()
});

export type CreateProjectsType = z.infer<typeof createProjectsSchema>;

export const updateProjectsSchema = z.object({
  name: z.string().trim().min(1, "Must be 1 or more characters").optional(),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === "" ? undefined : value)),
    ])
    .optional(),
});

export type UpdateProjectsType = z.infer<typeof updateProjectsSchema>;