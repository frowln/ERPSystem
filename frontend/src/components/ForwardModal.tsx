import React, { useState, useMemo } from 'react';
import { Forward, Hash, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { AssigneeAvatar } from './AssigneeAvatar';
import type { Channel, Message } from '@/api/messaging';

interface ForwardModalProps {
  open: boolean;
  onClose: () => void;
  message: Message | null;
  channels: Channel[];
  currentChannelId: string | null;
  onForward: (channelId: string, message: Message) => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  open,
  onClose,
  message,
  channels,
  currentChannelId,
  onForward,
}) => {
  const [search, setSearch] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const available = channels.filter((ch) => ch.id !== currentChannelId);
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(
      (ch) =>
        ch.name.toLowerCase().includes(q) ||
        ch.otherUserName?.toLowerCase().includes(q),
    );
  }, [channels, currentChannelId, search]);

  const handleForward = () => {
    if (!selectedChannelId || !message) return;
    onForward(selectedChannelId, message);
    setSelectedChannelId(null);
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSelectedChannelId(null);
    setSearch('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('messaging.forwardMessage')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleForward} disabled={!selectedChannelId}>
            <Forward size={14} className="mr-1.5" />
            {t('messaging.forward')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {/* Preview of message to forward */}
        {message && (
          <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              {message.authorName}
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
              {message.content}
            </p>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          placeholder={t('messaging.searchChannelToForward')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="w-full h-9 px-3 text-sm bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100 border-0 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900"
        />

        {/* Channel list */}
        <div className="max-h-64 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg">
          {filtered.length === 0 ? (
            <p className="text-xs text-neutral-400 p-3 text-center">{t('messaging.noChannelsFound')}</p>
          ) : (
            filtered.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannelId(ch.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  selectedChannelId === ch.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
                )}
              >
                {ch.type === 'direct' ? (
                  <AssigneeAvatar name={ch.otherUserName ?? ch.name} size="xs" />
                ) : ch.type === 'private' ? (
                  <Lock size={14} className="text-neutral-400 flex-shrink-0" />
                ) : (
                  <Hash size={14} className="text-neutral-400 flex-shrink-0" />
                )}
                <span className="truncate">{ch.type === 'direct' ? (ch.otherUserName ?? ch.name) : ch.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
