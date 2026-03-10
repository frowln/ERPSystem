import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Loader2, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { estimatesApi } from '@/api/estimates';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface PriceSuggestionPopoverProps {
  name: string;
  onApply: (price: number) => void;
}

export const PriceSuggestionPopover: React.FC<PriceSuggestionPopoverProps> = ({ name, onApply }) => {
  const [open, setOpen] = useState(false);
  const [debouncedName, setDebouncedName] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Debounce the name input by 500ms
  useEffect(() => {
    if (name.trim().length < 3) {
      setDebouncedName('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedName(name.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [name]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['price-suggestion', debouncedName],
    queryFn: () => estimatesApi.getPriceSuggestion(debouncedName),
    enabled: debouncedName.length >= 3,
    staleTime: 30_000,
  });

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleApply = useCallback(() => {
    const price = data?.avgPrice ?? data?.suggestedPrice ?? 0;
    if (price > 0) {
      onApply(price);
      setOpen(false);
    }
  }, [data, onApply]);

  const hasResults = data && (data.matchCount ?? 0) > 0;
  const showTrigger = debouncedName.length >= 3;

  if (!showTrigger) return null;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-all',
          hasResults
            ? 'border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-400 dark:bg-violet-900/30 dark:hover:bg-violet-900/50'
            : 'border-neutral-200 text-neutral-400 bg-neutral-50 dark:border-neutral-700 dark:text-neutral-500 dark:bg-neutral-800/50',
          (isLoading || isFetching) && 'animate-pulse',
        )}
      >
        {(isLoading || isFetching) ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Sparkles size={12} />
        )}
        {hasResults ? formatMoney(data.avgPrice ?? 0) : null}
      </button>

      {/* Popover */}
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 right-0 w-80 rounded-xl shadow-xl border',
            'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
            'animate-fade-in',
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <Sparkles size={16} className="text-violet-500" />
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('estimates.aiPricing.title')}
            </h4>
          </div>

          {(isLoading || isFetching) ? (
            <div className="flex items-center gap-2 px-4 py-6 justify-center text-sm text-neutral-500 dark:text-neutral-400">
              <Loader2 size={16} className="animate-spin" />
              {t('estimates.aiPricing.loading')}
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
              {t('estimates.aiPricing.noMatches')}
            </div>
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 px-4 py-3">
                <StatCell label={t('estimates.aiPricing.avgPrice')} value={data.avgPrice ?? 0} highlight />
                <StatCell label={t('estimates.aiPricing.medianPrice')} value={data.medianPrice ?? 0} />
                <StatCell
                  label={t('estimates.aiPricing.minPrice')}
                  value={data.minPrice ?? 0}
                  icon={<TrendingDown size={10} className="text-success-500" />}
                />
                <StatCell
                  label={t('estimates.aiPricing.maxPrice')}
                  value={data.maxPrice ?? 0}
                  icon={<TrendingUp size={10} className="text-danger-500" />}
                />
              </div>

              {/* Based on */}
              <div className="px-4 py-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                {t('estimates.aiPricing.basedOn', { count: String(data.matchCount) })}
              </div>

              {/* Recent matches */}
              {(data.recentMatches ?? []).length > 0 && (
                <div className="border-t border-neutral-100 dark:border-neutral-800">
                  <div className="px-4 pt-2 pb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {t('estimates.aiPricing.recentMatches')}
                  </div>
                  <div className="max-h-36 overflow-y-auto">
                    {(data.recentMatches ?? []).map((match, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-4 py-1.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="text-neutral-700 dark:text-neutral-300 truncate">{match.name}</p>
                          {match.projectName && (
                            <p className="text-neutral-400 dark:text-neutral-500 truncate">{match.projectName}</p>
                          )}
                        </div>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium tabular-nums whitespace-nowrap">
                          {formatMoney(match.unitPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply button */}
              <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handleApply}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    'bg-violet-600 text-white hover:bg-violet-700',
                    'dark:bg-violet-700 dark:hover:bg-violet-600',
                  )}
                >
                  <ArrowRight size={14} />
                  {t('estimates.aiPricing.apply')} ({formatMoney(data.avgPrice ?? 0)})
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const StatCell: React.FC<{
  label: string;
  value: number;
  highlight?: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, highlight, icon }) => (
  <div
    className={cn(
      'rounded-lg px-3 py-2',
      highlight
        ? 'bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800'
        : 'bg-neutral-50 dark:bg-neutral-800/50',
    )}
  >
    <div className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-0.5">
      {icon}
      {label}
    </div>
    <div className={cn(
      'text-sm font-semibold tabular-nums',
      highlight ? 'text-violet-700 dark:text-violet-400' : 'text-neutral-900 dark:text-neutral-100',
    )}>
      {formatMoney(value)}
    </div>
  </div>
);
