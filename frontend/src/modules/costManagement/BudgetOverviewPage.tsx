import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Target, AlertTriangle, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { costManagementApi } from '@/api/costManagement';
import { formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { CostDashboard } from './types';

const BudgetOverviewPage: React.FC = () => {
  const { data: dashboard } = useQuery<CostDashboard>({
    queryKey: ['cost-dashboard'],
    queryFn: () => costManagementApi.getCostDashboard(),
  });

  if (!dashboard) return null;

  const budget = dashboard.budgetSummary;
  const codes = dashboard.costCodes;
  const totalBudget = budget.revisedBudget;
  const commitPercent = totalBudget > 0 ? (budget.committed / totalBudget) * 100 : 0;
  const actualPercent = totalBudget > 0 ? (budget.actualCost / totalBudget) * 100 : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('costManagement.budgetOverview.title')}
        subtitle={t('costManagement.budgetOverview.subtitle')}
        breadcrumbs={[
          { label: t('costManagement.budgetOverview.breadcrumbHome'), href: '/' },
          { label: t('costManagement.budgetOverview.breadcrumbCostManagement') },
          { label: t('costManagement.budgetOverview.title') },
        ]}
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Target size={18} />}
          label={t('costManagement.budgetOverview.revisedBudget')}
          value={formatMoneyCompact(budget.revisedBudget)}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('costManagement.budgetOverview.committed')}
          value={formatMoneyCompact(budget.committed)}
          subtitle={formatPercent(commitPercent)}
        />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label={t('costManagement.budgetOverview.actualCosts')}
          value={formatMoneyCompact(budget.actualCost)}
          subtitle={formatPercent(actualPercent)}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('costManagement.budgetOverview.forecastAtCompletion')}
          value={formatMoneyCompact(budget.forecastAtCompletion)}
          trend={{
            direction: budget.varianceAtCompletion >= 0 ? 'up' : 'down',
            value: formatMoneyCompact(budget.varianceAtCompletion),
          }}
        />
      </div>

      {/* Budget breakdown cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Budget summary card */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('costManagement.budgetOverview.budgetStructure')}</h3>
          <div className="space-y-4">
            <BudgetRow label={t('costManagement.budgetOverview.originalBudget')} value={budget.originalBudget} />
            <BudgetRow
              label={t('costManagement.budgetOverview.approvedChanges')}
              value={budget.approvedChanges}
              isChange
            />
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
              <BudgetRow
                label={t('costManagement.budgetOverview.revisedBudget')}
                value={budget.revisedBudget}
                isBold
              />
            </div>
            <BudgetRow label={t('costManagement.budgetOverview.committed')} value={budget.committed} />
            <BudgetRow label={t('costManagement.budgetOverview.actualCosts')} value={budget.actualCost} />
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
              <BudgetRow
                label={t('costManagement.budgetOverview.forecastEAC')}
                value={budget.forecastAtCompletion}
                isBold
              />
            </div>
            <BudgetRow
              label={t('costManagement.budgetOverview.varianceVAC')}
              value={budget.varianceAtCompletion}
              isVariance
            />
          </div>
        </div>

        {/* Budget bars by cost code */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('costManagement.budgetOverview.budgetByCostCodes')}</h3>
          <div className="space-y-3">
            {codes.map((code) => {
              const budgetPct = totalBudget > 0 ? (code.budgetAmount / totalBudget) * 100 : 0;
              const actualPct = code.budgetAmount > 0 ? (code.actualAmount / code.budgetAmount) * 100 : 0;
              const isOverBudget = code.varianceAmount < 0;
              return (
                <div key={code.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{code.code}</span>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{code.name}</span>
                      {isOverBudget && <AlertTriangle size={12} className="text-danger-500" />}
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">{formatPercent(budgetPct)}</span>
                  </div>
                  <div className="relative h-5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary-100 rounded-full"
                      style={{ width: `${Math.min(budgetPct * 3, 100)}%` }}
                    />
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded-full',
                        isOverBudget ? 'bg-danger-400' : 'bg-primary-500',
                      )}
                      style={{ width: `${Math.min(actualPct * budgetPct * 3 / 100, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[10px] font-medium text-white drop-shadow-sm">
                        {formatMoneyCompact(code.actualAmount)} / {formatMoneyCompact(code.budgetAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance indicators */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('costManagement.budgetOverview.performanceIndicators')}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <IndicatorCard
            label={t('costManagement.budgetOverview.cpiLabel')}
            value={dashboard.cpi}
            threshold={1.0}
          />
          <IndicatorCard
            label={t('costManagement.budgetOverview.spiLabel')}
            value={dashboard.spi}
            threshold={1.0}
          />
          <IndicatorCard
            label={t('costManagement.budgetOverview.budgetUtilization')}
            value={actualPercent / 100}
            threshold={0.5}
            formatFn={(v) => formatPercent(v * 100)}
          />
          <IndicatorCard
            label={t('costManagement.budgetOverview.contracting')}
            value={commitPercent / 100}
            threshold={0.7}
            formatFn={(v) => formatPercent(v * 100)}
          />
        </div>
      </div>
    </div>
  );
};

function BudgetRow({ label, value, isBold, isChange, isVariance }: {
  label: string;
  value: number;
  isBold?: boolean;
  isChange?: boolean;
  isVariance?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-sm', isBold ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-600')}>
        {label}
      </span>
      <span className={cn(
        'text-sm tabular-nums',
        isBold && 'font-bold text-neutral-900 dark:text-neutral-100',
        isChange && (value >= 0 ? 'text-warning-600' : 'text-success-600'),
        isVariance && (value >= 0 ? 'text-success-600 font-medium' : 'text-danger-600 font-medium'),
        !isBold && !isChange && !isVariance && 'text-neutral-700 dark:text-neutral-300',
      )}>
        {isChange && value > 0 ? '+' : ''}{formatMoney(value)}
      </span>
    </div>
  );
}

function IndicatorCard({ label, value, threshold, formatFn }: {
  label: string;
  value: number;
  threshold: number;
  formatFn?: (v: number) => string;
}) {
  const isGood = value >= threshold;
  const displayValue = formatFn ? formatFn(value) : value.toFixed(3);

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      isGood ? 'bg-success-50 border-success-100' : 'bg-danger-50 border-danger-100',
    )}>
      <div className="flex items-center gap-2 mb-2">
        {isGood ? (
          <TrendingUp size={14} className="text-success-500" />
        ) : (
          <TrendingDown size={14} className="text-danger-500" />
        )}
        <p className="text-xs font-medium text-neutral-600">{label}</p>
      </div>
      <p className={cn(
        'text-xl font-bold tabular-nums',
        isGood ? 'text-success-700' : 'text-danger-700',
      )}>
        {displayValue}
      </p>
    </div>
  );
}

export default BudgetOverviewPage;
