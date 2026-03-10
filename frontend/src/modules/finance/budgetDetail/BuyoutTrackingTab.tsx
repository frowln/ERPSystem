import React, { useMemo } from 'react';
import { CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatMoney, formatPercent } from '@/lib/format';
import type { BudgetItem } from '@/types';

interface Props {
  items: BudgetItem[];
}

interface DisciplineGroup {
  mark: string;
  items: BudgetItem[];
  budgeted: number;
  contracted: number;
  variance: number;
  buyoutPct: number;
}

const BuyoutTrackingTab: React.FC<Props> = ({ items }) => {
  const groups = useMemo(() => {
    // Build section name lookup from parent sections
    const sectionMap = new Map<string, string>();
    for (const item of items) {
      if (item.section && item.id) sectionMap.set(item.id, item.name);
    }

    // Filter out section headers
    const lineItems = items.filter(i => !i.section);

    // Group by discipline mark (fallback to parent section name)
    const byMark = new Map<string, BudgetItem[]>();
    for (const item of lineItems) {
      const mark = item.disciplineMark || (item.parentId ? sectionMap.get(item.parentId) : undefined) || t('finance.buyout.noDiscipline');
      const arr = byMark.get(mark) ?? [];
      arr.push(item);
      byMark.set(mark, arr);
    }

    const result: DisciplineGroup[] = [];
    for (const [mark, markItems] of byMark) {
      const budgeted = markItems.reduce((s, i) => {
        const qty = i.quantity ?? 1;
        return s + (i.costPrice ?? 0) * qty;
      }, 0);
      const contracted = markItems.reduce((s, i) => s + (i.contractedAmount ?? 0), 0);
      const variance = budgeted - contracted;
      const buyoutPct = budgeted > 0 ? (contracted / budgeted) * 100 : 0;

      result.push({ mark, items: markItems, budgeted, contracted, variance, buyoutPct });
    }

    return result.sort((a, b) => b.budgeted - a.budgeted);
  }, [items]);

  const totals = useMemo(() => {
    const budgeted = groups.reduce((s, g) => s + g.budgeted, 0);
    const contracted = groups.reduce((s, g) => s + g.contracted, 0);
    const variance = budgeted - contracted;
    const buyoutPct = budgeted > 0 ? (contracted / budgeted) * 100 : 0;
    return { budgeted, contracted, variance, buyoutPct };
  }, [groups]);

  return (
    <div className="p-6 space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('finance.buyout.totalBudgeted')}</span>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 tabular-nums">{formatMoney(totals.budgeted)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('finance.buyout.totalContracted')}</span>
          <p className="text-xl font-bold text-primary-600 mt-1 tabular-nums">{formatMoney(totals.contracted)}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('finance.buyout.variance')}</span>
          <p className={cn('text-xl font-bold mt-1 tabular-nums', totals.variance >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatMoney(totals.variance)}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('finance.buyout.buyoutPercent')}</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatPercent(totals.buyoutPct)}</p>
            <TrendingUp size={16} className={totals.buyoutPct >= 80 ? 'text-green-500' : 'text-amber-500'} />
          </div>
          <div className="mt-2 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', totals.buyoutPct >= 80 ? 'bg-green-500' : totals.buyoutPct >= 50 ? 'bg-blue-500' : 'bg-amber-400')}
              style={{ width: `${Math.min(totals.buyoutPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Discipline groups table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400">{t('finance.buyout.colDiscipline')}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400">{t('finance.buyout.colItems')}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400">{t('finance.buyout.colBudgeted')}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400">{t('finance.buyout.colContracted')}</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400">{t('finance.buyout.colVariance')}</th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400 w-40">{t('finance.buyout.colBuyout')}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group.mark} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {group.buyoutPct >= 100 ? (
                      <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle size={14} className="text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                    )}
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{group.mark}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-400">{group.items.length}</td>
                <td className="px-4 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">{formatMoney(group.budgeted)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-primary-600">{formatMoney(group.contracted)}</td>
                <td className={cn('px-4 py-3 text-right tabular-nums font-medium', group.variance >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatMoney(group.variance)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          group.buyoutPct >= 100 ? 'bg-green-500' : group.buyoutPct >= 50 ? 'bg-blue-500' : 'bg-amber-400',
                        )}
                        style={{ width: `${Math.min(group.buyoutPct, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-neutral-500 tabular-nums w-10 text-right">{formatPercent(group.buyoutPct)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-neutral-50 dark:bg-neutral-800/50 font-semibold">
              <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{t('finance.buyout.total')}</td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-600 dark:text-neutral-400">
                {groups.reduce((s, g) => s + g.items.length, 0)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-900 dark:text-neutral-100">{formatMoney(totals.budgeted)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-primary-600">{formatMoney(totals.contracted)}</td>
              <td className={cn('px-4 py-3 text-right tabular-nums', totals.variance >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatMoney(totals.variance)}
              </td>
              <td className="px-4 py-3">
                <span className="text-sm tabular-nums">{formatPercent(totals.buyoutPct)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BuyoutTrackingTab;
