import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export const getWorkspace = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const workspaces = await db.workspaces.findMany({
    where: {
      userId: session?.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (workspaces.length === 0) {
    return [];
  }

  return workspaces;
};

export const getWorkspaceId = async ({
  workspaceId,
}: {
  workspaceId: string;
}) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const workspace = await db.workspaces.findUnique({
    where: {
      id: workspaceId,
      userId: session?.user.id,
    },
  });

  return workspace;
};
