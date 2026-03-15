import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, TrendingDown, TrendingUp, X, ArrowRight, Loader2 } from 'lucide-react';
import { estimatesApi, type PriceSuggestionMatch } from '@/api/estimates';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface HistoricalCostHintProps {
  materialName: string;
  unit?: string;
  onApplyPrice?: (price: number) => void;
  className?: string;
}

export const HistoricalCostHint: React.FC<HistoricalCostHintProps> = ({
  materialName,
  unit,
  onApplyPrice,
  className,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [debouncedName, setDebouncedName] = useState('');

  // Debounce the material name input
  useEffect(() => {
    if (materialName.trim().length < 3) {
      setDebouncedName('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedName(materialName.trim());
    }, 600);
    return () => clearTimeout(timer);
  }, [materialName]);

  // Reset dismissed state when name changes
  useEffect(() => {
    setDismissed(false);
  }, [debouncedName]);

  const { data, isLoading } = useQuery({
    queryKey: ['price-suggestion-hint', debouncedName],
    queryFn: () => estimatesApi.getPriceSuggestion(debouncedName),
    enabled: debouncedName.length >= 3,
    staleTime: 30_000,
  });

  if (dismissed || debouncedName.length < 3) return null;

  const hasData = data && (data.matchCount ?? 0) > 0;

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg', className)}>
        <Loader2 size={14} className="animate-spin" />
        <span>{t('estimates.benchmark.searching')}</span>
      </div>
    );
  }

  if (!hasData) return null;

  const range = (data.maxPrice ?? 0) - (data.minPrice ?? 0);

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-blue-50 dark:bg-blue-900/15 border-blue-200 dark:border-blue-800 overflow-hidden',
        className,
      )}
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition-colors"
      >
        <X size={14} />
      </button>

      <div className="px-3 py-2.5">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb size={14} className="text-blue-500 dark:text-blue-400" />
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            {t('estimates.benchmark.historicalData')}
          </span>
        </div>

        {/* Price stats */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-white/60 dark:bg-neutral-800/50 rounded px-2 py-1.5">
            <p className="text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-0.5">
              {t('estimates.benchmark.avgPrice')}
            </p>
            <p className="text-sm font-bold tabular-nums text-blue-700 dark:text-blue-400">
              {formatMoney(data.avgPrice ?? 0)}
            </p>
            {range > 0 && (
              <p className="text-[9px] text-neutral-400 dark:text-neutral-500 tabular-nums mt-0.5">
                &plusmn; {formatMoney(range / 2)}
              </p>
            )}
          </div>
          <div className="bg-white/60 dark:bg-neutral-800/50 rounded px-2 py-1.5">
            <div className="flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-0.5">
              <TrendingDown size={8} className="text-emerald-500" />
              {t('estimates.benchmark.minPrice')}
            </div>
            <p className="text-sm font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
              {formatMoney(data.minPrice ?? 0)}
            </p>
          </div>
          <div className="bg-white/60 dark:bg-neutral-800/50 rounded px-2 py-1.5">
            <div className="flex items-center gap-0.5 text-[9px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-0.5">
              <TrendingUp size={8} className="text-red-500" />
              {t('estimates.benchmark.maxPrice')}
            </div>
            <p className="text-sm font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
              {formatMoney(data.maxPrice ?? 0)}
            </p>
          </div>
        </div>

        {/* Data points count */}
        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mb-2">
          {data.matchCount ?? 0} {t('estimates.benchmark.dataPoints')}
          {unit ? ` (${unit})` : ''}
        </p>

        {/* Project names where used */}
        {(data.recentMatches ?? []).length > 0 && (
          <div className="space-y-0.5 mb-2">
            {(data.recentMatches ?? []).slice(0, 3).map((match: PriceSuggestionMatch, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-600 dark:text-neutral-400 truncate max-w-[60%]">
                  {match.projectName ?? match.name}
                </span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium tabular-nums">
                  {formatMoney(match.unitPrice)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Apply button */}
        {onApplyPrice && (
          <button
            type="button"
            onClick={() => onApplyPrice(data.avgPrice ?? data.suggestedPrice)}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors',
              'bg-blue-600 text-white hover:bg-blue-700',
              'dark:bg-blue-700 dark:hover:bg-blue-600',
            )}
          >
            <ArrowRight size={12} />
            {t('estimates.benchmark.applyAverage')} ({formatMoney(data.avgPrice ?? 0)})
          </button>
        )}
      </div>
    </div>
  );
};

export default HistoricalCostHint;
