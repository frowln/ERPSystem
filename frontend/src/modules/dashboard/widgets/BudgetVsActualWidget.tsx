import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';

const BudgetVsActualWidget: React.FC = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const budgetData = dashboard?.budgetVsActual ?? [];
  const maxVal = Math.max(...budgetData.map((d) => Math.max(d.budget, d.actual)), 1);

  return (
    <div className="space-y-2">
      {budgetData.slice(0, 6).map((item) => (
        <div key={item.month}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-neutral-500 dark:text-neutral-400">{item.month}</span>
            <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">
              {formatMoneyCompact(item.budget)} / {formatMoneyCompact(item.actual)}
            </span>
          </div>
          <div className="flex gap-0.5">
            <div className="h-2 bg-primary-200 dark:bg-primary-900 rounded-l-full" style={{ width: `${(item.budget / maxVal) * 100}%` }} />
            <div className="h-2 bg-primary-500 rounded-r-full" style={{ width: `${(item.actual / maxVal) * 100}%` }} />
          </div>
        </div>
      ))}
      {budgetData.length === 0 && (
        <p className="text-sm text-neutral-400 text-center py-4">{t('dashboard.noRecentActivity')}</p>
      )}
    </div>
  );
};

export default BudgetVsActualWidget;
