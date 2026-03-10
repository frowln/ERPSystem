import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export interface BatterySegment {
  value: number;
  color: string;
  label: string;
}

export interface BatteryWidgetProps {
  segments: BatterySegment[];
  total: number;
  showLegend?: boolean;
  showPercentage?: boolean;
  height?: number;
  className?: string;
}

export const BatteryWidget: React.FC<BatteryWidgetProps> = ({
  segments,
  total,
  showLegend = true,
  showPercentage = true,
  height = 28,
  className,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const safeTotal = Math.max(total, 0);
  const filledSum = safeTotal > 0
    ? segments.reduce((sum, s) => sum + Math.max(s.value, 0), 0)
    : 0;
  const clampedSum = Math.min(filledSum, safeTotal);
  const filledPct = safeTotal > 0 ? (clampedSum / safeTotal) * 100 : 0;

  const isHexColor = (c: string) => c.startsWith('#') || c.startsWith('rgb');

  return (
    <div className={cn('w-full', className)}>
      {/* Battery container */}
      <div className="flex items-center gap-0.5">
        {/* Main battery body */}
        <div
          className="relative flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 overflow-hidden"
          style={{ height }}
        >
          {/* Segments row */}
          <div className="absolute inset-0 flex">
            {safeTotal > 0 && segments.map((segment, idx) => {
              const segValue = Math.max(segment.value, 0);
              if (segValue === 0) return null;

              // Clamp: if cumulative exceeds total, trim this segment
              const preceding = segments
                .slice(0, idx)
                .reduce((s, seg) => s + Math.max(seg.value, 0), 0);
              const available = Math.max(safeTotal - preceding, 0);
              const effectiveValue = Math.min(segValue, available);
              if (effectiveValue <= 0) return null;

              const widthPct = (effectiveValue / safeTotal) * 100;
              const isFirst = idx === 0 || segments.slice(0, idx).every(s => s.value <= 0);
              const isLast = idx === segments.length - 1
                || segments.slice(idx + 1).every(s => s.value <= 0);

              return (
                <div
                  key={`${segment.label}-${idx}`}
                  className={cn(
                    'h-full transition-all duration-700 ease-out',
                    !isHexColor(segment.color) && segment.color,
                    isFirst && 'rounded-l-md',
                    isLast && filledPct >= 100 && 'rounded-r-md',
                  )}
                  style={{
                    width: mounted ? `${widthPct}%` : '0%',
                    ...(isHexColor(segment.color)
                      ? { backgroundColor: segment.color }
                      : {}),
                    transitionDelay: `${idx * 80}ms`,
                  }}
                  title={`${segment.label}: ${segValue}`}
                />
              );
            })}
          </div>

          {/* Percentage label inside the bar */}
          {showPercentage && safeTotal > 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums drop-shadow-sm',
                  filledPct > 50
                    ? 'text-white'
                    : 'text-neutral-600 dark:text-neutral-300',
                )}
              >
                {Math.round(filledPct)}%
              </span>
            </div>
          )}
        </div>

        {/* Battery terminal cap */}
        <div
          className="rounded-r-sm bg-neutral-300 dark:bg-neutral-600 flex-shrink-0"
          style={{ width: 4, height: height * 0.5, borderRadius: '0 3px 3px 0' }}
        />
      </div>

      {/* Legend */}
      {showLegend && segments.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {segments.map((segment, idx) => {
            const segValue = Math.max(segment.value, 0);
            const pct = safeTotal > 0 ? (segValue / safeTotal) * 100 : 0;
            return (
              <div
                key={`legend-${segment.label}-${idx}`}
                className="flex items-center gap-1.5"
              >
                <span
                  className={cn(
                    'inline-block w-2.5 h-2.5 rounded-full flex-shrink-0',
                    !isHexColor(segment.color) && segment.color,
                  )}
                  style={
                    isHexColor(segment.color)
                      ? { backgroundColor: segment.color }
                      : undefined
                  }
                />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {segment.label}
                </span>
                <span className="text-xs font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
                  {segValue}
                </span>
                {showPercentage && safeTotal > 0 && (
                  <span className="text-xs tabular-nums text-neutral-400 dark:text-neutral-500">
                    ({Math.round(pct)}%)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
