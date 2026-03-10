import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  BarChart3,
  CalendarDays,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { EmptyState } from '@/design-system/components/EmptyState';
import {
  StatusBadge,
  taskStatusColorMap,
  taskStatusLabels,
  taskPriorityColorMap,
  taskPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { AssigneeAvatar } from '@/components/AssigneeAvatar';
import { TaskDetailPanel } from '@/pages/TaskDetailPanel';
import { TaskCreateModal } from '@/modules/tasks/TaskCreateModal';
import { useTaskBoardStore, type ViewMode } from '@/stores/taskBoardStore';
import { PageSkeleton } from '@/design-system/components/Skeleton';
import { tasksApi } from '@/api/tasks';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { ProjectTask, PaginatedResponse } from '@/types';

const TaskListPage: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { viewMode, setViewMode } = useTaskBoardStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      tasksApi.bulkChangeStatus(ids, status as import('@/types').TaskStatus),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('taskBoard.bulkChangeStatusSuccess', { count: String(variables.ids.length) }));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => tasksApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('bulkActions.deleted'));
    },
    onError: () => toast.error(t('common.operationError')),
  });

  const {
    data: tasksData,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaginatedResponse<ProjectTask>>({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getTasks(),
  });

  const tasks = tasksData?.content ?? [];

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.code.toLowerCase().includes(lower) ||
          t.assigneeName?.toLowerCase().includes(lower) ||
          t.projectName?.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [tasks, statusFilter, priorityFilter, search]);

  const viewModeIcons: Record<ViewMode, { icon: React.ReactNode; label: string }> = useMemo(() => ({
    board: { icon: <LayoutGrid size={16} />, label: t('taskBoard.viewBoard') },
    list: { icon: <List size={16} />, label: t('taskBoard.viewList') },
    gantt: { icon: <BarChart3 size={16} />, label: t('taskBoard.viewGantt') },
    calendar: { icon: <CalendarDays size={16} />, label: t('taskBoard.viewCalendar') },
    my: { icon: <List size={16} />, label: t('taskBoard.viewMy') },
  }), []);

  const columns = useMemo<ColumnDef<ProjectTask, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: t('taskBoard.headerCode'),
        size: 120,
        cell: ({ getValue }) => (
          <span className="font-mono text-neutral-500 text-xs">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'title',
        header: t('taskBoard.headerTitle'),
        size: 320,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.title}</p>
            {row.original.projectName && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{row.original.projectName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('taskBoard.headerStatus'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={taskStatusColorMap}
            label={taskStatusLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'priority',
        header: t('taskBoard.headerPriority'),
        size: 130,
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue<string>()}
            colorMap={taskPriorityColorMap}
            label={taskPriorityLabels[getValue<string>()] ?? getValue<string>()}
          />
        ),
      },
      {
        accessorKey: 'assigneeName',
        header: t('taskBoard.headerAssignee'),
        size: 160,
        cell: ({ getValue }) => {
          const name = getValue<string | undefined>();
          return name ? (
            <AssigneeAvatar name={name} size="sm" showName />
          ) : (
            <span className="text-xs text-neutral-400">{t('taskBoard.unassigned')}</span>
          );
        },
      },
      {
        accessorKey: 'projectName',
        header: t('taskBoard.headerProject'),
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-neutral-600 dark:text-neutral-400 text-sm">{getValue<string>() ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'plannedEndDate',
        header: t('taskBoard.headerDeadline'),
        size: 110,
        cell: ({ getValue, row }) => {
          const date = getValue<string>();
          const isOverdue =
            date && new Date(date) < new Date() && row.original.status !== 'DONE';
          return (
            <span className={`tabular-nums text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-neutral-600'}`}>
              {formatDate(date)}
            </span>
          );
        },
      },
      {
        accessorKey: 'progress',
        header: t('taskBoard.headerProgress'),
        size: 120,
        cell: ({ getValue }) => {
          const val = getValue<number>();
          return (
            <div className="flex items-center gap-2">
              <div className="w-14 h-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${val === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className="text-xs font-medium text-neutral-600 tabular-nums">{val}%</span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      if (mode === 'board') navigate('/tasks');
      else if (mode === 'gantt') navigate('/tasks/gantt');
      else if (mode === 'calendar') navigate('/calendar');
    },
    [setViewMode, navigate],
  );

  const handleRowClick = useCallback(
    (task: ProjectTask) => {
      setSelectedTaskId(task.id);
    },
    [],
  );

  if (isLoading && tasks.length === 0) {
    return <PageSkeleton variant="list" />;
  }

  return (
    <div className={cn(!embedded && 'animate-fade-in')}>
      {!embedded && (
        <PageHeader
          title={t('taskBoard.listTitle')}
          subtitle={t('taskBoard.taskCount', { count: String(tasks.length) })}
          breadcrumbs={[
            { label: t('navigation.items.dashboard'), href: '/' },
            { label: t('taskBoard.title'), href: '/tasks' },
            { label: t('taskBoard.viewList') },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                {(Object.keys(viewModeIcons) as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleViewModeChange(mode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === mode
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    {viewModeIcons[mode].icon}
                    <span className="hidden xl:inline">{viewModeIcons[mode].label}</span>
                  </button>
                ))}
              </div>
              <Button iconLeft={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
                {t('taskBoard.createTask')}
              </Button>
            </div>
          }
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('taskBoard.searchTasks')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: t('taskBoard.allStatuses') },
            ...Object.entries(taskStatusLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={[
            { value: '', label: t('taskBoard.allPriorities') },
            ...Object.entries(taskPriorityLabels).map(([value, label]) => ({ value, label })),
          ]}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {isError && tasks.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <EmptyState
            variant="ERROR"
            actionLabel={t('errors.tryAgain')}
            onAction={() => refetch()}
          />
        </div>
      ) : (
        <DataTable<ProjectTask>
          data={filteredTasks}
          columns={columns}
          loading={isLoading}
          onRowClick={handleRowClick}
          enableRowSelection
          enableColumnVisibility
          enableDensityToggle
          enableExport
          pageSize={20}
          bulkActions={[
            {
              label: t('taskBoard.bulkMarkDone'),
              icon: <ArrowRightLeft size={13} />,
              variant: 'secondary',
              onClick: (rows) => {
                const ids = rows.map((r) => r.id);
                bulkStatusMutation.mutate({ ids, status: 'DONE' });
              },
            },
            {
              label: t('taskBoard.bulkMarkInProgress'),
              icon: <ArrowRightLeft size={13} />,
              variant: 'secondary',
              onClick: (rows) => {
                const ids = rows.map((r) => r.id);
                bulkStatusMutation.mutate({ ids, status: 'IN_PROGRESS' });
              },
            },
            {
              label: t('common.delete'),
              icon: <Trash2 size={13} />,
              variant: 'danger',
              onClick: (rows) => {
                if (!confirm(t('bulkActions.confirmDelete'))) return;
                bulkDeleteMutation.mutate(rows.map((r) => r.id));
              },
            },
          ]}
          emptyTitle={t('taskBoard.emptyTitle')}
          emptyDescription={t('taskBoard.emptyDescription')}
        />
      )}

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      <TaskCreateModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
};

export default TaskListPage;
