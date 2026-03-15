import React from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatDateLong } from '@/lib/format';

interface DateSeparatorProps {
  date: string; // ISO date string
  className?: string;
}

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, now)) {
    return t('messaging.dateToday');
  }
  if (isSameDay(date, yesterday)) {
    return t('messaging.dateYesterday');
  }

  return formatDateLong(dateStr);
};

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date, className }) => {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', className)}>
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
      <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
        {formatDateLabel(date)}
      </span>
      <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
};

/**
 * Determine if a date separator should be shown before a message.
 * Returns true if the message date differs from the previous message date.
 */
export const shouldShowDateSeparator = (
  currentDate: string,
  prevDate: string | undefined,
): boolean => {
  if (!prevDate) return true;
  const d1 = new Date(currentDate);
  const d2 = new Date(prevDate);
  return !isSameDay(d1, d2);
};
