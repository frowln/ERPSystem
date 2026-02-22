import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { StatusBadge, budgetStatusColorMap, budgetStatusLabels } from '@/design-system/components/StatusBadge';
import { financeApi } from '@/api/finance';
import { formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Project } from '@/types';

interface Props {
  project: Project | undefined;
}

export const ProjectBudgetTab: React.FC<Props> = ({ project }) => {
  const navigate = useNavigate();

  const { data: budgetsPage, isLoading } = useQuery({
    queryKey: ['project-budgets', project?.id],
    queryFn: () => financeApi.getBudgets({ projectId: project?.id, size: 50 }),
    enabled: !!project?.id,
  });

  const budgets = budgetsPage?.content ?? [];

  const calcVariancePct = (planned: number | undefined, actual: number | undefined): number | null => {
    if (!planned || planned === 0) return null;
    const p = planned ?? 0;
    const a = actual ?? 0;
    return ((a - p) / Math.abs(p)) * 100;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 text-center py-16">
        <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <Wallet size={28} className="text-neutral-400" />
        </div>
        <div>
          <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">{t('projects.budget.noBudgets')}</p>
          <p className="text-sm text-neutral-400 mt-1">{t('projects.budget.createFirstHint')}</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          iconLeft={<Plus size={14} />}
          onClick={() => navigate(`/budgets/new?projectId=${project?.id}`)}
        >
          {t('projects.budget.createBudget')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('projects.budget.totalBudgets')}: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{budgets.length}</span>
        </p>
        <Button
          variant="primary"
          size="sm"
          iconLeft={<Plus size={14} />}
          onClick={() => navigate(`/budgets/new?projectId=${project?.id}`)}
        >
          {t('projects.budget.createBudget')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((budget) => {
          const revVariance = calcVariancePct(budget.plannedRevenue, budget.actualRevenue);
          const costVariance = calcVariancePct(budget.plannedCost, budget.actualCost);
          const marginVariance = calcVariancePct(budget.plannedMargin, budget.actualMargin);

          return (
            <div
              key={budget.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">{budget.name}</p>
                  {budget.period && (
                    <p className="text-xs text-neutral-400 mt-0.5">{budget.period}</p>
                  )}
                </div>
                <StatusBadge status={budget.status ?? ''} size="sm" />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Revenue */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <TrendingUp size={12} className="text-green-500" />
                    <span>{t('projects.budget.revenue')}</span>
                  </div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatMoneyCompact(budget.actualRevenue ?? budget.plannedRevenue)}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {t('projects.budget.plan')}: {formatMoneyCompact(budget.plannedRevenue)}
                  </p>
                  {revVariance !== null && (
                    <p
                      className={cn(
                        'text-xs font-medium',
                        revVariance >= 0 ? 'text-green-500' : 'text-red-500',
                      )}
                    >
                      {revVariance >= 0 ? '+' : ''}{formatPercent(revVariance)}
                    </p>
                  )}
                </div>

                {/* Cost */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <TrendingDown size={12} className="text-red-500" />
                    <span>{t('projects.budget.costs')}</span>
                  </div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {formatMoneyCompact(budget.actualCost ?? budget.plannedCost)}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {t('projects.budget.plan')}: {formatMoneyCompact(budget.plannedCost)}
                  </p>
                  {costVariance !== null && (
                    <p
                      className={cn(
                        'text-xs font-medium',
                        costVariance <= 0 ? 'text-green-500' : 'text-red-500',
                      )}
                    >
                      {costVariance >= 0 ? '+' : ''}{formatPercent(costVariance)}
                    </p>
                  )}
                </div>

                {/* Margin */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <Wallet size={12} className="text-blue-500" />
                    <span>{t('projects.budget.margin')}</span>
                  </div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {formatMoneyCompact(budget.actualMargin ?? budget.plannedMargin)}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {t('projects.budget.plan')}: {formatMoneyCompact(budget.plannedMargin)}
                  </p>
                  {marginVariance !== null && (
                    <p
                      className={cn(
                        'text-xs font-medium',
                        marginVariance >= 0 ? 'text-green-500' : 'text-red-500',
                      )}
                    >
                      {marginVariance >= 0 ? '+' : ''}{formatPercent(marginVariance)}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-end pt-1 border-t border-neutral-100 dark:border-neutral-700">
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight={<ArrowRight size={14} />}
                  onClick={() => navigate(`/budgets/${budget.id}`)}
                >
                  {t('projects.budget.open')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
