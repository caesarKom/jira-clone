'use client';

import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { useGetProjectId } from '@/features/projects/api/use-get-project-id';
import { EditProjectForm } from '@/features/projects/components/edit-project-form';
import { useProjectId } from '@/features/projects/hooks/use-project-id';

export const ProjectIdSetingsClient = () => {
  const projectId = useProjectId();
  const { data: initialValues, isLoading } = useGetProjectId({ projectId });

  if (isLoading) return <PageLoader />;

  if (!initialValues) {
    return <PageError message="Project not found" />;
  }

  return (
    <div className="w-full lg:max-w-xl">
      <EditProjectForm initialValues={initialValues} />
    </div>
  );
};
