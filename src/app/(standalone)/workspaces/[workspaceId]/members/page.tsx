import { MembersList } from "@/features/workspaces/components/member-list";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function WorkspaceIdMembersPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
      });
    
      if (!session) redirect("/sign-in");

    return (
        <div className="w-full lg:max-w-xl">
            <MembersList />
        </div>
    )
}