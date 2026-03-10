import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { t } from '@/i18n';

const TASK_STATUS_COLORS: Record<string, string> = {
  BACKLOG: '#94a3b8',
  TODO: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  IN_REVIEW: '#a855f7',
  DONE: '#22c55e',
  CANCELLED: '#ef4444',
};

const getTaskStatusLabels = (): Record<string, string> => ({
  BACKLOG: t('dashboard.taskStatusBacklog'),
  TODO: t('dashboard.taskStatusTodo'),
  IN_PROGRESS: t('dashboard.taskStatusInProgress'),
  IN_REVIEW: t('dashboard.taskStatusInReview'),
  DONE: t('dashboard.taskStatusDone'),
  CANCELLED: t('dashboard.taskStatusCancelled'),
});

interface TaskStatusChartProps {
  data: Record<string, number>;
}

const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ data }) => {
  const statusLabels = getTaskStatusLabels();
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: statusLabels[status] ?? status,
    value: count,
    color: TASK_STATUS_COLORS[status] ?? '#94a3b8',
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        {t('dashboard.tasksByStatus')}
      </h3>
      <div className="h-[280px]">
        {total === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-neutral-400">
            {t('dashboard.noData')}
          </div>
        ) : (
          <div className="flex items-center h-full">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#f8fafc',
                      padding: '8px 12px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} ${t('dashboard.tasksWord')}`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2 pl-2">
              {chartData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums ml-2">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskStatusChart;
