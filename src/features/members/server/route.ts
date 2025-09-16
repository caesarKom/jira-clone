import z from "zod";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";
import { getAuthUser } from "@/lib/getAuthUser";

const app = new Hono()
  .get(
    "/",
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const { workspaceId } = c.req.valid("query");

      const members = await db.member.findMany({
        where: {
          workspaceId,
        },
      });

      if (!members) {
        if (!Array.isArray(members))
          return c.json({ error: "Unauthorized" }, 401);
      }

      const userIds = members.map((m) => m.userId);

      const users = await db.user.findMany({
        where: { id: { in: userIds } },
      });

      const userMap = new Map(users.map((user) => [user.id, user]));

      const populatedMembers = members
        .map((m) => {
          const user = userMap.get(m.userId);
          if (!user) return null;
          return {
            id: m.id,
            userId: m.userId,
            name: user.name,
            email: user.email,
            role: m.role,
            workspaceId: m.workspaceId,
          };
        })
        .filter(Boolean);

      return c.json({ data: populatedMembers });
    }
  )
  .delete("/:memberId", async (c) => {
    const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { memberId } = c.req.param();

    const member = await getMember(user.id);

    if (!member || member.role !== MemberRole.ADMIN)
      return c.json({ error: "Unauthorized" }, 401);

    const memberToDelete = await db.member.delete({
      where: {
        id: memberId,
      },
    });

    return c.json({ data: { id: memberToDelete.id } });
  })
  .patch(
    "/:memberId",
    zValidator("json", z.object({ role: z.enum(MemberRole) })),
    async (c) => {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const { memberId } = c.req.param();
      const { role } = c.req.valid("json");

      const member = await getMember(user.id);

      if (!member || member.role !== MemberRole.ADMIN)
        return c.json({ error: "Unauthorized" }, 401);

      const memberToUpdate = await db.member.update({
        where: {
          id: memberId,
        },
        data: {
          role,
        },
      });

      return c.json({ data: memberToUpdate });
    }
  );

export default app;

async function getMember(userId: string) {
  const member = await db.member.findFirst({
    where: { userId: userId },
  });
  return member;
}
