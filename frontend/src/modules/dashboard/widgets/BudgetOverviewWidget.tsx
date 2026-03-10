import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { formatMoneyCompact } from '@/lib/format';
import { t } from '@/i18n';

const BudgetOverviewWidget: React.FC = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.getDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
      </div>
    );
  }

  const totalBudget = dashboard?.computedTotalPlannedBudget ?? dashboard?.totalBudget ?? 0;
  const actualCost = dashboard?.computedTotalActualCost ?? 0;
  const pct = totalBudget > 0 ? Math.round((actualCost / totalBudget) * 100) : 0;

  return (
    <div>
      <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 tabular-nums">
        {formatMoneyCompact(totalBudget)}
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{t('dashboard.allProjectsScope')}</p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-neutral-500 dark:text-neutral-400">{t('dashboard.actualCosts')}</span>
          <span className="font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{pct}%</span>
        </div>
        <div className="w-full h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct > 100 ? 'bg-danger-500' : pct > 85 ? 'bg-warning-500' : 'bg-primary-500'
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-500 dark:text-neutral-400">{t('dashboard.actualLabel')}</span>
        <span className="font-medium text-neutral-900 dark:text-neutral-100 tabular-nums">
          {formatMoneyCompact(actualCost)}
        </span>
      </div>
    </div>
  );
};

export default BudgetOverviewWidget;
