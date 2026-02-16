import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Target, DollarSign, AlertTriangle, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { costManagementApi } from '@/api/costManagement';
import { formatMoney, formatMoneyCompact, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { CostCode, BudgetSummary } from './types';

const ForecastPage: React.FC = () => {
  const { data: dashboard } = useQuery({
    queryKey: ['cost-dashboard-forecast'],
    queryFn: () => costManagementApi.getCostDashboard(),
  });

  const budget = dashboard?.budgetSummary ?? [];
  const codes = dashboard?.costCodes ?? [];

  const forecastMetrics = useMemo(() => {
    const totalForecast = codes.reduce((s, c) => s + c.forecastAmount, 0);
    const totalBudget = codes.reduce((s, c) => s + c.budgetAmount, 0);
    const totalVariance = codes.reduce((s, c) => s + c.varianceAmount, 0);
    const overBudgetItems = codes.filter((c) => c.varianceAmount < 0);
    const underBudgetItems = codes.filter((c) => c.varianceAmount > 0);
    return { totalForecast, totalBudget, totalVariance, overBudgetItems, underBudgetItems };
  }, [codes]);

  const sortedByVariance = useMemo(
    () => [...codes].sort((a, b) => a.varianceAmount - b.varianceAmount),
    [codes],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('costManagement.forecast.title')}
        subtitle={t('costManagement.forecast.subtitle')}
        breadcrumbs={[
          { label: t('costManagement.forecast.breadcrumbHome'), href: '/' },
          { label: t('costManagement.forecast.breadcrumbCostManagement') },
          { label: t('costManagement.forecast.breadcrumbForecast') },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Target size={18} />}
          label={t('costManagement.forecast.budget')}
          value={formatMoneyCompact(forecastMetrics.totalBudget)}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('costManagement.forecast.forecastEAC')}
          value={formatMoneyCompact(forecastMetrics.totalForecast)}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('costManagement.forecast.varianceVAC')}
          value={formatMoneyCompact(forecastMetrics.totalVariance)}
          trend={{
            direction: forecastMetrics.totalVariance >= 0 ? 'up' : 'down',
            value: forecastMetrics.totalVariance >= 0 ? t('costManagement.forecast.withinBudget') : t('costManagement.forecast.overBudget'),
          }}
        />
        <MetricCard
          icon={<AlertTriangle size={18} />}
          label={t('costManagement.forecast.problematicItems')}
          value={forecastMetrics.overBudgetItems.length}
          subtitle={t('costManagement.forecast.outOf', { count: String(codes.length) })}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Forecast table */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('costManagement.forecast.forecastByCostCodes')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.forecast.columnCostCode')}</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.forecast.columnBudget')}</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.forecast.columnForecast')}</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.forecast.columnVariance')}</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{code.code}</span>
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">{code.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-sm text-neutral-600">
                      {formatMoneyCompact(code.budgetAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {formatMoneyCompact(code.forecastAmount)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={cn(
                        'tabular-nums text-sm font-medium',
                        code.varianceAmount > 0 ? 'text-success-600' : code.varianceAmount < 0 ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400',
                      )}>
                        {code.varianceAmount !== 0 ? formatMoneyCompact(code.varianceAmount) : '---'}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-neutral-50 dark:bg-neutral-800 font-semibold">
                  <td className="px-3 py-2.5 text-sm">{t('costManagement.forecast.total')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-sm">{formatMoneyCompact(forecastMetrics.totalBudget)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-sm">{formatMoneyCompact(forecastMetrics.totalForecast)}</td>
                  <td className={cn(
                    'px-3 py-2.5 text-right tabular-nums text-sm',
                    forecastMetrics.totalVariance >= 0 ? 'text-success-600' : 'text-danger-600',
                  )}>
                    {formatMoneyCompact(forecastMetrics.totalVariance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Variance analysis */}
        <div className="space-y-6">
          {/* Horizontal variance chart */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('costManagement.forecast.varianceByItems')}</h3>
            <div className="space-y-3">
              {sortedByVariance.map((code) => {
                const maxAbsVariance = Math.max(...codes.map((c) => Math.abs(c.varianceAmount)));
                const barWidth = maxAbsVariance > 0 ? (Math.abs(code.varianceAmount) / maxAbsVariance) * 100 : 0;
                const isNegative = code.varianceAmount < 0;

                return (
                  <div key={code.id} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-600 w-28 truncate">{code.name}</span>
                    <div className="flex-1 flex items-center">
                      <div className="w-1/2 flex justify-end">
                        {isNegative && (
                          <div
                            className="h-4 bg-danger-400 rounded-l"
                            style={{ width: `${barWidth}%` }}
                          />
                        )}
                      </div>
                      <div className="w-px h-6 bg-neutral-300 flex-shrink-0" />
                      <div className="w-1/2">
                        {!isNegative && code.varianceAmount > 0 && (
                          <div
                            className="h-4 bg-success-400 rounded-r"
                            style={{ width: `${barWidth}%` }}
                          />
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs font-medium tabular-nums w-20 text-right',
                      isNegative ? 'text-danger-600' : code.varianceAmount > 0 ? 'text-success-600' : 'text-neutral-500 dark:text-neutral-400',
                    )}>
                      {code.varianceAmount !== 0 ? formatMoneyCompact(code.varianceAmount) : '---'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning-500" />
              {t('costManagement.forecast.overBudgetItems')}
            </h3>
            {forecastMetrics.overBudgetItems.length > 0 ? (
              <div className="space-y-3">
                {forecastMetrics.overBudgetItems.map((code) => (
                  <div key={code.id} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg border border-danger-100">
                    <div>
                      <p className="text-sm font-medium text-danger-800">{code.name}</p>
                      <p className="text-xs text-danger-600 mt-0.5">
                        {t('costManagement.forecast.excess')}: {formatPercent(Math.abs(code.variancePercent))}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown size={14} className="text-danger-500" />
                      <span className="text-sm font-bold text-danger-700 tabular-nums">
                        {formatMoneyCompact(code.varianceAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('costManagement.forecast.allWithinBudget')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
