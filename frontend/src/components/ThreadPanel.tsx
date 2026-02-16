import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { layout } from '@/design-system/tokens';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import type { Message } from '@/api/messaging';

interface ThreadPanelProps {
  parentMessage: Message;
  replies: Message[];
  onClose: () => void;
  onSendReply: (content: string) => void;
  onReact?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onFavorite?: (messageId: string) => void;
  className?: string;
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({
  parentMessage,
  replies,
  onClose,
  onSendReply,
  onReact,
  onPin,
  onFavorite,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 h-full',
        className,
      )}
      style={{ width: layout.threadPanelWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('messaging.thread')}</h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {replies.length === 1
              ? t('messaging.replyOne', { count: String(replies.length) })
              : replies.length >= 2 && replies.length <= 4
                ? t('messaging.replyFew', { count: String(replies.length) })
                : t('messaging.replyMany', { count: String(replies.length) })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Parent message */}
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <MessageBubble
          message={parentMessage}
          onReact={onReact}
          onPin={onPin}
          onFavorite={onFavorite}
        />
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto">
        {replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-sm text-neutral-400">{t('messaging.noReplies')}</p>
            <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">
              {t('messaging.writeFirstReply')}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {replies.map((reply) => (
              <MessageBubble
                key={reply.id}
                message={reply}
                onReact={onReact}
                onPin={onPin}
                onFavorite={onFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reply input */}
      <MessageInput
        onSend={onSendReply}
        placeholder={t('messaging.replyInThread')}
      />
    </div>
  );
};
