import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { Project, TaskType } from '../types';
import Link from 'next/link';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { ChevronRightIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeleteTask } from '../api/use-delete-task';
import { useConfirm } from '@/hooks/use-confirm';
import { useRouter } from 'next/navigation';

interface Props {
  task: TaskType;
  project: Project;
}

export const TaskBreadcrumbs = ({ task, project }: Props) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const { mutate: deleteTask, isPending } = useDeleteTask();

  const [ConfirmDialog, confirm] = useConfirm(
    'Delete task',
    'This action cannot be undone.',
    'destructive'
  );

  const handleDeleteTask = async () => {
    const ok = await confirm();
    if (!ok) return;

    deleteTask(
      { param: { taskId: task.id } },
      {
        onSuccess: () => {
          router.push(`/workspaces/${workspaceId}/tasks`);
        },
      }
    );
  };

  return (
    <div className="flex items-center gap-x-2">
      <ConfirmDialog />
      <ProjectAvatar
        name={project.name}
        image={project.imageUrl ?? ''}
        className="size-6 lg:size-8"
      />
      <Link href={`/workspaces/${workspaceId}/projects/${project.id}`}>
        <p className="text-sm lg:text-lg font-semibold text-muted-foreground hover:opacity-75 transition">
          {project.name}
        </p>
      </Link>
      <ChevronRightIcon className="size-4 lg:size-5 text-muted-foreground" />
      <p className="text-sm lg:text-lg font-semibold">{task.name}</p>
      <Button
        className="ml-auto"
        variant="destructive"
        size="sm"
        onClick={handleDeleteTask}
        disabled={isPending}
      >
        <Trash2Icon className="size-4" />
        <span className="hidden lg:block">Delete Task</span>
      </Button>
    </div>
  );
};
