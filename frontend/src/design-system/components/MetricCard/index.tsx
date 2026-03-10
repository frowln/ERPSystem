import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MetricCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    label?: string;
  };
  subtitle?: string;
  compact?: boolean;
  loading?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  trend,
  subtitle,
  compact = false,
  loading = false,
  className,
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700',
          compact ? 'p-4' : 'p-5',
          className,
        )}
      >
        <div className="animate-pulse">
          <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
          <div className="h-7 w-28 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
          <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  const trendColor =
    trend?.direction === 'up'
      ? 'text-success-600'
      : trend?.direction === 'down'
        ? 'text-danger-600'
        : 'text-neutral-500';

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
        ? TrendingDown
        : Minus;

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 transition-shadow duration-200 hover:shadow-sm',
        compact ? 'p-4' : 'p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {icon && (
              <span className="text-neutral-400 flex-shrink-0">{icon}</span>
            )}
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider leading-tight">
              {label}
            </p>
          </div>
          <p
            className={cn(
              'font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight',
              compact ? 'text-xl' : 'text-2xl',
            )}
          >
            {value}
          </p>
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', trendColor)}>
              <TrendIcon size={12} />
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-neutral-500">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
