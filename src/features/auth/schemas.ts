import z from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const registerSchema = z.object({
  name: z.string().min(6, "Minimum of 6 characters"),
  email: z.email(),
  password: z.string().min(8, "Minimum of 8 characters"),
});

export type LoginType = z.infer<typeof loginSchema>;

export type RegisterType = z.infer<typeof registerSchema>;
