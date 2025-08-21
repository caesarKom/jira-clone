import { db } from "@/lib/db";

export const getProjectId = async ({ projectId }: { projectId: string }) => {
  const project = await db.projects.findUnique({
    where: {
      id: projectId,
    },
  });

   if (!project) {
    throw new Error("Project not found");
  }

  const member = await db.member.findFirst({
    where: { workspaceId: project?.workspaceId },
  });

  if (!member) {
    throw new Error("Unauthorized");
  }

  return project;
};
