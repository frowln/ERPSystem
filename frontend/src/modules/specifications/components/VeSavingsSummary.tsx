import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, CheckCircle, Clock, XCircle, PieChart } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import { materialAnalogsApi } from '@/api/materialAnalogs';

interface CategorySavings {
  label: string;
  savings: number;
  count: number;
  color: string;
}

export const VeSavingsSummary: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['analog-requests'],
    queryFn: () => materialAnalogsApi.getRequests(),
  });

  const requests = data?.content ?? [];

  const stats = useMemo(() => {
    const approved = requests.filter((r) => r.status === 'APPROVED');
    const pending = requests.filter((r) => r.status === 'PENDING');
    const rejected = requests.filter((r) => r.status === 'REJECTED');

    const totalSavings = approved.reduce((sum, r) => sum + (r.totalImpact ?? 0), 0);

    // Break down by qualityImpact (real backend enum, not arbitrary category mapping)
    const categories: CategorySavings[] = [
      {
        label: t('specifications.ve.noImpact'),
        savings: approved.filter((r) => r.qualityImpact === 'NO_IMPACT').reduce((s, r) => s + (r.totalImpact ?? 0), 0),
        count: approved.filter((r) => r.qualityImpact === 'NO_IMPACT').length,
        color: 'bg-emerald-500',
      },
      {
        label: t('specifications.ve.improvement'),
        savings: approved.filter((r) => r.qualityImpact === 'IMPROVEMENT').reduce((s, r) => s + (r.totalImpact ?? 0), 0),
        count: approved.filter((r) => r.qualityImpact === 'IMPROVEMENT').length,
        color: 'bg-blue-500',
      },
      {
        label: t('specifications.ve.acceptableReduction'),
        savings: approved.filter((r) => r.qualityImpact === 'ACCEPTABLE_REDUCTION').reduce((s, r) => s + (r.totalImpact ?? 0), 0),
        count: approved.filter((r) => r.qualityImpact === 'ACCEPTABLE_REDUCTION').length,
        color: 'bg-amber-500',
      },
    ].filter((c) => c.count > 0);

    const maxCategorySavings = Math.max(...categories.map((c) => Math.abs(c.savings)), 1);

    return {
      totalSavings,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      categories,
      maxCategorySavings,
    };
  }, [requests]);

  if (requests.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Main savings banner */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-0">
        {/* Left: Savings highlight card */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('specifications.ve.savingsTitle')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total savings card with green highlight */}
            <div
              className={cn(
                'rounded-xl px-4 py-3 border',
                stats.totalSavings >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
              )}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">
                {t('specifications.ve.projectSavings')}
              </p>
              <p
                className={cn(
                  'text-xl font-bold tabular-nums',
                  stats.totalSavings >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-700 dark:text-red-400',
                )}
              >
                {stats.totalSavings >= 0 ? '+' : ''}{formatMoney(stats.totalSavings)}
              </p>
            </div>

            {/* Status counters */}
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50">
              <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t('specifications.ve.approved')}
                </p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {stats.approvedCount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50">
              <Clock size={16} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t('specifications.ve.pending')}
                </p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {stats.pendingCount}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50">
              <XCircle size={16} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {t('specifications.ve.rejected')}
                </p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {stats.rejectedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Category breakdown chart */}
        {stats.categories.length > 0 && (
          <div className="border-l border-neutral-200 dark:border-neutral-700 p-5 min-w-[260px]">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={14} className="text-neutral-400" />
              <h4 className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                {t('specifications.ve.breakdownByCategory')}
              </h4>
            </div>
            <div className="space-y-2.5">
              {stats.categories.map((cat) => {
                const barWidth = Math.max((Math.abs(cat.savings) / stats.maxCategorySavings) * 100, 8);
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-neutral-700 dark:text-neutral-300">{cat.label}</span>
                      <span
                        className={cn(
                          'text-xs font-medium tabular-nums',
                          cat.savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                        )}
                      >
                        {formatMoney(cat.savings)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', cat.color)}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VeSavingsSummary;
