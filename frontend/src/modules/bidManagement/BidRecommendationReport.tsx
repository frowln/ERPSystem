import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingDown, Star, BarChart3 } from 'lucide-react';
import { bidManagementApi, type LevelingMatrix, type BidInvitation } from '@/api/bidManagement';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

interface Props {
  packageId: string;
}

const BidRecommendationReport: React.FC<Props> = ({ packageId }) => {
  const { data: matrix, isLoading } = useQuery<LevelingMatrix>({
    queryKey: ['bid-leveling', packageId],
    queryFn: () => bidManagementApi.getLevelingMatrix(packageId),
  });

  if (isLoading) return <div className="text-center py-8 text-neutral-500">{t('common.loading')}</div>;
  if (!matrix || matrix.invitations.length === 0) {
    return <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">{t('bidManagement.noInvitations')}</div>;
  }

  const { invitations, totals } = matrix;

  // Find recommended vendor (highest score)
  let recommendedId = '';
  let highestScore = 0;
  for (const [invId, total] of Object.entries(totals)) {
    if (total > highestScore) {
      highestScore = total;
      recommendedId = invId;
    }
  }
  const recommended = invitations.find(inv => inv.id === recommendedId);

  // Find lowest bid
  const submittedBids = invitations.filter(inv => inv.bidAmount != null && inv.bidAmount > 0);
  const lowestBid = submittedBids.length > 0
    ? submittedBids.reduce((a, b) => (a.bidAmount! < b.bidAmount! ? a : b))
    : null;

  // Find best value (highest score among lowest 50% bids)
  const sortedByBid = [...submittedBids].sort((a, b) => (a.bidAmount ?? 0) - (b.bidAmount ?? 0));
  const lowerHalf = sortedByBid.slice(0, Math.max(1, Math.ceil(sortedByBid.length / 2)));
  let bestValue: BidInvitation | null = null;
  let bestValueScore = 0;
  for (const inv of lowerHalf) {
    const score = totals[inv.id] ?? 0;
    if (score > bestValueScore) {
      bestValueScore = score;
      bestValue = inv;
    }
  }

  // Sort invitations by score for the chart
  const sortedByScore = [...invitations].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0));

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {t('bidManagement.recommendation')}
      </h3>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Recommended Vendor */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {t('bidManagement.recommendedVendor')}
            </span>
          </div>
          <div className="text-lg font-bold text-green-800 dark:text-green-200">
            {recommended?.vendorName ?? '—'}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            {t('bidManagement.score')}: {highestScore.toFixed(1)}%
          </div>
        </div>

        {/* Lowest Bid */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {t('bidManagement.lowestBid')}
            </span>
          </div>
          <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {lowestBid ? `${Number(lowestBid.bidAmount).toLocaleString('ru-RU')} ₽` : '—'}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            {lowestBid?.vendorName ?? ''}
          </div>
        </div>

        {/* Highest Score */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {t('bidManagement.highestScore')}
            </span>
          </div>
          <div className="text-lg font-bold text-amber-800 dark:text-amber-200">
            {highestScore.toFixed(1)}%
          </div>
          <div className="text-sm text-amber-600 dark:text-amber-400">
            {recommended?.vendorName ?? ''}
          </div>
        </div>

        {/* Best Value */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              {t('bidManagement.bestValue')}
            </span>
          </div>
          <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
            {bestValue?.vendorName ?? '—'}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            {bestValue ? `${Number(bestValue.bidAmount).toLocaleString('ru-RU')} ₽ / ${bestValueScore.toFixed(1)}%` : ''}
          </div>
        </div>
      </div>

      {/* Score bar chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
          {t('bidManagement.score')} — {t('bidManagement.leveling')}
        </h4>
        <div className="space-y-3">
          {sortedByScore.map((inv) => {
            const score = totals[inv.id] ?? 0;
            const isWinner = inv.id === recommendedId && highestScore > 0;
            return (
              <div key={inv.id} className="flex items-center gap-3">
                <span className="text-sm text-neutral-700 dark:text-neutral-300 w-40 truncate shrink-0">
                  {inv.vendorName}
                </span>
                <div className="flex-1 h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isWinner ? 'bg-green-500' : 'bg-primary-500'
                    )}
                    style={{ width: `${Math.min(100, score)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-200">
                    {score.toFixed(1)}%
                  </span>
                </div>
                {inv.bidAmount != null && (
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 w-28 text-right shrink-0">
                    {Number(inv.bidAmount).toLocaleString('ru-RU')} ₽
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BidRecommendationReport;
