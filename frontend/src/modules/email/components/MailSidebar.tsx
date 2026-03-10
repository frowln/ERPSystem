import React from 'react';
import { Inbox, Send, FileEdit, Trash2, Plus } from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

interface MailSidebarProps {
  activeFolder: string;
  onFolderChange: (folder: string) => void;
  onCompose: () => void;
  unreadCount: number;
}

const folders = [
  { id: 'INBOX', icon: Inbox, labelKey: 'mail.inbox' as const },
  { id: 'Sent', icon: Send, labelKey: 'mail.sent' as const },
  { id: 'Drafts', icon: FileEdit, labelKey: 'mail.drafts' as const },
  { id: 'Trash', icon: Trash2, labelKey: 'mail.trash' as const },
];

export const MailSidebar: React.FC<MailSidebarProps> = ({
  activeFolder,
  onFolderChange,
  onCompose,
  unreadCount,
}) => {
  return (
    <div className="w-56 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex flex-col">
      <div className="p-3">
        <button
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          {t('mail.compose')}
        </button>
      </div>
      <nav className="flex-1 px-2">
        {folders.map((folder) => {
          const Icon = folder.icon;
          const isActive = activeFolder === folder.id;
          const showBadge = folder.id === 'INBOX' && unreadCount > 0;
          return (
            <button
              key={folder.id}
              onClick={() => onFolderChange(folder.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700',
              )}
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{t(folder.labelKey)}</span>
              {showBadge && (
                <span className="bg-primary-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
