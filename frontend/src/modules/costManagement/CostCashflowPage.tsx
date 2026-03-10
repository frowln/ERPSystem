import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { costManagementApi } from '@/api/costManagement';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { CashFlowEntry } from './types';

const CostCashflowPage: React.FC = () => {
  const { data: cashFlowData } = useQuery({
    queryKey: ['cash-flow'],
    queryFn: () => costManagementApi.getCashFlow(),
  });

  const cashFlow: CashFlowEntry[] = Array.isArray(cashFlowData)
    ? cashFlowData
    : Array.isArray((cashFlowData as unknown as Record<string, unknown>)?.content)
      ? (cashFlowData as unknown as Record<string, unknown>).content as CashFlowEntry[]
      : [];

  const metrics = useMemo(() => {
    const totalPlanned = cashFlow.reduce((s, e) => s + e.planned, 0);
    const totalActual = cashFlow.filter((e) => e.actual > 0).reduce((s, e) => s + e.actual, 0);
    const totalForecast = cashFlow.reduce((s, e) => s + e.forecast, 0);
    const lastActualMonth = [...cashFlow].reverse().find((e) => e.actual > 0);
    const variance = totalPlanned - totalForecast;
    return { totalPlanned, totalActual, totalForecast, lastActualMonth, variance };
  }, [cashFlow]);

  const maxMonthly = Math.max(...cashFlow.map((e) => Math.max(e.planned, e.actual, e.forecast)));
  const maxCumulative = Math.max(...cashFlow.map((e) => Math.max(e.cumPlanned, e.cumActual || 0, e.cumForecast)));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('costManagement.costCashflow.title')}
        subtitle={t('costManagement.costCashflow.subtitle')}
        breadcrumbs={[
          { label: t('costManagement.costCashflow.breadcrumbHome'), href: '/' },
          { label: t('costManagement.costCashflow.breadcrumbCostManagement') },
          { label: t('costManagement.costCashflow.breadcrumbCashflow') },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<BarChart3 size={18} />}
          label={t('costManagement.costCashflow.plannedExpenses')}
          value={formatMoneyCompact(metrics.totalPlanned)}
        />
        <MetricCard
          icon={<DollarSign size={18} />}
          label={t('costManagement.costCashflow.actualSpent')}
          value={formatMoneyCompact(metrics.totalActual)}
        />
        <MetricCard
          icon={<TrendingUp size={18} />}
          label={t('costManagement.costCashflow.forecastExpenses')}
          value={formatMoneyCompact(metrics.totalForecast)}
        />
        <MetricCard
          label={t('costManagement.costCashflow.planVariance')}
          value={formatMoneyCompact(metrics.variance)}
          trend={{
            direction: metrics.variance >= 0 ? 'up' : 'down',
            value: metrics.variance >= 0 ? t('costManagement.costCashflow.savings') : t('costManagement.costCashflow.overrun'),
          }}
        />
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('costManagement.costCashflow.monthlyExpenses')}</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{t('costManagement.costCashflow.monthlyExpensesSubtitle')}</p>

        <div className="flex items-center gap-6 mb-4">
          <Legend color="bg-primary-300" label={t('costManagement.costCashflow.plan')} />
          <Legend color="bg-success-500" label={t('costManagement.costCashflow.fact')} />
          <Legend color="bg-warning-400" label={t('costManagement.costCashflow.forecastLabel')} />
        </div>

        <div className="flex items-end gap-1 h-48">
          {cashFlow.map((entry, idx) => (
            <div key={idx} className="flex-1 flex items-end gap-px">
              <div
                className="flex-1 bg-primary-200 rounded-t-sm"
                style={{ height: `${(entry.planned / maxMonthly) * 100}%` }}
                title={`${t('costManagement.costCashflow.plan')}: ${formatMoneyCompact(entry.planned)}`}
              />
              {entry.actual > 0 ? (
                <div
                  className="flex-1 bg-success-400 rounded-t-sm"
                  style={{ height: `${(entry.actual / maxMonthly) * 100}%` }}
                  title={`${t('costManagement.costCashflow.fact')}: ${formatMoneyCompact(entry.actual)}`}
                />
              ) : (
                <div
                  className="flex-1 bg-warning-300 rounded-t-sm"
                  style={{ height: `${(entry.forecast / maxMonthly) * 100}%` }}
                  title={`${t('costManagement.costCashflow.forecastLabel')}: ${formatMoneyCompact(entry.forecast)}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {cashFlow.map((entry, idx) => (
            <div key={idx} className="flex-1 text-center">
              <span className="text-[9px] text-neutral-400 leading-none">{entry.month.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cumulative S-curve */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('costManagement.costCashflow.cumulativeCurve')}</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">{t('costManagement.costCashflow.cumulativeSubtitle')}</p>

        <div className="flex items-center gap-6 mb-4">
          <Legend color="bg-primary-400" label={t('costManagement.costCashflow.cumPlan')} />
          <Legend color="bg-success-500" label={t('costManagement.costCashflow.cumFact')} />
          <Legend color="bg-warning-400" label={t('costManagement.costCashflow.cumForecast')} />
        </div>

        <div className="flex items-end gap-1 h-48">
          {cashFlow.map((entry, idx) => (
            <div key={idx} className="flex-1 flex items-end gap-px">
              <div
                className="flex-1 bg-primary-200 rounded-t-sm"
                style={{ height: `${(entry.cumPlanned / maxCumulative) * 100}%` }}
                title={`${t('costManagement.costCashflow.cumPlan')}: ${formatMoneyCompact(entry.cumPlanned)}`}
              />
              {entry.cumActual > 0 ? (
                <div
                  className="flex-1 bg-success-400 rounded-t-sm"
                  style={{ height: `${(entry.cumActual / maxCumulative) * 100}%` }}
                  title={`${t('costManagement.costCashflow.cumFact')}: ${formatMoneyCompact(entry.cumActual)}`}
                />
              ) : (
                <div className="flex-1" />
              )}
              <div
                className="flex-1 bg-warning-300 rounded-t-sm"
                style={{ height: `${(entry.cumForecast / maxCumulative) * 100}%` }}
                title={`${t('costManagement.costCashflow.cumForecast')}: ${formatMoneyCompact(entry.cumForecast)}`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {cashFlow.map((entry, idx) => (
            <div key={idx} className="flex-1 text-center">
              <span className="text-[9px] text-neutral-400 leading-none">{entry.month.slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('costManagement.costCashflow.monthlyDetail')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.costCashflow.columnMonth')}</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.costCashflow.plan')}</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.costCashflow.fact')}</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.costCashflow.forecastLabel')}</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.costCashflow.cumPlan')}</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.costCashflow.cumFactForecast')}</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">{t('costManagement.costCashflow.columnVariance')}</th>
              </tr>
            </thead>
            <tbody>
              {cashFlow.map((entry, idx) => {
                const monthVariance = entry.actual > 0 ? entry.planned - entry.actual : entry.planned - entry.forecast;
                return (
                  <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="px-3 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">{entry.month}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm text-neutral-600">{formatMoneyCompact(entry.planned)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm text-neutral-600">
                      {entry.actual > 0 ? formatMoneyCompact(entry.actual) : <span className="text-neutral-400">---</span>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm text-neutral-600">{formatMoneyCompact(entry.forecast)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm text-neutral-700 dark:text-neutral-300 font-medium">{formatMoneyCompact(entry.cumPlanned)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                      {formatMoneyCompact(entry.cumActual > 0 ? entry.cumActual : entry.cumForecast)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={cn(
                        'tabular-nums text-sm font-medium',
                        monthVariance > 0 ? 'text-success-600' : monthVariance < 0 ? 'text-danger-600' : 'text-neutral-500 dark:text-neutral-400',
                      )}>
                        {monthVariance !== 0 ? formatMoneyCompact(monthVariance) : '---'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-3 h-3 rounded-sm', color)} />
      <span className="text-xs text-neutral-600">{label}</span>
    </div>
  );
}

export default CostCashflowPage;
