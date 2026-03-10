import React, { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HealthLevel = 'green' | 'yellow' | 'red' | 'gray';

export interface HealthMetric {
  key: string;
  label: string;
  level: HealthLevel;
  value?: string;
  tooltip?: string;
}

export interface HealthScoreWidgetProps {
  metrics: HealthMetric[];
  title?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DOT_COLORS: Record<HealthLevel, string> = {
  green: '#22c55e',
  yellow: '#f59e0b',
  red: '#ef4444',
  gray: '#a3a3a3',
};

const DOT_BG_CLASSES: Record<HealthLevel, string> = {
  green: 'bg-green-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-neutral-400',
};

const LEVEL_LABEL_CLASSES: Record<HealthLevel, string> = {
  green: 'text-green-600 dark:text-green-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  gray: 'text-neutral-400 dark:text-neutral-500',
};

// ---------------------------------------------------------------------------
// Progress Ring (SVG)
// ---------------------------------------------------------------------------

const RING_SIZE = 56;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ProgressRingProps {
  ratio: number; // 0..1
  greenCount: number;
  total: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ ratio, greenCount, total }) => {
  const offset = RING_CIRCUMFERENCE * (1 - ratio);

  return (
    <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          className="text-neutral-200 dark:text-neutral-700"
        />
        {/* Green segment */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke={DOT_COLORS.green}
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
          {greenCount}/{total}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Metric Row
// ---------------------------------------------------------------------------

interface MetricRowProps {
  metric: HealthMetric;
}

const MetricRow: React.FC<MetricRowProps> = ({ metric }) => (
  <div className="group relative flex items-center gap-2.5 py-1.5" title={metric.tooltip}>
    {/* Colored dot */}
    <span
      className={cn('w-3 h-3 rounded-full flex-shrink-0', DOT_BG_CLASSES[metric.level])}
      aria-label={metric.level}
    />
    {/* Label + value */}
    <div className="flex-1 min-w-0">
      <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate block">
        {metric.label}
      </span>
    </div>
    {metric.value && (
      <span className={cn('text-xs font-medium whitespace-nowrap', LEVEL_LABEL_CLASSES[metric.level])}>
        {metric.value}
      </span>
    )}
    {/* Tooltip on hover */}
    {metric.tooltip && (
      <div
        className={cn(
          'absolute left-0 -top-8 z-50 px-2.5 py-1 rounded text-xs',
          'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900',
          'opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap',
        )}
      >
        {metric.tooltip}
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// HealthScoreWidget
// ---------------------------------------------------------------------------

export const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({
  metrics,
  title,
  className,
}) => {
  const { greenCount, total, ratio } = useMemo(() => {
    const gc = metrics.filter((m) => m.level === 'green').length;
    const tot = metrics.filter((m) => m.level !== 'gray').length || 1;
    return { greenCount: gc, total: metrics.length, ratio: gc / tot };
  }, [metrics]);

  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 transition-shadow duration-200 hover:shadow-sm',
        className,
      )}
    >
      {/* Header with ring */}
      <div className="flex items-center gap-4 mb-4">
        <ProgressRing ratio={ratio} greenCount={greenCount} total={total} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {title ?? t('healthScore.title')}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t('healthScore.score')}
          </p>
        </div>
      </div>

      {/* Metrics list */}
      <div className="space-y-0.5">
        {metrics.map((m) => (
          <MetricRow key={m.key} metric={m} />
        ))}
      </div>
    </div>
  );
};
