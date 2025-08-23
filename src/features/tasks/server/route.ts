import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createTaskSchema } from "../schemas";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import z from "zod";
import { TaskStatus } from "@prisma/client";

export const app = new Hono()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.enum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish(),
      })
    ),
    async (c) => {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session) return c.json({ error: "Unauthorized" }, 401);

      const { workspaceId, projectId, status, search, assigneeId, dueDate } =
        c.req.valid("query");

      const member = await db.member.findFirst({
        where: {
          workspaceId,
          userId: session.user.id,
        },
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        workspaceId,
      };

      if (projectId) where.projectId = projectId;
      if (assigneeId) where.assigneeId = assigneeId;
      if (status) where.status = status;
      if (dueDate) {
        const date = new Date(dueDate);
        where.dueDate = {
          gte: new Date(date.setUTCHours(0, 0, 0, 0)),
          lt: new Date(date.setUTCHours(24, 0, 0, 0)),
        };
      }
      if (search) {
        where.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      const tasks = await db.tasks.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          Projects: true,
          assignee: {
            include: {
              user: true,
            },
          },
        },
      });

      const populatedTasks = tasks.map((task) => ({
        ...task,
        project: task.Projects,
        assignee: task.assignee,
      }));

      return c.json({ ...tasks, documents: populatedTasks });
    }
  )
  .post("/", zValidator("json", createTaskSchema), async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { name, status, workspaceId, projectId, dueDate, assigneeId } =
      c.req.valid("json");

    const member = await db.member.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const highestPositionTask = await db.tasks.findMany({
      where: {
        workspaceId: workspaceId,
      },
      select: {
        workspaceId: true,
        status: true,
        position: true,
      },
      orderBy: {
        position: "asc",
      },
      take: 1,
    });

    const newPosition =
      highestPositionTask.length > 0
        ? highestPositionTask[0].position + 1000
        : 1000;

    const task = await db.tasks.create({
      data: {
        name,
        status,
        workspaceId,
        projectId,
        dueDate,
        assigneeId,
        position: newPosition,
      },
    });

    return c.json({ data: task });
  });

export default app;
