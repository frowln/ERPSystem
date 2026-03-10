import React from 'react';
import { Star, Paperclip } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatRelativeTime } from '@/lib/format';
import type { EmailMessage } from '@/api/email';

interface MailListItemProps {
  message: EmailMessage;
  isSelected: boolean;
  onSelect: () => void;
  onStar: () => void;
}

export const MailListItem: React.FC<MailListItemProps> = ({
  message,
  isSelected,
  onSelect,
  onStar,
}) => {
  const senderName = message.fromName || message.fromAddress?.split('@')[0] || '';

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-neutral-100 dark:border-neutral-800 transition-colors',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        !message.isRead && 'border-l-2 border-l-primary-500',
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStar();
        }}
        className="mt-0.5 flex-shrink-0"
      >
        <Star
          size={16}
          className={cn(
            message.isStarred
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-neutral-300 dark:text-neutral-600 hover:text-yellow-400',
          )}
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-sm truncate',
              !message.isRead ? 'font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300',
            )}
          >
            {senderName}
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">
            {formatRelativeTime(message.receivedAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'text-sm truncate',
              !message.isRead ? 'font-medium text-neutral-800 dark:text-neutral-200' : 'text-neutral-600 dark:text-neutral-400',
            )}
          >
            {message.subject || t('mail.noSubject')}
          </span>
          {message.hasAttachments && (
            <Paperclip size={14} className="text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};
