import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Clock } from 'lucide-react';
import { t } from '@/i18n';
import { tasksApi, type TaskActivity } from '@/api/tasks';

interface Props {
  taskId: string;
}

export const TaskActivityFeed: React.FC<Props> = ({ taskId }) => {
  const { data: activities = [], isLoading } = useQuery<TaskActivity[]>({
    queryKey: ['task-activity', taskId],
    queryFn: () => tasksApi.getActivityFeed(taskId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-neutral-400 dark:text-neutral-500">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">{t('taskActivity.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((activity, idx) => (
        <div key={activity.id} className="flex gap-3 py-2">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
            {idx < activities.length - 1 && (
              <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
            )}
          </div>
          <div className="flex-1 min-w-0 pb-3">
            <p className="text-sm text-neutral-900 dark:text-neutral-100">
              <span className="font-medium">{activity.userName}</span>{' '}
              <span className="text-neutral-500 dark:text-neutral-400">{activity.action}</span>
            </p>
            {activity.detail && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{activity.detail}</p>
            )}
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(activity.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
