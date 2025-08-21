import z from "zod";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";

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

      const members = await db.member.findMany({
        where: {
          workspaceId,
        },
      });

      if (!members) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const populatedMembers = await Promise.all(
        members.map(async (memb) => {
          const user = await getUser(memb.userId);
          if (!user) return null;
          return {
            ...memb,
            name: user.name,
            email: user.email,
          };
        })
      );
      if (!populatedMembers || !members) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      return c.json({ data: populatedMembers }, 200);
    }
  )
  .delete("/:memberId", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { memberId } = c.req.param();

    const member = await getMember(session.user.id);

    if (!member || member.role !== MemberRole.ADMIN)
      return c.json({ error: "Unauthorized" }, 401);

    const memberToDelete = await db.member.delete({
      where: {
        id: memberId,
      },
    });

    return c.json({ data: { id: memberToDelete.id } });
  })
  .patch("/:memberId",
    zValidator("json", z.object({ role: z.enum(MemberRole)})),
    async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { memberId } = c.req.param();
    const { role } = c.req.valid("json")

    const member = await getMember(session.user.id);

    if (!member || member.role !== MemberRole.ADMIN)
      return c.json({ error: "Unauthorized" }, 401);

    const memberToUpdate = await db.member.update({
      where: {
        id: memberId,
      },
      data: {
        role
      }
    });

    return c.json({ data: memberToUpdate });
  })
  

export default app;

async function getUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });
  return user;
}

async function getMember(userId: string) {
  const member = await db.member.findFirst({
    where: { userId: userId },
  });
  return member;
}
