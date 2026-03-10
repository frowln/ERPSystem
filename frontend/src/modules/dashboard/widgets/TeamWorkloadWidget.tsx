import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks';
import { t } from '@/i18n';

const MAX_TASKS = 15;

const TeamWorkloadWidget: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['tasks', 'workload'],
    queryFn: () => tasksApi.getTasks({ page: 0, size: 10000 }),
    staleTime: 60_000,
  });

  const team = useMemo(() => {
    const tasks = data?.content ?? [];
    const byAssignee = new Map<string, number>();

    for (const task of tasks) {
      if (task.status === 'DONE' || task.status === 'CANCELLED') continue;
      const name = task.assigneeName ?? '';
      if (!name) continue;
      byAssignee.set(name, (byAssignee.get(name) ?? 0) + 1);
    }

    return Array.from(byAssignee.entries())
      .map(([name, count]) => ({ name, tasks: count, maxTasks: MAX_TASKS }))
      .sort((a, b) => b.tasks - a.tasks)
      .slice(0, 7);
  }, [data]);

  if (team.length === 0) {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-400 py-4">
        {t('common.noData')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {team.map((member) => {
        const pct = Math.round((member.tasks / member.maxTasks) * 100);
        return (
          <div key={member.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{member.name}</span>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 tabular-nums flex-shrink-0 ml-2">
                {member.tasks} {t('dashboard.wid.workloadTasks')}
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  pct > 90 ? 'bg-danger-500' : pct > 70 ? 'bg-warning-500' : 'bg-primary-500'
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamWorkloadWidget;
