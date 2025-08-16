import { getCurrent } from "@/features/auth/actions";
import { SigninCard } from "@/features/auth/components/signin-card";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const user = await getCurrent();

  if (user) redirect("/");

  return <SigninCard />;
}
