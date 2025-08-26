import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createTaskSchema, updateTaskSchema } from "../schemas";
import { db } from "@/lib/db";
import z from "zod";
import { TaskStatus } from "@prisma/client";
import { getAuthUser } from "@/lib/getAuthUser";

export const app = new Hono()
  .get("/:taskId", async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { taskId } = c.req.param();

    const task = await db.tasks.findUnique({
      where: { id: taskId },
    });
    if (!task) return c.json({ error: "Task not found" }, 404);

    const member = await db.member.findFirst({
      where: {
        workspaceId: task.workspaceId,
        id: task.assigneeId,
      },
    });
    if (!member) return c.json({ error: "Unauthorized" }, 401);

    const project = await db.projects.findUnique({
      where: { id: task.projectId },
    });
    if (!project) return c.json({ error: "Project not found" }, 404);

    const assignee = {
      ...member,
      name: user.name,
      email: user.email,
    };

    return c.json({ data: { ...task, project, assignee } });
  })
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
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const { workspaceId, projectId, status, search, assigneeId, dueDate } =
        c.req.valid("query");

      const member = await db.member.findFirst({
        where: {
          workspaceId,
          userId: user.id,
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
          Projects: {
            select: {
              id: true,
              imageUrl: true,
              name: true,
              workspaceId: true,
            },
          },
          assignee: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      const populatedTasks = tasks.map((task) => ({
        ...task,
        //project: task.Projects,
        assignee: task.assignee,
      }));

      return c.json({ ...tasks, data: populatedTasks });
    }
  )
  .post("/", zValidator("json", createTaskSchema), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { name, status, workspaceId, projectId, dueDate, assigneeId } =
      c.req.valid("json");

    const member = await db.member.findFirst({
      where: {
        workspaceId,
        userId: user.id,
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
  })
  .patch("/:taskId", zValidator("json", updateTaskSchema), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    const { taskId } = c.req.param();
    const { name, status, description, projectId, dueDate, assigneeId } =
      c.req.valid("json");

    const existingTask = await db.tasks.findUnique({ where: { id: taskId } });

    if (!existingTask) return c.json({ error: "Task not found" }, 404);

    const member = await db.member.findFirst({
      where: {
        workspaceId: existingTask.workspaceId,
        userId: user.id,
      },
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const task = await db.tasks.update({
      where: { id: existingTask.id },
      data: {
        name,
        status,
        projectId,
        dueDate,
        assigneeId,
        description,
      },
    });

    return c.json({ data: task });
  })

  .delete("/:taskId", async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { taskId } = c.req.param();

    const existTask = await db.tasks.findUnique({
      where: { id: taskId },
    });

    if (!existTask) {
      return c.json({ error: "Task not found" }, 404);
    }

    const member = await db.member.findFirst({
      where: {
        workspaceId: existTask.workspaceId,
        userId: user.id,
      },
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await db.tasks.delete({
      where: { id: existTask.id },
    });

    return c.json({ data: { id: existTask.id } });
  })
  .post(
    "/bulk-update",
    zValidator(
      "json",
      z.object({
        tasks: z.array(
          z.object({
            id: z.string(),
            status: z.enum(TaskStatus),
            position: z.number().int().positive().min(1000).max(1_000_000),
          })
        ),
      })
    ),
    async (c) => {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Unauthorized" }, 401);

      const { tasks } = c.req.valid("json");

      // Get all tasks id
      const taskIds = tasks.map((t) => t.id);
      const dbTasks = await db.tasks.findMany({
        where: { id: { in: taskIds } },
        select: { id: true, workspaceId: true },
      });

      if (dbTasks.length !== tasks.length) {
        return c.json({ error: "Some tasks not found" }, 404);
      }

      const workspaceIds = new Set(dbTasks.map((t) => t.workspaceId));
      if (workspaceIds.size !== 1) {
        return c.json(
          { error: "All tasks must belong to the same workspace" },
          400
        );
      }

      const workspaceId = workspaceIds.values().next().value;

      const member = await db.member.findFirst({
        where: {
          workspaceId,
          userId: user.id,
        },
      });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const updatedTasks = await db.$transaction(
        tasks.map(({ id, status, position }) =>
          db.tasks.update({
            where: { id },
            data: { status, position },
          })
        )
      );

      return c.json({ data: updatedTasks });
    }
  );

export default app;
