import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';
import { AlertCircle } from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { t } from '@/i18n';

const OverdueTasksWidget: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { page: 0, size: 200 }],
    queryFn: () => tasksApi.getTasks({ page: 0, size: 200 }),
  });

  const overdue = React.useMemo(() => {
    const tasks = data?.content ?? [];
    const now = new Date();
    return tasks
      .filter((t_) => {
        if (!t_.plannedEndDate) return false;
        if (t_.status === 'DONE' || t_.status === 'CANCELLED') return false;
        return new Date(t_.plannedEndDate) < now;
      })
      .sort((a, b) => new Date(a.plannedEndDate!).getTime() - new Date(b.plannedEndDate!).getTime())
      .slice(0, 5);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (overdue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-success-500">
        <AlertCircle size={28} className="mb-2" />
        <p className="text-sm">{t('dashboard.wid.noOverdue')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {overdue.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-danger-50 dark:bg-danger-950/30 hover:bg-danger-100 dark:hover:bg-danger-950/50 cursor-pointer transition-colors"
          onClick={() => navigate(`/tasks`)}
        >
          <span className="text-sm text-danger-700 dark:text-danger-400 truncate flex-1">{task.title}</span>
          <span className="text-xs font-medium text-danger-500 tabular-nums flex-shrink-0">
            {task.plannedEndDate ? format(new Date(task.plannedEndDate), 'd MMM', { locale: ruLocale }) : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export default OverdueTasksWidget;
