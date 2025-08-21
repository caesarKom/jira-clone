import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../schemas";
// import { createWriteStream } from "fs";
// import path from "path";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateInviteCode } from "@/lib/utils";
import z from "zod";
import { MemberRole } from "@prisma/client";

const app = new Hono()
  .get("/", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const members = await db.member.findMany({
      where: { userId: session.user.id },
    });

    if (members.length === 0) {
      return c.json({ data: [] });
    }

    const workIds = members.map((member) => member.workspaceId);

    const workspace = await db.workspaces.findMany({
      where: {
        id: { in: workIds },
      },
      select: {
        id: true,
        userId: true,
        imageUrl: true,
        name: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return c.json({ data: workspace });
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
        // const outputFileName = path.join("./public/upload", `${image.name}`);
        // createWriteStream(outputFileName).write(buffer);

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

      await db.member.create({
        data: {
          role: MemberRole.ADMIN,
          userId: workspace.userId,
          workspaceId: workspace.id,
        },
      });

      return c.json({ data: workspace });
    }
  )
  .patch(
    "/:workspaceId",
    zValidator("form", updateWorkspaceSchema),
    async (c) => {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) return c.json({ error: "Unauthorized" }, 401);

      const { workspaceId } = c.req.param();
      const { name, image } = c.req.valid("form");

      let uploadedImageUrl: string | undefined;

      if (image instanceof File) {
        const file = await image.arrayBuffer();
        const buffer = Buffer.from(file);

        uploadedImageUrl = `data:image/png;base64,${Buffer.from(
          buffer
        ).toString("base64")}`;
      } else {
        uploadedImageUrl = image;
      }

      const workspace = await db.workspaces.update({
        where: {
          userId: session.user.id,
          id: workspaceId,
        },
        data: {
          name: name,
          imageUrl: uploadedImageUrl,
        },
      });

      return c.json({ data: workspace });
    }
  )
  .delete("/:workspaceId", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { workspaceId } = c.req.param();

    // TODO: delete member,project and tasks

    const workspace = await db.workspaces.delete({
      where: {
        id: workspaceId,
        userId: session.user.id,
      },
    });

    return c.json({ id: workspace.id });
  })
  .post("/:workspaceId/reset-invite-code", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { workspaceId } = c.req.param();

    // TODO: delete member,project and tasks

    const workspace = await db.workspaces.update({
      where: {
        id: workspaceId,
        userId: session.user.id,
      },
      data: {
        inviteCode: generateInviteCode(10),
      },
    });

    return c.json({ data: workspace });
  })
  .post(
    "/:workspaceId/join",
    zValidator("json", z.object({ code: z.string() })),
    async (c) => {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) return c.json({ error: "Unauthorized" }, 401);

      const { workspaceId } = c.req.param();
      const { code } = c.req.valid("json");

      const member = await db.member.findFirst({
        where: {
          workspaceId,
          userId: session.user.id,
        },
      });

      if (member) {
        return c.json({ error: "Already a member" }, 400);
      }

      const workspace = await db.workspaces.findUnique({
        where: {
          id: workspaceId,
        },
      });

      if (workspace?.inviteCode !== code) {
        return c.json({ error: "Invalid invite code" }, 400);
      }

      await db.member.create({
        data: {
          userId: session.user.id,
          workspaceId: workspaceId,
          role: MemberRole.MEMBER,
        },
      });

      return c.json({ data: workspace });
    }
  );

export default app;
