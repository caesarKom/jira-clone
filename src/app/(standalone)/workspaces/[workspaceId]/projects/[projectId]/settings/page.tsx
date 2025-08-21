import { EditProjectForm } from "@/features/projects/components/edit-project-form";
import { getProjectId } from "@/features/projects/queries";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Params = Promise<{ projectId: string }>;

export default async function ProjectIdSetingsPage({
  params,
}: {
  params: Params;
}) {
  const { projectId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/sign-in");

  const initialValues = await getProjectId({ projectId });

  return (
    <div className="w-full lg:max-w-xl">
      <EditProjectForm initialValues={initialValues} />
    </div>
  );
}
