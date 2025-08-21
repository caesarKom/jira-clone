import z from "zod";
import { auth } from "@/lib/auth";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { db } from "@/lib/db";
import { createProjectsSchema } from "../schemas";

const app = new Hono()
  .get(
    "/",
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
      if (!session) return c.json({ error: "Unauthorized" }, 401);

      const { workspaceId } = c.req.valid("query");

      const member = await db.member.findFirst({
        where: {
          workspaceId: workspaceId,
          userId: session.user.id,
        },
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const projects = await db.projects.findMany({
        where: { workspaceId: workspaceId },
      });

      return c.json({ data: projects });
    }
  )
  .post("/", zValidator("form", createProjectsSchema), async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { name, image, workspaceId } = c.req.valid("form");

    const member = await db.member.findFirst({
        where: {
          workspaceId,
          userId:session.user.id
        },
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

    let uploadedImageUrl: string | undefined;

    if (image instanceof File) {
      const file = await image.arrayBuffer();
      const buffer = Buffer.from(file);

      uploadedImageUrl = `data:image/png;base64,${Buffer.from(buffer).toString(
        "base64"
      )}`;
    }

    const project = await db.projects.create({
      data: {
        name,
        imageUrl: uploadedImageUrl,
        workspaceId,
      },
    });

    return c.json({ data: project });
  });

export default app;
