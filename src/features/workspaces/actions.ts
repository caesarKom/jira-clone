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
