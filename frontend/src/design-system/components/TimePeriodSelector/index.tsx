import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

export type Period = '7d' | '30d' | '90d' | '6m' | '1y' | 'all' | 'custom';

export interface TimePeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  customRange?: { from: Date; to: Date };
  onCustomRangeChange?: (range: { from: Date; to: Date }) => void;
  showCustom?: boolean;
  periods?: Period[];
  className?: string;
}

const ALL_PERIODS: Period[] = ['7d', '30d', '90d', '6m', '1y', 'all', 'custom'];

const periodLabelKey: Record<Period, string> = {
  '7d': 'period.7d',
  '30d': 'period.30d',
  '90d': 'period.90d',
  '6m': 'period.6m',
  '1y': 'period.1y',
  all: 'period.all',
  custom: 'period.custom',
};

function formatDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
  showCustom = true,
  periods,
  className,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const visiblePeriods = (periods ?? ALL_PERIODS).filter(
    (p) => p !== 'custom' || showCustom,
  );

  // Close popover on click outside
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverOpen]);

  const handlePeriodClick = (period: Period) => {
    if (period === 'custom') {
      onChange(period);
      setPopoverOpen(true);
    } else {
      onChange(period);
      setPopoverOpen(false);
    }
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onCustomRangeChange) return;
    const fromDate = e.target.value ? new Date(e.target.value) : new Date();
    const to = customRange?.to ?? new Date();
    onCustomRangeChange({ from: fromDate, to });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onCustomRangeChange) return;
    const toDate = e.target.value ? new Date(e.target.value) : new Date();
    const from = customRange?.from ?? new Date();
    onCustomRangeChange({ from, to: toDate });
  };

  return (
    <div className={cn('relative inline-flex flex-col', className)}>
      {/* Segmented control */}
      <div
        className={cn(
          'inline-flex items-center rounded-lg border border-neutral-200 dark:border-neutral-700',
          'bg-neutral-100 dark:bg-neutral-800 p-0.5',
        )}
        role="group"
        aria-label={t('period.custom')}
      >
        {visiblePeriods.map((period) => {
          const isActive = value === period;
          const isCustomBtn = period === 'custom';

          return (
            <button
              key={period}
              ref={isCustomBtn ? triggerRef : undefined}
              type="button"
              onClick={() => handlePeriodClick(period)}
              className={cn(
                'relative inline-flex items-center justify-center gap-1',
                'px-2.5 h-7 text-xs font-medium rounded-md transition-all duration-150',
                'whitespace-nowrap select-none',
                isActive
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60',
              )}
            >
              {isCustomBtn && <Calendar size={12} />}
              {t(periodLabelKey[period])}
            </button>
          );
        })}
      </div>

      {/* Custom date range popover */}
      {popoverOpen && value === 'custom' && (
        <div
          ref={popoverRef}
          className={cn(
            'absolute top-full mt-1.5 right-0 z-50',
            'bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700',
            'shadow-lg p-3 animate-fade-in',
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('period.from')}
              </label>
              <input
                type="date"
                value={customRange ? formatDateInput(customRange.from) : ''}
                onChange={handleFromChange}
                className={cn(
                  'h-7 px-2 text-xs rounded-md border border-neutral-200 dark:border-neutral-700',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-1 focus:ring-primary-500',
                )}
              />
            </div>
            <span className="text-neutral-400 dark:text-neutral-500 mt-4">&mdash;</span>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('period.to')}
              </label>
              <input
                type="date"
                value={customRange ? formatDateInput(customRange.to) : ''}
                onChange={handleToChange}
                className={cn(
                  'h-7 px-2 text-xs rounded-md border border-neutral-200 dark:border-neutral-700',
                  'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                  'focus:outline-none focus:ring-1 focus:ring-primary-500',
                )}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
