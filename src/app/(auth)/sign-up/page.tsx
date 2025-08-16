import { getCurrent } from "@/features/auth/actions";
import { SignupCard } from "@/features/auth/components/signup-card";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const user = await getCurrent();

  if (user) redirect("/");

  return <SignupCard />;
}
