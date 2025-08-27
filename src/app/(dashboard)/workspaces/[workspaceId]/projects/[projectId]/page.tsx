import { Button } from '@/components/ui/button';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { getProjectId } from '@/features/projects/queries';
import { TaskViewSwitcher } from '@/features/tasks/components/task-view-switcher';
import { auth } from '@/lib/auth';
import { PencilIcon } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type Params = Promise<{ projectId: string }>;

export default async function ProjectIdPage({ params }: { params: Params }) {
  const { projectId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/sign-in');

  const initialValues = await getProjectId({ projectId });

  if (!initialValues) {
    throw new Error('Project not found');
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <ProjectAvatar
            image={initialValues.imageUrl ?? ''}
            name={initialValues.name}
            className="size-8"
          />
          <p className="text-lg font-semibold">{initialValues.name}</p>
        </div>

        <div className="">
          <Button variant="secondary" size="sm" asChild>
            <Link
              href={`/workspaces/${initialValues.workspaceId}/projects/${initialValues.id}/settings`}
            >
              <PencilIcon className="size-4" />
              Edit Project
            </Link>
          </Button>
        </div>
      </div>

      <TaskViewSwitcher hideProjectFilter />
    </div>
  );
}
