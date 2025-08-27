import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { JoinWorkspaceClient } from "./client";

export default async function JoinWorkspacePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  return <JoinWorkspaceClient />
}
