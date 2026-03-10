import React from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface TypingIndicatorProps {
  typingUsers: string[];
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, className }) => {
  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? t('messaging.typingOne', { name: typingUsers[0]! })
      : typingUsers.length === 2
        ? t('messaging.typingTwo', { name1: typingUsers[0]!, name2: typingUsers[1]! })
        : t('messaging.typingMany');

  return (
    <div className={cn('flex items-center gap-2 px-4 py-1.5 text-xs text-neutral-500 dark:text-neutral-400', className)}>
      {/* Animated dots */}
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      <span>{text}</span>
    </div>
  );
};
