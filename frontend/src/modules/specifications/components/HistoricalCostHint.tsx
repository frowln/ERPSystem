import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp, Info, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatMoney } from '@/lib/format';
import { estimatesApi } from '@/api/estimates';

type PriceStatus = 'green' | 'amber' | 'red';

function getPriceStatus(currentPrice: number, avgPrice: number): PriceStatus {
  const ratio = currentPrice / avgPrice;
  if (ratio <= 1.10) return 'green';
  if (ratio <= 1.25) return 'amber';
  return 'red';
}

const STATUS_STYLES: Record<PriceStatus, { badge: string; text: string; icon: string }> = {
  green: {
    badge: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    icon: 'text-emerald-500',
  },
  amber: {
    badge: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-400',
    icon: 'text-amber-500',
  },
  red: {
    badge: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
    icon: 'text-red-500',
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface HistoricalCostHintProps {
  materialName: string;
  currentPrice: number;
  unit?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const HistoricalCostHint: React.FC<HistoricalCostHintProps> = ({
  materialName,
  currentPrice,
  unit,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Fetch price suggestion from the real API
  const { data, isLoading } = useQuery({
    queryKey: ['historical-cost', materialName],
    queryFn: async () => {
      const suggestion = await estimatesApi.getPriceSuggestion(materialName);
      if (!suggestion || (suggestion.matchCount ?? 0) === 0) return null;
      return {
        avg: suggestion.avgPrice ?? suggestion.suggestedPrice,
        min: suggestion.minPrice ?? suggestion.suggestedPrice,
        max: suggestion.maxPrice ?? suggestion.suggestedPrice,
        count: suggestion.matchCount ?? 0,
      };
    },
    enabled: materialName.length > 2,
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
        <Loader2 size={12} className="animate-spin" />
      </span>
    );
  }

  if (!data) return null;

  const status = getPriceStatus(currentPrice, data.avg ?? 0);
  const styles = STATUS_STYLES[status];
  const displayUnit = unit ?? '';

  const statusLabel =
    status === 'green'
      ? t('specifications.ve.priceWithinNorm')
      : status === 'amber'
        ? t('specifications.ve.priceAboveNorm')
        : t('specifications.ve.priceHighRisk');

  const StatusIcon = status === 'green' ? TrendingDown : TrendingUp;

  return (
    <div className="inline-flex flex-col">
      {/* Compact badge (always visible) */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors cursor-pointer',
          styles.badge,
          styles.text,
        )}
        title={statusLabel}
      >
        <StatusIcon size={12} className={styles.icon} />
        <span className="tabular-nums whitespace-nowrap">
          {t('specifications.ve.avgPrice')}: {formatMoney(data.avg)}/{displayUnit}
        </span>
        <span className="text-[10px] opacity-70">
          ({t('specifications.ve.basedOnProjects', { count: String(data.count) })})
        </span>
        <Info size={10} className="opacity-50 flex-shrink-0" />
      </button>

      {/* Expanded breakdown (toggle on click) */}
      {expanded && (
        <div
          className={cn(
            'mt-1 rounded-lg border p-3 text-xs space-y-2',
            'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
          )}
        >
          {/* Status line */}
          <div className="flex items-center gap-1.5">
            <History size={12} className="text-neutral-400" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {t('specifications.ve.historicalPrice')}
            </span>
          </div>

          {/* Min / Avg / Max grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md bg-neutral-50 dark:bg-neutral-800 px-2 py-1.5 text-center">
              <p className="text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-0.5">
                {t('specifications.ve.minPrice')}
              </p>
              <p className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                {formatMoney(data.min)}
              </p>
            </div>
            <div
              className={cn(
                'rounded-md px-2 py-1.5 text-center border',
                styles.badge,
              )}
            >
              <p className="text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-0.5">
                {t('specifications.ve.avgPrice')}
              </p>
              <p className={cn('font-bold tabular-nums', styles.text)}>
                {formatMoney(data.avg)}
              </p>
            </div>
            <div className="rounded-md bg-neutral-50 dark:bg-neutral-800 px-2 py-1.5 text-center">
              <p className="text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-0.5">
                {t('specifications.ve.maxPrice')}
              </p>
              <p className="font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                {formatMoney(data.max)}
              </p>
            </div>
          </div>

          {/* Projects count */}
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {t('specifications.ve.projectCount')}: {data.count}
          </p>
        </div>
      )}
    </div>
  );
};

export default HistoricalCostHint;
