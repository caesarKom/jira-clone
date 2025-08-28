import z from 'zod';
import { db } from '@/lib/db';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createProjectsSchema, updateProjectsSchema } from '../schemas';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { getAuthUser } from '@/lib/getAuthUser';
import { TaskStatus } from '@prisma/client';

const app = new Hono()
  .get(
    '/',
    zValidator('query', z.object({ workspaceId: z.string() })),
    async (c) => {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { workspaceId } = c.req.valid('query');

      const member = await db.member.findFirst({
        where: {
          workspaceId: workspaceId,
          userId: user.id,
        },
      });

      if (!member) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const projects = await db.projects.findMany({
        where: { workspaceId: workspaceId },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          workspaceId: true,
        },
      });

      if (!projects) {
        return c.json({ error: 'Not data found' }, 404);
      }

      return c.json({ data: projects });
    }
  )
  .get(
    '/:projectId',

    async (c) => {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { projectId } = c.req.param();

      const project = await db.projects.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          workspaceId: true,
        },
      });

      if (!project) {
        return c.json({ error: 'Not data found' }, 404);
      }

      const member = await db.member.findFirst({
        where: {
          workspaceId: project.workspaceId,
          userId: user.id,
        },
      });

      if (!member) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      return c.json({ data: project });
    }
  )
  .post('/', zValidator('form', createProjectsSchema), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { name, image, workspaceId } = c.req.valid('form');

    const member = await db.member.findFirst({
      where: {
        workspaceId,
        userId: user.id,
      },
    });

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let uploadedImageUrl: string | undefined;

    if (image instanceof File) {
      const file = await image.arrayBuffer();
      const buffer = Buffer.from(file);

      uploadedImageUrl = `data:image/png;base64,${Buffer.from(buffer).toString(
        'base64'
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
  })
  .patch('/:projectId', zValidator('form', updateProjectsSchema), async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { projectId } = c.req.param();
    const { name, image } = c.req.valid('form');

    let uploadedImageUrl: string | undefined;

    if (image instanceof File) {
      const file = await image.arrayBuffer();
      const buffer = Buffer.from(file);

      uploadedImageUrl = `data:image/png;base64,${Buffer.from(buffer).toString(
        'base64'
      )}`;
    } else {
      uploadedImageUrl = image;
    }

    const project = await db.projects.update({
      where: {
        id: projectId,
      },
      data: {
        name: name,
        imageUrl: uploadedImageUrl,
      },
    });

    return c.json({ data: project });
  })
  .delete('/:projectId', async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { projectId } = c.req.param();

    const project = await db.projects.delete({
      where: {
        id: projectId,
      },
    });

    return c.json({ id: project.id });
  })
  .get('/:projectId/analytics', async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { projectId } = c.req.param();

    const project = await db.projects.findUnique({ where: { id: projectId } });

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const member = await db.member.findFirst({
      where: {
        workspaceId: project?.workspaceId,
        userId: user.id,
      },
    });

    if (!member) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countTasks = async (filter: any) =>
      db.tasks.count({ where: { projectId, ...filter } });

    const taskCount = await countTasks({
      createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
    });
    const assignedTaskCount = await countTasks({
      createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
      assigneeId: user.id,
    });
    const incompleteTaskCount = await countTasks({
      createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
      status: { not: TaskStatus.DONE },
    });
    const completedTaskCount = await countTasks({
      createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
      status: TaskStatus.DONE,
    });
    const overdueTaskCount = await countTasks({
      createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
      status: { not: TaskStatus.DONE },
      dueDate: { lt: now },
    });

    const lastTaskCount = await countTasks({
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
    });
    const lastAssignedTaskCount = await countTasks({
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      assigneeId: user.id,
    });
    const lastIncompleteTaskCount = await countTasks({
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      status: { not: TaskStatus.DONE },
    });
    const lastCompletedTaskCount = await countTasks({
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      status: TaskStatus.DONE,
    });
    const lastOverdueTaskCount = await countTasks({
      createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      status: { not: TaskStatus.DONE },
      dueDate: { lt: now },
    });

    return c.json({
      data: {
        taskCount,
        taskDifference: taskCount - lastTaskCount,
        assignedTaskCount,
        assignedTaskDifference: assignedTaskCount - lastAssignedTaskCount,
        completedTaskCount,
        completedTaskDifference: completedTaskCount - lastCompletedTaskCount,
        incompleteTaskCount,
        incompleteTaskDifference: incompleteTaskCount - lastIncompleteTaskCount,
        overdueTaskCount,
        overdueTaskDifference: overdueTaskCount - lastOverdueTaskCount,
      },
    });
  });

export default app;
