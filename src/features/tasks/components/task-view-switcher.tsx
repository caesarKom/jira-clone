'use client';

import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader, PlusIcon } from 'lucide-react';
import { useCreateTaskModal } from '../hooks/use-create-task-modal';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetTask } from '../api/use-get-task';
import { useQueryState } from 'nuqs';
import { DataFilters } from './data-filters';
import { useTaskFilters } from '../hooks/use-task-filter';
import { DataTable } from './data-table';
import { columns } from './columns';
import { DataKanban } from './data-kanban';
import { useCallback } from 'react';
import { TaskStatus } from '@prisma/client';
import { useBulkUpdateTasks } from '../api/use-bulk-update-tasks';
import { DataCalendar } from './data-calendar';

export const TaskViewSwitcher = ({
  hideProjectFilter,
}: {
  hideProjectFilter?: boolean;
}) => {
  const [{ status, assigneeId, projectId, dueDate }] = useTaskFilters();
  const { open } = useCreateTaskModal();

  const { mutate: bulkUpdateTasks } = useBulkUpdateTasks();

  const [view, setView] = useQueryState('task-view', {
    defaultValue: 'table',
  });

  const workspaceId = useWorkspaceId();
  const { data: tasks, isLoading: isLoadingTask } = useGetTask({
    workspaceId,
    status,
    assigneeId,
    projectId,
    dueDate,
  });

  const onKanbanChange = useCallback(
    (tasks: { id: string; status: TaskStatus; position: number }[]) => {
      bulkUpdateTasks({ json: { tasks } });
    },
    [bulkUpdateTasks]
  );

  return (
    <Tabs
      defaultValue={view}
      onValueChange={setView}
      className="flex-1 w-full border rounded-lg"
    >
      <div className="h-full flex flex-col overflow-auto p-4">
        <div className="flex flex-col gap-y-2 lg:flex-row justify-between items-center">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger className="h-8 w-full lg:w-auto" value="table">
              Table
            </TabsTrigger>
            <TabsTrigger className="h-8 w-full lg:w-auto" value="kanban">
              Kanban
            </TabsTrigger>
            <TabsTrigger className="h-8 w-full lg:w-auto" value="calendar">
              Calendar
            </TabsTrigger>
          </TabsList>

          <Button className="w-full lg:w-auto" size="sm" onClick={open}>
            <PlusIcon className="size-4" />
            New Task
          </Button>
        </div>
        <DottedSeparator className="my-4" />

        <DataFilters hideProjectFilter={hideProjectFilter} />
        
        <DottedSeparator className="my-4" />
        {isLoadingTask ? (
          <div className="w-full border rounded-lg h-[200px] flex flex-col items-center justify-center">
            <Loader className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="table" className="mt-0">
              <DataTable columns={columns} data={tasks ?? []} />
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              <DataKanban onChange={onKanbanChange} data={tasks ?? []} />
            </TabsContent>
            <TabsContent value="calendar" className="mt-0 h-full pb-4">
              <DataCalendar data={tasks ?? []} />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
};
