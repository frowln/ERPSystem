import React, { useState } from 'react';
import {
  Reply,
  Star,
  Pin,
  MoreHorizontal,
  SmilePlus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { AssigneeAvatar } from './AssigneeAvatar';
import { formatRelativeTime } from '@/lib/format';
import type { Message } from '@/api/messaging';

interface MessageBubbleProps {
  message: Message;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onFavorite?: (messageId: string) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  onReply,
  onReact,
  onPin,
  onFavorite,
  className,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showMore, setShowMore] = useState(false);

  if (message.isSystem) {
    return (
      <div className={cn('flex items-center justify-center py-2', className)}>
        <div className="flex items-center gap-2 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{message.content}</span>
          <span className="text-[10px] text-neutral-400">
            {formatRelativeTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex gap-3 px-4 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors relative',
        message.isPinned && 'bg-yellow-50/50 dark:bg-yellow-900/10 border-l-2 border-yellow-400',
        className,
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowMore(false);
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <AssigneeAvatar
          name={message.authorName}
          avatarUrl={message.authorAvatarUrl}
          size="md"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Author row */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {message.authorName}
          </span>
          <span className="text-[11px] text-neutral-400">
            {formatRelativeTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className="text-[10px] text-neutral-400">{t('messaging.edited')}</span>
          )}
          {message.isPinned && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-yellow-600 font-medium">
              <Pin size={9} /> {t('messaging.pinned')}
            </span>
          )}
          {message.isFavorite && (
            <Star size={11} className="text-yellow-500 fill-yellow-500" />
          )}
        </div>

        {/* Message text */}
        <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap break-words mt-0.5">
          {message.content}
        </div>

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 truncate max-w-[150px]">
                  {att.fileName}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {t('messaging.fileSizeKb', { size: Math.round(att.fileSize / 1024) })}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors',
                  reaction.includesMe
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700',
                )}
                title={reaction.userNames.join(', ')}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {message.threadReplyCount > 0 && (
          <button
            onClick={() => onReply?.(message.id)}
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
          >
            <Reply size={12} />
            {message.threadReplyCount === 1
              ? t('messaging.replyOne', { count: message.threadReplyCount })
              : message.threadReplyCount < 5
                ? t('messaging.replyFew', { count: message.threadReplyCount })
                : t('messaging.replyMany', { count: message.threadReplyCount })}
          </button>
        )}
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className="absolute right-4 -top-3 flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm overflow-hidden z-10">
          <button
            onClick={() => onReact?.(message.id)}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            title={t('messaging.addReaction')}
          >
            <SmilePlus size={14} />
          </button>
          <button
            onClick={() => onReply?.(message.id)}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            title={t('messaging.reply')}
          >
            <Reply size={14} />
          </button>
          <button
            onClick={() => onPin?.(message.id)}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            title={t('messaging.pinMessage')}
          >
            <Pin size={14} />
          </button>
          <button
            onClick={() => onFavorite?.(message.id)}
            className={cn(
              'p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors',
              message.isFavorite ? 'text-yellow-500' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300',
            )}
            title={t('messaging.addToFavorites')}
          >
            <Star size={14} className={message.isFavorite ? 'fill-yellow-500' : ''} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {showMore && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-20">
                <button className="w-full text-left px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2">
                  <Edit2 size={11} /> {t('messaging.editMessage')}
                </button>
                <button className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                  <Trash2 size={11} /> {t('messaging.deleteMessage')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';
