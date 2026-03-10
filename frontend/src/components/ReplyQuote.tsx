import React from 'react';
import { X, Reply } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Message } from '@/api/messaging';

interface ReplyQuoteProps {
  message: Message;
  onCancel: () => void;
  onScrollToMessage?: (messageId: string) => void;
  className?: string;
}

export const ReplyQuote: React.FC<ReplyQuoteProps> = ({
  message,
  onCancel,
  onScrollToMessage,
  className,
}) => {
  return (
    <div className={cn('px-4 pt-3', className)}>
      <div className="flex items-start gap-2 p-2.5 bg-primary-50/70 dark:bg-primary-900/20 rounded-lg border-l-2 border-primary-400 dark:border-primary-600">
        <Reply size={14} className="text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onScrollToMessage?.(message.id)}
        >
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
            {t('messaging.replyingTo', { name: message.authorName })}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
            {message.content}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="flex-shrink-0 p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
