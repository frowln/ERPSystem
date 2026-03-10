import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { BatteryWidget } from '@/design-system/components/BatteryWidget';
import { t } from '@/i18n';

const TaskSummaryWidget: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { page: 0, size: 200 }],
    queryFn: () => tasksApi.getTasks({ page: 0, size: 200 }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-20 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-7 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
      </div>
    );
  }

  const tasks = data?.content ?? [];
  const total = tasks.length;
  const done = tasks.filter((t_) => t_.status === 'DONE' || t_.status === 'CANCELLED').length;
  const inProgress = tasks.filter((t_) => t_.status === 'IN_PROGRESS' || t_.status === 'IN_REVIEW').length;
  const todo = tasks.filter((t_) => t_.status === 'TODO' || t_.status === 'BACKLOG').length;
  const overdue = tasks.filter((t_) => {
    if (!t_.plannedEndDate) return false;
    return new Date(t_.plannedEndDate) < new Date() && t_.status !== 'DONE' && t_.status !== 'CANCELLED';
  }).length;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{total}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">{t('dashboard.wid.taskTotal')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
          <div className="text-2xl font-bold text-danger-600 tabular-nums">{overdue}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">{t('dashboard.wid.taskOverdue')}</div>
        </div>
      </div>

      <BatteryWidget
        total={total}
        segments={[
          { value: done, color: 'bg-success-500', label: t('dashboard.wid.taskDone') },
          { value: inProgress, color: 'bg-primary-500', label: t('dashboard.wid.taskInProgress') },
          { value: todo, color: 'bg-neutral-300', label: t('dashboard.wid.taskTodo') },
        ]}
        height={24}
      />
    </div>
  );
};

export default TaskSummaryWidget;
