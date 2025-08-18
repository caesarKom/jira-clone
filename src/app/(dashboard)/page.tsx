import { getWorkspace } from "@/features/workspaces/actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const workspaces = await getWorkspace();
  if (workspaces.length === 0) {
    redirect(`/workspaces/create`);
  } else {
    redirect(`/workspaces/${workspaces[0].id}`);
  }
}
