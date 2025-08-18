import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createWorkspaceSchema } from "../schemas";
import { createWriteStream } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateInviteCode } from "@/lib/utils";

const app = new Hono()
  .get("/", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const workspaces = await db.workspaces.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json({ data: workspaces });
  })
  .post(
    "/",
    zValidator("form", createWorkspaceSchema),

    async (c) => {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) return c.json({ error: "Unauthorized" }, 401);

      const { name, image } = c.req.valid("form");

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        const file = await image.arrayBuffer();
        const buffer = Buffer.from(file);
        const outputFileName = path.join("./public/upload", `${image.name}`);
        createWriteStream(outputFileName).write(buffer);

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          buffer
        ).toString("base64")}`;
      }

      const workspace = await db.workspaces.create({
        data: {
          name,
          imageUrl: uploadedImageUrl,
          userId: session?.user.id,
          inviteCode: generateInviteCode(10),
        },
      });

      return c.json({ data: workspace });
    }
  );

export default app;
