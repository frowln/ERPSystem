import React from 'react';
import { RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '@/i18n';
import { MailListItem } from './MailListItem';
import type { EmailMessage } from '@/api/email';

interface MailListProps {
  messages: EmailMessage[];
  selectedId: string | null;
  onSelectMessage: (id: string) => void;
  onStarMessage: (id: string, starred: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const MailList: React.FC<MailListProps> = ({
  messages,
  selectedId,
  onSelectMessage,
  onStarMessage,
  search,
  onSearchChange,
  onSync,
  isSyncing,
  page,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="w-80 border-r border-neutral-200 dark:border-neutral-700 flex flex-col bg-white dark:bg-neutral-900">
      {/* Search + Sync */}
      <div className="p-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('mail.searchPlaceholder')}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 disabled:opacity-50"
          title={t('mail.syncNow')}
        >
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {t('mail.noMessages')}
          </div>
        ) : (
          messages.map((msg) => (
            <MailListItem
              key={msg.id}
              message={msg}
              isSelected={selectedId === msg.id}
              onSelect={() => onSelectMessage(msg.id)}
              onStar={() => onStarMessage(msg.id, msg.isStarred)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-neutral-500">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
