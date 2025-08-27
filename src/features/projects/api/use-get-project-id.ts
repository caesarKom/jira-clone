import { client } from '@/lib/rpc';
import { useQuery } from '@tanstack/react-query';

interface Props {
  projectId: string;
}

export const useGetProjectId = ({ projectId }: Props) => {
  const query = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await client.api.projects[':projectId'].$get({
        param: { projectId },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
