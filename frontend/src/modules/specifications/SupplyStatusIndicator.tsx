import React from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

export type SupplyStatus = 'FULLY_COVERED' | 'PARTIALLY_COVERED' | 'NOT_COVERED';

interface SupplyStatusIndicatorProps {
  proposalCount?: number;
  hasWinner?: boolean;
  minRequired?: number;
  status?: SupplyStatus;
  size?: 'sm' | 'md';
  className?: string;
}

function resolveStatus(proposalCount: number, hasWinner: boolean, minRequired: number): SupplyStatus {
  if (hasWinner) return 'FULLY_COVERED';
  if (proposalCount >= minRequired) return 'PARTIALLY_COVERED';
  return 'NOT_COVERED';
}

const statusConfig: Record<SupplyStatus, { dot: string; bg: string; labelKey: string }> = {
  FULLY_COVERED: {
    dot: 'bg-success-500',
    bg: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300',
    labelKey: 'competitiveList.supply.fullyCovered',
  },
  PARTIALLY_COVERED: {
    dot: 'bg-warning-500',
    bg: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300',
    labelKey: 'competitiveList.supply.partiallyCovered',
  },
  NOT_COVERED: {
    dot: 'bg-danger-500',
    bg: 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300',
    labelKey: 'competitiveList.supply.notCovered',
  },
};

export const SupplyStatusIndicator: React.FC<SupplyStatusIndicatorProps> = ({
  proposalCount = 0,
  hasWinner = false,
  minRequired = 1,
  status: directStatus,
  size = 'md',
  className,
}) => {
  const status = directStatus ?? resolveStatus(proposalCount, hasWinner, minRequired);
  const config = statusConfig[status];

  if (size === 'sm') {
    return (
      <span className={cn('w-2 h-2 rounded-full shrink-0', config.dot, className)} title={t(config.labelKey)} />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
        config.bg,
        className,
      )}
      title={t(config.labelKey)}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {t(config.labelKey)}
    </span>
  );
};
