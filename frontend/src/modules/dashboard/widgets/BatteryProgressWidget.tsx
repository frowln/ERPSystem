import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { BatteryWidget } from '@/design-system/components/BatteryWidget';
import { t } from '@/i18n';

const BatteryProgressWidget: React.FC = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  if (isLoading) {
    return <div className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />;
  }

  const projects = dashboard?.recentProjects ?? [];
  const total = projects.length;
  const completed = projects.filter((p) => p.status === 'COMPLETED').length;
  const inProgress = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const other = total - completed - inProgress;
  const avgProgress = total > 0
    ? Math.round(projects.reduce((s, p) => s + (p.progress ?? 0), 0) / total)
    : 0;

  return (
    <div>
      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{avgProgress}%</div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t('dashboard.wid.batteryAvgProgress')}</p>
      </div>

      <BatteryWidget
        total={total || 1}
        segments={[
          { value: completed, color: 'bg-success-500', label: t('dashboard.wid.batteryDone') },
          { value: inProgress, color: 'bg-primary-500', label: t('dashboard.wid.batteryActive') },
          { value: other, color: 'bg-neutral-300', label: t('dashboard.wid.batteryOther') },
        ]}
        height={28}
      />
    </div>
  );
};

export default BatteryProgressWidget;
