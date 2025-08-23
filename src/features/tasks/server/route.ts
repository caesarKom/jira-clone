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
    zValidator("query", z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.enum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish()
    })),
    async (c) => {
        const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const {workspaceId, projectId, status, search, assigneeId, dueDate} = c.req.valid("query")

     const member = await db.member.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });
    
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // 2. Buduje filtry
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


})
.post(
  "/",
  zValidator("json", createTaskSchema),
  async (c) => {
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
        workspaceId: workspaceId 
    },
      select: {
        workspaceId: true,
        status:true,
        position: true
      },
      orderBy: {
        position: "asc"
      },
      take: 1,
    });

    const newPosition = 
        highestPositionTask.length > 0
        ? highestPositionTask[0].position + 1000
        : 1000;

    const task = await db.tasks.create({
        data :{
            name,
            status,
            workspaceId,
            projectId,
            dueDate,
            assigneeId,
            position: newPosition
        }
    })

    return c.json({ data: task })
  }
)
/* .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({
        workspaceId: z.string(),
        projectId: z.string().nullish(),
        assigneeId: z.string().nullish(),
        status: z.enum(TaskStatus).nullish(),
        search: z.string().nullish(),
        dueDate: z.string().nullish()
    })),
    async (c) => {
       const { users } = await getAdminClient()
       const database = c.get("database")
       const user = c.get("user") 

    const {workspaceId, projectId, status, search, assigneeId, dueDate} = c.req.valid("query")

     const member = await getMember({ database, workspaceId, userId: user.$id})
    
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const query = [
        Query.equal("workspaceId", workspaceId),
        Query.orderDesc("$createdAt")
    ]

    if (projectId) {
        query.push(Query.equal("projectId", projectId))
    }
    if (status) {
        query.push(Query.equal("status", status))
    }
     if (search) {
        query.push(Query.equal("search", search))
    }
     if (assigneeId) {
        query.push(Query.equal("assigneeId", assigneeId))
    }
     if (dueDate) {
        query.push(Query.equal("dueDate",dueDate))
    }

    const tasks = await database.listDocument(DATABASE_ID,TASK_ID,query)

    const projectIds = tasks.documents.map((task) => task.projectId)
    const assigneeIds = tasks.documents.map((task) => task.assigneeId)

    const projects = await database.listDocuments(
        DATABASE_ID,
        PROJECTS_ID,
        projectIds.length > 0 ? [Query.contains("$id", projectIds)] : []
    )

    const assignees = await database.listDocuments(
        DATABASE_ID,
        MEMBERS_ID,
        assigneeIds.length > 0 ? [Query.contains("$id", assigneeIds)] : []
    )

    const populatedTasks = tasks.documents.map((task) => {
        const project = projects.documents.find(((project) => project.$id === task.projectId) )
        const assignee = assignees.documents.find(((assignee) => assignee.$id === task.assigneeId) )
        return { ...task, project, assignee}
    })

    return c.json({ ...tasks, documents: populatedTasks })

    }) */

export default app;
