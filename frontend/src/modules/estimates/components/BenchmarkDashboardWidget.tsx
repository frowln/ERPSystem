import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney, formatPercent } from '@/lib/format';
import { t } from '@/i18n';
import { financeApi } from '@/api/finance';
import type { BudgetItem, BudgetCategory } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DeviationLevel = 'green' | 'amber' | 'red';

interface CategoryBenchmark {
  key: string;
  label: string;
  currentCost: number;
  historicalAvg: number;
  deviationPercent: number;
  level: DeviationLevel;
}

interface BenchmarkDashboardWidgetProps {
  projectId?: string;
  budgetId?: string;
  compact?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Category i18n mapping
// ---------------------------------------------------------------------------
const CATEGORY_I18N: Record<BudgetCategory, string> = {
  MATERIALS: 'categoryMaterials',
  LABOR: 'categorySmr',
  EQUIPMENT: 'categoryEquipment',
  SUBCONTRACT: 'categoryMontazh',
  OVERHEAD: 'categoryDesign',
  OTHER: 'categoryOther',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDeviationLevel(deviationPercent: number): DeviationLevel {
  const abs = Math.abs(deviationPercent);
  if (abs <= 5) return 'green';
  if (abs <= 15) return 'amber';
  return 'red';
}

const LEVEL_STYLES: Record<DeviationLevel, { dot: string; bar: string; text: string; bg: string }> = {
  green: {
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500/70',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  amber: {
    dot: 'bg-amber-500',
    bar: 'bg-amber-500/70',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  red: {
    dot: 'bg-red-500',
    bar: 'bg-red-500/70',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const BenchmarkDashboardWidget: React.FC<BenchmarkDashboardWidgetProps> = ({
  projectId,
  budgetId: budgetIdProp,
  compact = false,
  className,
}) => {
  // Resolve budgetId: use prop directly, or look up budgets for the project
  const { data: budgetsData } = useQuery({
    queryKey: ['budgets', projectId],
    queryFn: () => financeApi.getBudgets({ projectId, size: 1 }),
    enabled: !budgetIdProp && !!projectId,
    staleTime: 120_000,
  });

  const resolvedBudgetId = budgetIdProp ?? budgetsData?.content?.[0]?.id;

  const { data: budgetItems, isLoading } = useQuery({
    queryKey: ['budget-items', resolvedBudgetId],
    queryFn: () => financeApi.getBudgetItems(resolvedBudgetId!),
    enabled: !!resolvedBudgetId,
    staleTime: 60_000,
  });

  // Group items by category: currentCost = actualAmount, historicalAvg = plannedAmount
  const categories = useMemo<CategoryBenchmark[]>(() => {
    if (!budgetItems || budgetItems.length === 0) return [];

    const grouped: Record<string, { currentCost: number; historicalAvg: number }> = {};
    for (const item of budgetItems) {
      if (item.section) continue; // skip section headers
      const cat = item.category ?? 'OTHER';
      if (!grouped[cat]) grouped[cat] = { currentCost: 0, historicalAvg: 0 };
      grouped[cat].currentCost += item.actualAmount ?? 0;
      grouped[cat].historicalAvg += item.plannedAmount ?? 0;
    }

    return Object.entries(grouped)
      .filter(([, v]) => v.currentCost > 0 || v.historicalAvg > 0)
      .map(([key, v]) => {
        const i18nKey = CATEGORY_I18N[key as BudgetCategory] ?? 'categoryOther';
        const deviation =
          v.historicalAvg === 0
            ? 0
            : ((v.currentCost - v.historicalAvg) / v.historicalAvg) * 100;
        return {
          key,
          label: t(`estimates.benchmark.${i18nKey}`),
          currentCost: v.currentCost,
          historicalAvg: v.historicalAvg,
          deviationPercent: deviation,
          level: getDeviationLevel(deviation),
        };
      });
  }, [budgetItems]);

  // Summary stats
  const totalCurrent = categories.reduce((s, c) => s + c.currentCost, 0);
  const totalHistorical = categories.reduce((s, c) => s + c.historicalAvg, 0);
  const overallDeviation =
    totalHistorical === 0
      ? 0
      : ((totalCurrent - totalHistorical) / totalHistorical) * 100;
  const withinCount = categories.filter((c) => c.level === 'green').length;
  const overCount = categories.filter((c) => c.level !== 'green').length;

  // Scale bars: find max value to normalize widths
  const maxValue = Math.max(
    ...categories.flatMap((c) => [c.currentCost, c.historicalAvg]),
    1,
  );

  const itemCount = budgetItems?.filter((i) => !i.section).length ?? 0;

  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 flex items-center justify-center gap-2',
          className,
        )}
      >
        <Loader2 size={16} className="animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 text-center',
          className,
        )}
      >
        <BarChart3 size={24} className="mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          {t('estimates.benchmark.noData')}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <BarChart3 size={16} className="text-blue-500" />
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('estimates.benchmark.title')}
          </h3>
          {!compact && (
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {t('estimates.benchmark.subtitle')}
            </p>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div
        className={cn(
          'grid gap-3 px-5 py-3 border-b border-neutral-100 dark:border-neutral-800',
          compact ? 'grid-cols-2' : 'grid-cols-3',
        )}
      >
        {/* Overall deviation */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              LEVEL_STYLES[getDeviationLevel(overallDeviation)].dot,
            )}
          />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t('estimates.benchmark.overallDeviation')}
            </p>
            <p
              className={cn(
                'text-sm font-bold tabular-nums',
                LEVEL_STYLES[getDeviationLevel(overallDeviation)].text,
              )}
            >
              {overallDeviation >= 0 ? '+' : ''}
              {formatPercent(overallDeviation)}
            </p>
          </div>
        </div>

