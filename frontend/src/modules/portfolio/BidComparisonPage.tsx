import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Scale, Award, TrendingUp, AlertTriangle, Search } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Select } from '@/design-system/components/FormField';
import { portfolioApi } from '@/api/portfolio';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { BidComparison } from './types';

const recommendationColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  RECOMMENDED: 'green',
  ACCEPTABLE: 'yellow',
  NOT_RECOMMENDED: 'red',
};

const recommendationLabels: Record<string, string> = {
  RECOMMENDED: 'Рекомендуется',
  ACCEPTABLE: 'Допустимо',
  NOT_RECOMMENDED: 'Не рекомендуется',
};

const criteriaLabels: Record<string, string> = {
  technicalScore: 'Техническое',
  financialScore: 'Финансовое',
  experienceScore: 'Опыт',
  qualityScore: 'Качество',
  timelineScore: 'Сроки',
};

const criteriaKeys = ['technicalScore', 'financialScore', 'experienceScore', 'qualityScore', 'timelineScore'] as const;

const BidComparisonPage: React.FC = () => {
  const [selectedBid, setSelectedBid] = useState('bp-1');

  const { data: comparisons } = useQuery({
    queryKey: ['bid-comparisons', selectedBid],
    queryFn: () => portfolioApi.getBidComparisons(selectedBid),
  });

  const bids = comparisons ?? [];
  const sortedBids = useMemo(() => [...bids].sort((a, b) => a.rank - b.rank), [bids]);

  const metrics = useMemo(() => {
    const avgPrice = bids.length > 0 ? bids.reduce((s, b) => s + b.totalPrice, 0) / bids.length : 0;
    const minPrice = bids.length > 0 ? Math.min(...bids.map((b) => b.totalPrice)) : 0;
    const maxPrice = bids.length > 0 ? Math.max(...bids.map((b) => b.totalPrice)) : 0;
    const recommended = bids.filter((b) => b.recommendation === 'RECOMMENDED').length;
    return { avgPrice, minPrice, maxPrice, recommended, totalBidders: bids.length };
  }, [bids]);

  const maxScore = 100;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Сравнение предложений"
        subtitle="Анализ и ранжирование тендерных предложений"
        breadcrumbs={[
          { label: 'Главная', href: '/' },
          { label: 'Портфель' },
          { label: 'Сравнение предложений' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard icon={<Scale size={18} />} label="Участников" value={metrics.totalBidders} />
        <MetricCard icon={<TrendingUp size={18} />} label="Средняя цена" value={formatMoneyCompact(metrics.avgPrice)} />
        <MetricCard label="Разброс цен" value={`${formatMoneyCompact(metrics.minPrice)} - ${formatMoneyCompact(metrics.maxPrice)}`} />
        <MetricCard icon={<Award size={18} />} label="Рекомендовано" value={metrics.recommended} subtitle="участников" />
      </div>

      {/* Ranking cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sortedBids.slice(0, 3).map((bid, idx) => (
          <div
            key={bid.id}
            className={cn(
              'bg-white dark:bg-neutral-900 rounded-xl border-2 p-6',
              idx === 0 ? 'border-yellow-400' : idx === 1 ? 'border-neutral-300 dark:border-neutral-600' : 'border-orange-300',
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300' : 'bg-orange-100 text-orange-700',
                )}>
                  {bid.rank}
                </span>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{bid.vendorName}</p>
                </div>
              </div>
              <StatusBadge
                status={bid.recommendation}
                colorMap={recommendationColorMap}
                label={recommendationLabels[bid.recommendation] ?? bid.recommendation}
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Цена предложения</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatMoneyCompact(bid.totalPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Итоговый балл</p>
                <p className={cn(
                  'text-2xl font-bold tabular-nums',
                  bid.weightedTotal >= 80 ? 'text-success-600' : bid.weightedTotal >= 70 ? 'text-warning-600' : 'text-danger-600',
                )}>
                  {bid.weightedTotal.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {criteriaKeys.map((key) => {
                const score = bid[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 w-20">{criteriaLabels[key]}</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          score >= 80 ? 'bg-success-500' : score >= 65 ? 'bg-warning-500' : 'bg-danger-400',
                        )}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-neutral-600 tabular-nums w-6 text-right">{score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Full comparison table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Детальное сравнение</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Место</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Подрядчик</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Цена</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Техн.</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Фин.</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Опыт</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Кач-во</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Сроки</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Итого</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Рекомендация</th>
              </tr>
            </thead>
            <tbody>
              {sortedBids.map((bid) => (
                <tr key={bid.id} className={cn(
                  'border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800',
                  bid.rank === 1 && 'bg-yellow-50/50',
                )}>
                  <td className="px-3 py-3">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      bid.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      bid.rank === 2 ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300' :
                      bid.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400',
                    )}>
                      {bid.rank}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{bid.vendorName}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm text-neutral-700 dark:text-neutral-300">{formatMoney(bid.totalPrice)}</td>
                  <ScoreCell score={bid.technicalScore} />
                  <ScoreCell score={bid.financialScore} />
                  <ScoreCell score={bid.experienceScore} />
                  <ScoreCell score={bid.qualityScore} />
                  <ScoreCell score={bid.timelineScore} />
                  <td className="px-3 py-3 text-center">
                    <span className={cn(
                      'text-sm font-bold tabular-nums',
                      bid.weightedTotal >= 80 ? 'text-success-600' : bid.weightedTotal >= 70 ? 'text-warning-600' : 'text-danger-600',
                    )}>
                      {bid.weightedTotal.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge
                      status={bid.recommendation}
                      colorMap={recommendationColorMap}
                      label={recommendationLabels[bid.recommendation] ?? bid.recommendation}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price comparison bar chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mt-6">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Сравнение цен предложений</h3>
        <div className="space-y-3">
          {sortedBids.map((bid) => {
            const maxPrice = Math.max(...sortedBids.map((b) => b.totalPrice));
            const barWidth = maxPrice > 0 ? (bid.totalPrice / maxPrice) * 100 : 0;
            return (
              <div key={bid.id} className="flex items-center gap-3">
                <span className="text-xs text-neutral-600 w-40 truncate">{bid.vendorName}</span>
                <div className="flex-1 relative h-6 bg-neutral-100 dark:bg-neutral-800 rounded">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 rounded',
                      bid.rank === 1 ? 'bg-success-400' : bid.recommendation === 'NOT_RECOMMENDED' ? 'bg-danger-300' : 'bg-primary-300',
                    )}
                    style={{ width: `${barWidth}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    {formatMoney(bid.totalPrice)}
                  </span>
                </div>
                <span className={cn(
                  'text-xs font-bold tabular-nums w-10 text-right',
                  bid.weightedTotal >= 80 ? 'text-success-600' : bid.weightedTotal >= 70 ? 'text-warning-600' : 'text-danger-600',
                )}>
                  {bid.weightedTotal.toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function ScoreCell({ score }: { score: number }) {
  return (
    <td className="px-3 py-3 text-center">
      <span className={cn(
        'text-xs font-medium tabular-nums px-2 py-0.5 rounded',
        score >= 80 ? 'bg-success-50 text-success-700' :
        score >= 65 ? 'bg-warning-50 text-warning-700' :
        'bg-danger-50 text-danger-700',
      )}>
        {score}
      </span>
    </td>
  );
}

export default BidComparisonPage;
