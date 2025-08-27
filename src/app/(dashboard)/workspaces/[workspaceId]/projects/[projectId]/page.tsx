import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProjectIdClient } from './client';

export default async function ProjectIdPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/sign-in');

  return <ProjectIdClient />;
}
