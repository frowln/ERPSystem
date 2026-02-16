import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { TaskPriority } from '@/types';

interface PriorityBadgeProps {
  priority: TaskPriority;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const priorityConfig: Record<
  TaskPriority,
  { labelKey: string; color: string; bg: string; icon: React.ReactNode }
> = {
  LOW: {
    labelKey: 'taskBoard.priorityLow',
    color: 'text-neutral-500 dark:text-neutral-400',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    icon: <ArrowDown size={12} />,
  },
  NORMAL: {
    labelKey: 'taskBoard.priorityNormal',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    icon: <ArrowRight size={12} />,
  },
  HIGH: {
    labelKey: 'taskBoard.priorityHigh',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    icon: <ArrowUp size={12} />,
  },
  URGENT: {
    labelKey: 'taskBoard.priorityUrgent',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30',
    icon: <AlertTriangle size={12} />,
  },
  CRITICAL: {
    labelKey: 'taskBoard.priorityCritical',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: <Flame size={12} />,
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = React.memo(({
  priority,
  showLabel = true,
  size = 'sm',
  className,
}) => {
  const config = priorityConfig[priority] ?? priorityConfig.NORMAL;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        config.bg,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className,
      )}
    >
      {config.icon}
      {showLabel && t(config.labelKey as 'taskBoard.priorityLow')}
    </span>
  );
});
PriorityBadge.displayName = 'PriorityBadge';
