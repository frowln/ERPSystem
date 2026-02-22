import React from 'react';
import { cn } from '@/lib/cn';

interface ContractCoverageBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
}

const ContractCoverageBar: React.FC<ContractCoverageBarProps> = ({ percent, className, showLabel = true }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const color =
    clamped >= 100
      ? 'bg-success-500'
      : clamped >= 50
        ? 'bg-warning-400'
        : clamped > 0
          ? 'bg-orange-400'
          : 'bg-neutral-300 dark:bg-neutral-600';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            'text-xs font-medium tabular-nums w-10 text-right',
            clamped >= 100
              ? 'text-success-600 dark:text-success-400'
              : clamped >= 50
                ? 'text-warning-600 dark:text-warning-400'
                : 'text-neutral-500 dark:text-neutral-400',
          )}
        >
          {clamped.toFixed(0)}%
        </span>
      )}
    </div>
  );
};

export default ContractCoverageBar;
