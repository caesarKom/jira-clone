import { MemberRole, TaskStatus } from "@prisma/client";

export type TaskT = {
    workspaceId: string;
    status: TaskStatus;
    name: string;
    id: string;
    projectId: string;
    assigneeId: string;
    description: string | null;
    dueDate: Date;
    position: number;
}

export type TaskType = {
  name: string;
  status: TaskStatus;
  assigneeId: string;
  projectId: string;
  position: number;
  dueDate: string;
  workspaceId: string;
  description: string | null;
  id: string;
  Projects: {
    name: string;
    id: string;
    workspaceId: string;
    imageUrl: string | null;
  };
  assignee: {
    user: { name: string; id: string; email: string };
    id: string;
    userId: string;
    workspaceId: string;
    role: MemberRole;
  };
};
