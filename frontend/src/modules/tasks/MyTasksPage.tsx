import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Users, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import {
  taskStatusLabels,
  taskPriorityLabels,
} from '@/design-system/components/StatusBadge';
import { t } from '@/i18n';
import { tasksApi, taskFavoritesApi, type MyTasksData } from '@/api/tasks';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/format';
import type { ProjectTask, TaskStatus, PaginatedResponse } from '@/types';

const statusColors: Record<TaskStatus, string> = {
  BACKLOG: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  TODO: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  IN_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  DONE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const priorityColors: Record<string, string> = {
  CRITICAL: 'text-red-600 dark:text-red-400',
  URGENT: 'text-orange-600 dark:text-orange-400',
  HIGH: 'text-amber-600 dark:text-amber-400',
  NORMAL: 'text-neutral-600 dark:text-neutral-400',
  LOW: 'text-neutral-400 dark:text-neutral-500',
};

type TabKey = 'assigned' | 'delegated' | 'favorites';

const MyTasksPage: React.FC<{ embedded?: boolean }> = ({ embedded }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabKey>('assigned');

  const { data, isLoading } = useQuery<MyTasksData>({
    queryKey: ['my-tasks', user?.id],
    queryFn: () => tasksApi.getMyTasks(user?.id ?? ''),
    enabled: !!user?.id,
  });

  // Fetch all tasks for favorites filtering (only when favorites tab active)
  const { data: allTasksData } = useQuery<PaginatedResponse<ProjectTask>>({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getTasks({ size: 200 }),
    enabled: activeTab === 'favorites',
  });

  const favoriteIds = useMemo(() => taskFavoritesApi.getIds(), [activeTab]);
  const favoriteTasks = useMemo(() => {
    if (!allTasksData?.content) return [];
    return allTasksData.content.filter((task) => favoriteIds.has(task.id));
  }, [allTasksData?.content, favoriteIds]);

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'assigned', label: t('myTasks.tabAssigned'), icon: CheckSquare, count: data?.assigned.length ?? 0 },
    { key: 'delegated', label: t('myTasks.tabDelegated'), icon: Users, count: (data?.delegatedByMe ?? []).length },
    { key: 'favorites', label: t('myTasks.tabFavorites'), icon: Star, count: favoriteTasks.length },
  ];

  const currentTasks: ProjectTask[] =
    activeTab === 'assigned' ? (data?.assigned ?? [])
    : activeTab === 'delegated' ? (data?.delegatedByMe ?? [])
    : favoriteTasks;

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          title={t('myTasks.title')}
          subtitle={t('myTasks.subtitle')}
          breadcrumbs={[
            { label: t('navigation.items.dashboard'), href: '/' },
            { label: t('myTasks.title') },
          ]}
        />
      )}

      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={cn(
                'ml-1 rounded-full px-2 py-0.5 text-xs',
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
              )}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : currentTasks.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t('myTasks.empty')}</p>
          <p className="text-sm mt-1">{t('myTasks.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => navigate(`/tasks?selected=${task.id}`)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-400">{task.code}</span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded', statusColors[task.status])}>
                    {taskStatusLabels[task.status] ?? task.status}
                  </span>
                </div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate mt-1">
                  {task.title}
                </p>
                {task.projectName && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {task.projectName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm shrink-0">
                {task.priority && (
                  <span className={cn('text-xs font-medium', priorityColors[task.priority])}>
                    {taskPriorityLabels[task.priority] ?? task.priority}
                  </span>
                )}
                {task.plannedEndDate && (
                  <span className={cn(
                    'flex items-center gap-1 text-xs',
                    new Date(task.plannedEndDate) < new Date() && task.status !== 'DONE'
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-neutral-500 dark:text-neutral-400',
                  )}>
                    <Clock className="h-3 w-3" />
                    {formatDate(task.plannedEndDate)}
                  </span>
                )}
                <div className="w-16">
                  <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        task.progress === 100 ? 'bg-green-500' : 'bg-blue-500',
                      )}
                      style={{ width: `${task.progress ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
