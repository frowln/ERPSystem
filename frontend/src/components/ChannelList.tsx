import React from 'react';
import { Hash, Lock, Star, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { AssigneeAvatar } from './AssigneeAvatar';
import type { Channel, UserStatus, OrgUser } from '@/api/messaging';

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFavorites?: () => void;
  searchUsers?: OrgUser[];
  onStartDm?: (userId: string) => void;
  className?: string;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  searchQuery,
  onSearchChange,
  onOpenFavorites,
  searchUsers,
  onStartDm,
  className,
}) => {
  const filtered = searchQuery
    ? channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ch.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : channels;

  const publicChannels = filtered.filter((ch) => ch.type === 'public' || ch.type === 'private');
  const directMessages = filtered.filter((ch) => ch.type === 'direct');

  const statusColors: Record<UserStatus, string> = {
    ONLINE: 'bg-green-500',
    AWAY: 'bg-yellow-500',
    BUSY: 'bg-red-500',
    OFFLINE: 'bg-neutral-300 dark:bg-neutral-600',
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search */}
      <div className="px-3 py-3">
        <input
          type="text"
          placeholder={t('filters.search')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-8 px-3 text-sm bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100 border-0 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 transition-all"
        />
      </div>

      {/* Favorites link */}
      {onOpenFavorites && (
        <button
          onClick={onOpenFavorites}
          className="mx-2 mb-1 flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
        >
          <Star size={14} className="text-yellow-500" />
          {t('messaging.favorites')}
        </button>
      )}

      {/* Channels section */}
      <div className="flex-1 overflow-y-auto">
        {/* Public / Private channels */}
        <div className="mb-3">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('messaging.channels')}
            </span>
            {onCreateChannel && (
              <button
                onClick={onCreateChannel}
                className="p-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
                title={t('messaging.createChannel')}
              >
                <Plus size={14} />
              </button>
            )}
          </div>
          {publicChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md mx-1 transition-colors',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                activeChannelId === channel.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-neutral-700 dark:text-neutral-300',
              )}
              style={{ width: 'calc(100% - 8px)' }}
            >
              {channel.type === 'private' ? (
                <Lock size={14} className="text-neutral-400 flex-shrink-0" />
              ) : (
                <Hash size={14} className="text-neutral-400 flex-shrink-0" />
              )}
              <span className="truncate flex-1 text-left">{channel.name}</span>
              {channel.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex-shrink-0">
                  {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('messaging.directMessages')}
            </span>
          </div>
          {directMessages.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md mx-1 transition-colors',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                activeChannelId === channel.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-neutral-700 dark:text-neutral-300',
              )}
              style={{ width: 'calc(100% - 8px)' }}
            >
              <div className="relative flex-shrink-0">
                <AssigneeAvatar
                  name={channel.otherUserName ?? channel.name}
                  size="xs"
                />
                {channel.otherUserStatus && (
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-neutral-900',
                      statusColors[channel.otherUserStatus],
                    )}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="block truncate">
                  {channel.otherUserName ?? channel.name}
                </span>
                {channel.lastMessage && (
                  <span className="block text-[11px] text-neutral-400 truncate">
                    {channel.lastMessage.content}
                  </span>
                )}
              </div>
              {channel.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-red-500 text-white rounded-full flex-shrink-0">
                  {channel.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Users for DM */}
        {searchQuery && searchUsers && searchUsers.length > 0 && (
          <div className="mb-3">
            <div className="px-3 py-1.5">
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('messaging.users')}
              </span>
            </div>
            {searchUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => onStartDm?.(u.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md mx-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                style={{ width: 'calc(100% - 8px)' }}
              >
                <AssigneeAvatar name={u.fullName} size="xs" />
                <div className="flex-1 min-w-0 text-left">
                  <span className="block truncate">{u.fullName}</span>
                  <span className="block text-[11px] text-neutral-400 truncate">{u.email}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
