import { auth } from "@/lib/auth"; // Twój Better Auth serwerowy
import type { Context } from "hono";

export async function getAuthUser(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  return session?.user ?? null;
}