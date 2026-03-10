import React, { useState, useMemo, useCallback, lazy, Suspense, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  BarChart3,
  CalendarDays,
  Settings2,
  X,
  User,
  FolderKanban,
  Flag,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { EmptyState } from '@/design-system/components/EmptyState';
import { KanbanColumn } from '@/components/KanbanColumn';
import { TaskDetailPanel } from '@/pages/TaskDetailPanel';
import { TaskCreateModal } from '@/modules/tasks/TaskCreateModal';
import TaskStagesManager from '@/modules/tasks/TaskStagesManager';
import { useTaskBoardStore, stagesToColumns, getDefaultColumns, type ViewMode } from '@/stores/taskBoardStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useProjectOptions, useUserOptions } from '@/hooks/useSelectOptions';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import { tasksApi, taskFavoritesApi } from '@/api/tasks';
import type { ProjectTask, TaskStatus, TaskPriority, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

const TaskListPage = lazy(() => import('@/pages/TaskListPage'));
const GanttPage = lazy(() => import('@/pages/GanttPage'));
const MyTasksPage = lazy(() => import('@/modules/tasks/MyTasksPage'));
const TaskCalendarView = lazy(() => import('@/modules/tasks/TaskCalendarView'));

const ViewSkeleton = () => (
  <div className="flex justify-center py-12">
    <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
  </div>
);

const TaskBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const {
    columns,
    setColumns,
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

  const currentUser = useAuthStore((s) => s.user);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInStatus, setCreateInStatus] = useState<TaskStatus | null>(null);
  const [showStagesManager, setShowStagesManager] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => taskFavoritesApi.getIds());
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Open task from URL ?selected=taskId
  useEffect(() => {
    const selectedFromUrl = searchParams.get('selected');
    if (selectedFromUrl && !selectedTaskId) {
      setSelectedTaskId(selectedFromUrl);
    }
  }, [searchParams, selectedTaskId, setSelectedTaskId]);

  // Data for filters — from API
  const { options: projectOptionsRaw } = useProjectOptions();
  const { options: userOptionsRaw } = useUserOptions();

  // Fetch tasks
  const {
    data: tasksData,
    isLoading,
    isError,
    refetch,
  } = useQuery<PaginatedResponse<ProjectTask>>({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getTasks({ size: 200 }),
    enabled: viewMode === 'board' || viewMode === 'calendar',
  });

  const allTasks = tasksData?.content ?? [];

  // Fetch stages for selected project → update columns
  const { data: projectStages } = useQuery({
    queryKey: ['task-stages', filterByProject],
    queryFn: () => tasksApi.getStages(filterByProject!),
    enabled: viewMode === 'board' && !!filterByProject,
  });

  // Update columns when stages change
  useEffect(() => {
    if (filterByProject && projectStages && projectStages.length > 0) {
      setColumns(stagesToColumns(projectStages));
    } else {
      setColumns(getDefaultColumns());
    }
  }, [filterByProject, projectStages, setColumns]);

  const changeStatusMutation = useMutation({
    mutationFn: ({ taskId, toStatus }: { taskId: string; toStatus: TaskStatus }) =>
      tasksApi.changeStatus(taskId, toStatus),
    onMutate: async ({ taskId, toStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData<PaginatedResponse<ProjectTask>>(['tasks']);
      if (previous) {
        queryClient.setQueryData<PaginatedResponse<ProjectTask>>(['tasks'], {
          ...previous,
          content: previous.content.map((task) =>
            task.id === taskId ? { ...task, status: toStatus } : task,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['tasks'], context.previous);
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

  /* ─── Filter options ─── */
  const priorityOptions = useMemo(() => [
    { value: '', label: t('taskBoard.allPriorities') },
    { value: 'LOW', label: t('taskBoard.priorityLow') },
    { value: 'NORMAL', label: t('taskBoard.priorityNormal') },
    { value: 'HIGH', label: t('taskBoard.priorityHigh') },
    { value: 'URGENT', label: t('taskBoard.priorityUrgent') },
    { value: 'CRITICAL', label: t('taskBoard.priorityCritical') },
  ], []);

  const projectFilterOptions = useMemo(() => [
    { value: '', label: t('taskBoard.allProjects') },
    ...projectOptionsRaw,
  ], [projectOptionsRaw]);

  const assigneeFilterOptions = useMemo(() => [
    { value: '', label: t('taskBoard.allAssignees') },
    ...userOptionsRaw,
  ], [userOptionsRaw]);

  const VIEW_MODES: { mode: ViewMode; icon: React.ReactNode; label: string }[] = useMemo(() => [
    { mode: 'board', icon: <LayoutGrid size={16} />, label: t('taskBoard.viewBoard') },
    { mode: 'list', icon: <List size={16} />, label: t('taskBoard.viewList') },
    { mode: 'gantt', icon: <BarChart3 size={16} />, label: t('taskBoard.viewGantt') },
    { mode: 'calendar', icon: <CalendarDays size={16} />, label: t('taskBoard.viewCalendar') },
    { mode: 'my', icon: <UserCheck size={16} />, label: t('taskBoard.viewMy') },
  ], []);

  /* ─── Filtering ─── */
  const filteredTasks = useMemo(() => {
    let result = allTasks;
    if (onlyMyTasks && currentUser?.id) {
      result = result.filter((task) => task.assigneeId === currentUser.id);
    }
    if (filterByAssignee) {
      result = result.filter((task) => task.assigneeId === filterByAssignee);
    }
    if (filterByPriority) {
      result = result.filter((task) => task.priority === filterByPriority);
    }
    if (filterByProject) {
      result = result.filter((task) => task.projectId === filterByProject);
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
  }, [allTasks, onlyMyTasks, currentUser?.id, filterByAssignee, filterByPriority, filterByProject, searchQuery]);

  // Map tasks to columns using statusFilter
  const tasksByColumn = useMemo(() => {
    const map: Record<string, ProjectTask[]> = {};
    for (const col of columns) {
      map[col.id] = filteredTasks.filter((task) => col.statusFilter.includes(task.status));
    }
    return map;
  }, [filteredTasks, columns]);

  const hasActiveFilters = !!(filterByAssignee || filterByPriority || filterByProject || searchQuery || onlyMyTasks);

  /* ─── Favorites ─── */
  const handleToggleFavorite = useCallback((taskId: string) => {
    const added = taskFavoritesApi.toggle(taskId);
    setFavoriteIds(taskFavoritesApi.getIds());
    toast.success(added ? t('taskCard.addedToFavorites') : t('taskCard.removedFromFavorites'));
  }, []);

  /* ─── Status change from card menu ─── */
  const handleCardChangeStatus = useCallback((taskId: string, status: TaskStatus) => {
    changeStatusMutation.mutate({ taskId, toStatus: status });
  }, [changeStatusMutation]);

  /* ─── Drag handlers ─── */
  const handleDragStart = useCallback(
    (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData('text/plain', taskId);
      e.dataTransfer.effectAllowed = 'move';
      setDraggedTaskId(taskId);
    },
    [setDraggedTaskId],
  );

  const handleColumnDragOver = useCallback((columnId: string) => {
    setDragOverColumn(columnId);
  }, []);

  const handleDrop = useCallback(
    (_e: React.DragEvent, toColumnId: string) => {
      if (!draggedTaskId) return;
      const task = allTasks.find((item) => item.id === draggedTaskId);
      if (!task) { setDraggedTaskId(null); setDragOverColumn(null); return; }

      const targetColumn = columns.find((c) => c.id === toColumnId);
      if (!targetColumn) { setDraggedTaskId(null); setDragOverColumn(null); return; }

      const targetStatus = targetColumn.dropStatus;
      if (task.status !== targetStatus) {
        changeStatusMutation.mutate({ taskId: draggedTaskId, toStatus: targetStatus });
      }
      setDraggedTaskId(null);
      setDragOverColumn(null);
    },
    [allTasks, columns, changeStatusMutation, draggedTaskId, setDraggedTaskId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, [setDraggedTaskId]);

  const handleTaskClick = useCallback(
    (taskId: string) => setSelectedTaskId(taskId),
    [setSelectedTaskId],
  );

  const handleCreateInColumn = useCallback((columnId: string) => {
    const col = columns.find((c) => c.id === columnId);
    setCreateInStatus(col?.dropStatus ?? null);
    setCreateModalOpen(true);
  }, [columns]);

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
    },
    [setViewMode],
  );

  const showFiltersAndBoard = viewMode === 'board' || viewMode === 'calendar';

  return (
    <div className="animate-fade-in" onDragEnd={handleDragEnd}>
      <PageHeader
        title={t('taskBoard.title')}
        subtitle={viewMode === 'my' ? t('myTasks.subtitle') : t('taskBoard.subtitle', { count: String(allTasks.length) })}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/' },
          { label: t('taskBoard.title') },
        ]}
        actions={
          <div className={cn('flex items-center', isMobile ? 'gap-1.5' : 'gap-2')}>
            {!isMobile && (
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5">
                {VIEW_MODES.map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => handleViewModeChange(mode)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                      viewMode === mode
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200',
                    )}
                    title={label}
                  >
                    {icon}
                    <span className="hidden xl:inline">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {viewMode === 'board' && (
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Settings2 size={14} />}
                onClick={() => setShowStagesManager(true)}
                title={t('taskStages.title')}
              >
                {!isMobile && t('taskStages.title')}
              </Button>
            )}

            <Button
              iconLeft={<Plus size={16} />}
              size={isMobile ? 'sm' : 'md'}
              onClick={() => { setCreateInStatus(null); setCreateModalOpen(true); }}
            >
              {isMobile ? '' : t('taskBoard.createTask')}
            </Button>
          </div>
        }
      />

      {/* ─── Filters — board mode only ─── */}
      {showFiltersAndBoard && (
        <div className={cn(
          'mb-4 flex items-center gap-2 flex-wrap',
          isMobile && 'flex-col',
        )}>
          <div className={cn('relative', isMobile ? 'w-full' : 'w-56')}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder={t('taskBoard.searchTasks')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 focus:border-primary-300 dark:focus:border-primary-600 transition-colors"
            />
          </div>

          <FilterChip
            icon={<FolderKanban size={13} />}
            label={filterByProject ? (projectFilterOptions.find((o) => o.value === filterByProject)?.label ?? filterByProject) : t('taskBoard.allProjects')}
            active={!!filterByProject}
            options={projectFilterOptions}
            value={filterByProject ?? ''}
            onChange={(v) => setFilterByProject(v || null)}
          />
          <FilterChip
            icon={<User size={13} />}
            label={filterByAssignee ? (assigneeFilterOptions.find((o) => o.value === filterByAssignee)?.label ?? filterByAssignee) : t('taskBoard.allAssignees')}
            active={!!filterByAssignee}
            options={assigneeFilterOptions}
            value={filterByAssignee ?? ''}
            onChange={(v) => setFilterByAssignee(v || null)}
          />
          <FilterChip
            icon={<Flag size={13} />}
            label={filterByPriority ? priorityOptions.find((o) => o.value === filterByPriority)?.label ?? filterByPriority : t('taskBoard.allPriorities')}
            active={!!filterByPriority}
            options={priorityOptions}
            value={filterByPriority ?? ''}
            onChange={(v) => setFilterByPriority((v as TaskPriority) || null)}
          />

          {/* My Tasks toggle */}
          <button
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              onlyMyTasks
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600',
            )}
          >
            <UserCheck size={13} />
            {t('taskBoard.onlyMyTasks')}
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => { clearFilters(); setOnlyMyTasks(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X size={13} />
              {t('taskBoard.resetFilters')}
            </button>
          )}
        </div>
      )}

      {/* ─── View content ─── */}
      {viewMode === 'board' && (
        <>
          {isError && allTasks.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <EmptyState variant="ERROR" actionLabel={t('errors.tryAgain')} onAction={() => refetch()} />
            </div>
          ) : isLoading ? (
            <div
              className={cn('flex gap-4 overflow-x-auto pb-4', isMobile && 'snap-x snap-mandatory -mx-4 px-4')}
              style={{ minHeight: isMobile ? 'calc(100vh - 280px)' : 'calc(100vh - 300px)' }}
            >
              {Array.from({ length: isMobile ? 1 : columns.length }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 animate-pulse flex-shrink-0',
                    isMobile ? 'min-w-[85vw] w-[85vw] snap-start' : 'min-w-[300px] w-[300px]',
                  )}
                >
                  <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
                    <div className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
                    <div className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={cn('flex gap-4 overflow-x-auto pb-4', isMobile && 'snap-x snap-mandatory -mx-4 px-4')}
              style={{ minHeight: isMobile ? 'calc(100vh - 280px)' : 'calc(100vh - 300px)' }}
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
                    onCreateTask={handleCreateInColumn}
                    onToggleFavorite={handleToggleFavorite}
                    favoriteIds={favoriteIds}
                    dragOverColumn={dragOverColumn}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {viewMode === 'list' && (
        <Suspense fallback={<ViewSkeleton />}>
          <TaskListPage embedded />
        </Suspense>
      )}

      {viewMode === 'gantt' && (
        <Suspense fallback={<ViewSkeleton />}>
          <GanttPage embedded />
        </Suspense>
      )}

      {viewMode === 'calendar' && (
        <Suspense fallback={<ViewSkeleton />}>
          <TaskCalendarView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onDateClick={(date) => {
              setCreateInStatus(null);
              setCreateModalOpen(true);
            }}
          />
        </Suspense>
      )}

      {viewMode === 'my' && (
        <Suspense fallback={<ViewSkeleton />}>
          <MyTasksPage embedded />
        </Suspense>
      )}

      {selectedTaskId && (
        <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}

      <TaskCreateModal open={createModalOpen} onClose={() => { setCreateModalOpen(false); setCreateInStatus(null); }} defaultStatus={createInStatus ?? undefined} />

      <TaskStagesManager open={showStagesManager} onClose={() => { setShowStagesManager(false); }} />
    </div>
  );
};

/* ─── FilterChip component (YouGile-style) ─── */
function FilterChip({
  icon,
  label,
  active,
  options,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
          active
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600',
        )}
      >
        {icon}
        <span className="max-w-[140px] truncate">{label}</span>
        {active && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }}
            className="ml-0.5 p-0.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
          >
            <X size={10} />
          </button>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 max-h-64 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-dropdown py-1 animate-fade-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors',
                opt.value === value
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskBoardPage;
