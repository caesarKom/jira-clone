import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

interface Props {
  workspaceId: string;
}

export const useGetTask = ({ workspaceId }: Props) => {
  const query = useQuery({
    queryKey: ["tasks", workspaceId],
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: { workspaceId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const { documents } = await response.json();

      return documents;
    },
  });

  return query;
};
