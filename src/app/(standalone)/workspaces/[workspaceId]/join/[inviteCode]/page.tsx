import { JoinWorkspaceForm } from "@/features/workspaces/components/join-workspace-form";
import { getWorkspaceInfo } from "@/features/workspaces/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Params = Promise<{ workspaceId: string }>;

export default async function JoinWorkspacePage({
  params,
}: {
  params: Params;
}) {
  const { workspaceId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const initialValues = await getWorkspaceInfo({ workspaceId });

  if (!initialValues) {
    redirect("/");
  }

  return (
    <div className="w-full lg:max-w-xl">
      <JoinWorkspaceForm initialValues={initialValues} />
    </div>
  );
}
