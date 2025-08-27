import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { WorkspaceIdSettingsClient } from './client';

export default async function WorkspaceIdSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/sign-in');

  return <WorkspaceIdSettingsClient />;
}
