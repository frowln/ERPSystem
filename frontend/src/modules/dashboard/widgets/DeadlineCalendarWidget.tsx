import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, isBefore } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { t } from '@/i18n';

const DeadlineCalendarWidget: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { page: 0, size: 200 }],
    queryFn: () => tasksApi.getTasks({ page: 0, size: 200 }),
  });

  const now = new Date();
  const weekLater = addDays(now, 7);

  const upcoming = React.useMemo(() => {
    const tasks = data?.content ?? [];
    return tasks
      .filter((t_) => {
        if (!t_.plannedEndDate) return false;
        if (t_.status === 'DONE' || t_.status === 'CANCELLED') return false;
        const due = new Date(t_.plannedEndDate);
        return isBefore(due, weekLater);
      })
      .sort((a, b) => new Date(a.plannedEndDate!).getTime() - new Date(b.plannedEndDate!).getTime())
      .slice(0, 6);
  }, [data, weekLater]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-neutral-400">
        <Calendar size={28} className="mb-2" />
        <p className="text-sm">{t('dashboard.wid.noDeadlines')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map((task) => {
        const isOverdue = isBefore(new Date(task.plannedEndDate!), now);
        return (
          <div
            key={task.id}
            className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate flex-1">
              {task.title}
            </span>
            <span
              className={`text-xs font-medium tabular-nums flex-shrink-0 ${
                isOverdue ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {format(new Date(task.plannedEndDate!), 'd MMM', { locale: ruLocale })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default DeadlineCalendarWidget;