        {/* Within budget */}
        <div className="flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t('estimates.benchmark.withinBudget')}
            </p>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {withinCount} / {categories.length}
            </p>
          </div>
        </div>

        {/* Over budget */}
        {!compact && (
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {t('estimates.benchmark.overBudget')}
              </p>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {overCount} / {categories.length}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Category rows with CSS bars */}
      <div className={cn('divide-y divide-neutral-100 dark:divide-neutral-800', compact ? 'px-4' : 'px-5')}>
        {categories.map((cat) => {
          const styles = LEVEL_STYLES[cat.level];
          const currentBarWidth = (cat.currentCost / maxValue) * 100;
          const historicalBarWidth = (cat.historicalAvg / maxValue) * 100;

          return (
            <div key={cat.key} className={cn('py-3', compact && 'py-2')}>
              {/* Row header: category name + deviation */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {cat.label}
                </span>
                <span className={cn('text-xs font-semibold tabular-nums', styles.text)}>
                  {cat.deviationPercent >= 0 ? '+' : ''}
                  {formatPercent(cat.deviationPercent)}
                </span>
              </div>

              {/* Bar comparison */}
              <div className="space-y-1">
                {/* Current cost bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] w-14 text-right text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                    {t('estimates.benchmark.current')}
                  </span>
                  <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                    <div
                      className={cn('h-full rounded transition-all', styles.bar)}
                      style={{ width: `${currentBarWidth}%` }}
                    />
                  </div>
                  {!compact && (
                    <span className="text-[10px] tabular-nums text-neutral-600 dark:text-neutral-400 w-24 text-right flex-shrink-0">
                      {formatMoney(cat.currentCost)}
                    </span>
                  )}
                </div>
                {/* Historical avg bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] w-14 text-right text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                    {t('estimates.benchmark.avgLabel')}
                  </span>
                  <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-800 rounded overflow-hidden">
                    <div
                      className="h-full rounded bg-neutral-300 dark:bg-neutral-600 transition-all"
                      style={{ width: `${historicalBarWidth}%` }}
                    />
                  </div>
                  {!compact && (
                    <span className="text-[10px] tabular-nums text-neutral-400 dark:text-neutral-500 w-24 text-right flex-shrink-0">
                      {formatMoney(cat.historicalAvg)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: totals */}
      <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500 dark:text-neutral-400">
            {t('estimates.benchmark.basedOn', { count: String(itemCount) })}
          </span>
          <div className="flex items-center gap-3 tabular-nums">
            <span className="text-neutral-700 dark:text-neutral-300">
              {t('estimates.benchmark.colCurrent')}: {formatMoney(totalCurrent)}
            </span>
            <span className="text-neutral-400 dark:text-neutral-500">
              {t('estimates.benchmark.colHistorical')}: {formatMoney(totalHistorical)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkDashboardWidget;
