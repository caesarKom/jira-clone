import { Card, CardContent } from "@/components/ui/card";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { Loader } from "lucide-react";
import { useGetTaskId } from "../api/use-get-task-id";
import { EditTaskForm } from "./edit-task-form";

interface Props {
  onCancel: () => void;
  id: string;
}

export const EditTaskFormWrapper = ({ onCancel, id }: Props) => {
  const workspaceId = useWorkspaceId();

  const {data:initialValues, isLoading:isLoadingTask } = useGetTaskId({ taskId: id })

  const { data: projects, isLoading: isloadingProjects } = useGetProjects({
    workspaceId,
  });
  const { data: members, isLoading: isloadingMembers } = useGetMembers({
    workspaceId,
  });

  const projectOptions = projects?.map((project) => ({
    id: project.id,
    name: project.name,
    imageUrl: project.imageUrl ?? "",
  }));

  const memberOptions = members?.map((member) => ({
    id: member.id,
    name: member.name,
  }));

  const isloading = isloadingMembers || isloadingProjects || isLoadingTask

  if (isloading) {
    return (
      <Card className="w-full h-[714px] border-none shadow-none">
        <CardContent className="flex items-center justify-center h-full">
          <Loader className="size-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!initialValues) return null

  return (
    <EditTaskForm
      onCancel={onCancel}
      projectOptions={projectOptions ?? []}
      memberOptions={memberOptions ?? []}
      initialValues={initialValues}
    />
  );
};
