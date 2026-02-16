import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  BarChart3,
  CalendarDays,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { Input, Select } from '@/design-system/components/FormField';
import { KanbanColumn } from '@/components/KanbanColumn';
import { TaskDetailPanel } from '@/pages/TaskDetailPanel';
import { useTaskBoardStore, type ViewMode } from '@/stores/taskBoardStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { t } from '@/i18n';
import { tasksApi } from '@/api/tasks';
import type { ProjectTask, TaskStatus, TaskPriority, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

const TaskBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const {
    columns,
    viewMode,
    setViewMode,
    filterByAssignee,
    filterByPriority,
    filterByProject,
    searchQuery,
    setFilterByAssignee,
    setFilterByPriority,
    setFilterByProject,
    setSearchQuery,
    clearFilters,
    draggedTaskId,
    setDraggedTaskId,
    toggleColumn,
    selectedTaskId,
    setSelectedTaskId,
  } = useTaskBoardStore();

  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: tasksData,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaginatedResponse<ProjectTask>>({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getTasks(),
  });

  const allTasks = tasksData?.content ?? [];

  const changeStatusMutation = useMutation({
    mutationFn: ({ taskId, toColumn }: { taskId: string; toColumn: TaskStatus }) =>
      tasksApi.changeStatus(taskId, toColumn),
    onMutate: async ({ taskId, toColumn }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<PaginatedResponse<ProjectTask>>(['tasks']);

      if (previous) {
        queryClient.setQueryData<PaginatedResponse<ProjectTask>>(['tasks'], {
          ...previous,
          content: previous.content.map((task) =>
            task.id === taskId ? { ...task, status: toColumn } : task,
          ),
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tasks'], context.previous);
      }
      toast.error(t('errors.serverErrorRetry'));
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<PaginatedResponse<ProjectTask>>(['tasks'], (current) => {
        if (!current) return current;
        return {
          ...current,
          content: current.content.map((task) =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task,
          ),
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // i18n-aware options built from t() calls
  const priorityOptions = useMemo(() => [
    { value: '', label: t('taskBoard.allPriorities') },
    { value: 'LOW', label: t('taskBoard.priorityLow') },
    { value: 'NORMAL', label: t('taskBoard.priorityNormal') },
    { value: 'HIGH', label: t('taskBoard.priorityHigh') },
    { value: 'URGENT', label: t('taskBoard.priorityUrgent') },
    { value: 'CRITICAL', label: t('taskBoard.priorityCritical') },
  ], []);

  const assigneeOptionsWithAll = useMemo(() => {
    const names = Array.from(
      new Set(
        allTasks
          .map((task) => task.assigneeName?.trim())
          .filter((name): name is string => Boolean(name)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'ru'));
    return [
      { value: '', label: t('taskBoard.allAssignees') },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [allTasks]);

  const projectOptionsWithAll = useMemo(() => {
    const projects = Array.from(
      new Set(
        allTasks
          .map((task) => task.projectName?.trim())
          .filter((name): name is string => Boolean(name)),
      ),
    ).sort((a, b) => a.localeCompare(b, 'ru'));
    return [
      { value: '', label: t('taskBoard.allProjects') },
      ...projects.map((project) => ({ value: project, label: project })),
    ];
  }, [allTasks]);

  const viewModeIcons: Record<ViewMode, { icon: React.ReactNode; label: string }> = useMemo(() => ({
    board: { icon: <LayoutGrid size={16} />, label: t('taskBoard.viewBoard') },
    list: { icon: <List size={16} />, label: t('taskBoard.viewList') },
    gantt: { icon: <BarChart3 size={16} />, label: t('taskBoard.viewGantt') },
    calendar: { icon: <CalendarDays size={16} />, label: t('taskBoard.viewCalendar') },
  }), []);

  // Apply filters
  const filteredTasks = useMemo(() => {
    let result = allTasks;
    if (filterByAssignee) {
      result = result.filter((task) => task.assigneeName === filterByAssignee);
    }
    if (filterByPriority) {
      result = result.filter((task) => task.priority === filterByPriority);
    }
    if (filterByProject) {
      result = result.filter((task) => task.projectName === filterByProject);
    }
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(lower) ||
          task.code.toLowerCase().includes(lower) ||
          task.assigneeName?.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [allTasks, filterByAssignee, filterByPriority, filterByProject, searchQuery]);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const map: Record<string, ProjectTask[]> = {};
    for (const col of columns) {
      map[col.id] = filteredTasks.filter((task) => task.status === col.id);
    }
    return map;
  }, [filteredTasks, columns]);

  const hasActiveFilters = !!(filterByAssignee || filterByPriority || filterByProject || searchQuery);

  /* ─── Drag handlers ─── */
  const handleDragStart = useCallback(
    (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData('text/plain', taskId);
      e.dataTransfer.effectAllowed = 'move';
      setDraggedTaskId(taskId);
    },
    [setDraggedTaskId],
  );

  const handleColumnDragOver = useCallback(
    (columnId: TaskStatus) => {
      setDragOverColumn(columnId);
    },
    [],
  );

  const handleDrop = useCallback(
    (_e: React.DragEvent, toColumn: TaskStatus) => {
      if (!draggedTaskId) return;
      const task = allTasks.find((item) => item.id === draggedTaskId);
      if (!task) {
        setDraggedTaskId(null);
        setDragOverColumn(null);
        return;
      }

      if (task.status !== toColumn) {
        changeStatusMutation.mutate({ taskId: draggedTaskId, toColumn });
      }

      setDraggedTaskId(null);
      setDragOverColumn(null);
    },
    [allTasks, changeStatusMutation, draggedTaskId, setDraggedTaskId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, [setDraggedTaskId]);

  const handleTaskClick = useCallback(
    (taskId: string) => {
      setSelectedTaskId(taskId);
    },
    [setSelectedTaskId],
  );

  /* ─── View mode routing ─── */
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      if (mode === 'list') navigate('/tasks/list');
      else if (mode === 'gantt') navigate('/tasks/gantt');
      else if (mode === 'calendar') navigate('/calendar');
    },
    [setViewMode, navigate],
  );

  return (
    <div className="animate-fade-in" onDragEnd={handleDragEnd}>
      <PageHeader
        title={t('taskBoard.title')}
        subtitle={t('taskBoard.subtitle', { count: String(allTasks.length) })}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('taskBoard.title') },
        ]}
        actions={
          <div className={cn('flex items-center', isMobile ? 'gap-1.5' : 'gap-2')}>
            {/* View mode switch — hidden on mobile to save space */}
            {!isMobile && (
              <div className="flex items-center bg-neutral-100 rounded-lg p-0.5">
                {(Object.keys(viewModeIcons) as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleViewModeChange(mode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === mode
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                    title={viewModeIcons[mode].label}
                  >
                    {viewModeIcons[mode].icon}
                    <span className="hidden xl:inline">{viewModeIcons[mode].label}</span>
                  </button>
                ))}
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Filter size={14} />}
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? 'border-primary-300 text-primary-600' : ''}
            >
              {!isMobile && t('taskBoard.filters')}
              {hasActiveFilters && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </Button>

            <Button
              iconLeft={<Plus size={16} />}
              size={isMobile ? 'sm' : 'md'}
              onClick={() => toast(t('taskBoard.createTaskHint'))}
            >
              {isMobile ? '' : t('taskBoard.createTask')}
            </Button>
          </div>
        }
      />

      {/* Filters bar — stacked on mobile */}
      {showFilters && (
        <div className={cn(
          'mb-4 p-3 bg-white rounded-xl border border-neutral-200 animate-fade-in',
          isMobile ? 'flex flex-col gap-2' : 'flex items-center gap-3',
        )}>
          <div className={cn('relative', isMobile ? 'w-full' : 'flex-1 max-w-xs')}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder={t('taskBoard.searchTasks')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={projectOptionsWithAll}
            value={filterByProject ?? ''}
            onChange={(e) => setFilterByProject(e.target.value || null)}
            className={isMobile ? 'w-full' : 'w-48'}
          />
          <Select
            options={assigneeOptionsWithAll}
            value={filterByAssignee ?? ''}
            onChange={(e) => setFilterByAssignee(e.target.value || null)}
            className={isMobile ? 'w-full' : 'w-44'}
          />
          <Select
            options={priorityOptions}
            value={filterByPriority ?? ''}
            onChange={(e) =>
              setFilterByPriority((e.target.value as TaskPriority) || null)
            }
            className={isMobile ? 'w-full' : 'w-40'}
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" iconLeft={<X size={14} />} onClick={clearFilters}>
              {t('taskBoard.resetFilters')}
            </Button>
          )}
        </div>
      )}

      {isError && allTasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200">
          <EmptyState
            variant="ERROR"
            actionLabel={t('errors.tryAgain')}
            onAction={() => refetch()}
          />
        </div>
      ) : isLoading ? (
        <div
          className={cn(
            'flex gap-4 overflow-x-auto pb-4',
            isMobile && 'snap-x snap-mandatory -mx-4 px-4',
          )}
          style={{ minHeight: isMobile ? 'calc(100vh - 220px)' : 'calc(100vh - 260px)' }}
        >
          {Array.from({ length: isMobile ? 1 : 4 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'rounded-xl border border-neutral-200 bg-white p-3 animate-pulse',
                isMobile ? 'min-w-[85vw] w-[85vw] snap-start' : 'min-w-[280px] w-[280px]',
              )}
            >
              <div className="h-6 bg-neutral-100 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-20 bg-neutral-100 rounded-lg" />
                <div className="h-20 bg-neutral-100 rounded-lg" />
                <div className="h-20 bg-neutral-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            'flex gap-4 overflow-x-auto pb-4',
            isMobile && 'snap-x snap-mandatory -mx-4 px-4',
          )}
          style={{ minHeight: isMobile ? 'calc(100vh - 220px)' : 'calc(100vh - 260px)' }}
        >
          {columns.map((column) => (
            <div key={column.id} className={cn(isMobile && 'snap-start')}>
              <KanbanColumn
                column={column}
                tasks={tasksByColumn[column.id] ?? []}
                onToggleCollapse={toggleColumn}
                onDragStart={handleDragStart}
                onDragOver={() => handleColumnDragOver(column.id)}
                onDrop={handleDrop}
                onTaskClick={handleTaskClick}
                dragOverColumn={dragOverColumn}
              />
            </div>
          ))}
        </div>
      )}

      {/* Task detail slide-in panel */}
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
};

export default TaskBoardPage;
