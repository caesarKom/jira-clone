import { MemberRole } from "@prisma/client";

export type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  workspaceId: string;
};
