import React from 'react';
import { cn } from '@/lib/cn';
import {
  type BadgeColor,
  colorStyles,
  projectStatusColorMap,
  projectStatusLabels,
} from './statusConfig';

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, BadgeColor | string>;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  colorMap = projectStatusColorMap,
  label,
  size = 'sm',
  className,
}) => {
  const rawColor = colorMap[status];
  const color: BadgeColor =
    rawColor && Object.prototype.hasOwnProperty.call(colorStyles, rawColor)
      ? (rawColor as BadgeColor)
      : 'gray';
  const styles = colorStyles[color];
  const displayLabel = label ?? projectStatusLabels[status] ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        styles.bg,
        styles.text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', styles.dot)} />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
