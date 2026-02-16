import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '@/api/messaging';
import {
  Hash,
  Search,
  Pin,
  Info,
  X,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { layout } from '@/design-system/tokens';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Textarea } from '@/design-system/components/FormField';
import { ChannelList } from '@/components/ChannelList';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { ThreadPanel } from '@/components/ThreadPanel';
import { AssigneeAvatar } from '@/components/AssigneeAvatar';
import { useMessagingStore } from '@/stores/messagingStore';
import { useAuthStore } from '@/stores/authStore';
import { type Channel, type Message, type UserStatus, type ChannelType } from '@/api/messaging';
import { formatRelativeTime } from '@/lib/format';
import { Skeleton } from '@/design-system/components/Skeleton';
import toast from 'react-hot-toast';

/* ─── Component ─── */
const MessagingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const {
    activeChannelId,
    setActiveChannelId,
    activeThreadMessageId,
    setActiveThreadMessageId,
    showChannelInfo,
    setShowChannelInfo,
    channelSearchQuery,
    setChannelSearchQuery,
  } = useMessagingStore();

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<ChannelType>('public');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['messaging-channels'],
    queryFn: messagingApi.getChannels,
  });

  // Auto-select first channel
  useEffect(() => {
    if (!activeChannelId && channels.length > 0 && channels[0]) {
      setActiveChannelId(channels[0].id);
    }
  }, [activeChannelId, channels, setActiveChannelId]);

  const activeChannel = useMemo(
    () => channels.find((ch) => ch.id === activeChannelId),
    [channels, activeChannelId],
  );

  const channelIdForQuery = activeChannelId ?? '';
  const { data: currentMessages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['messaging-messages', channelIdForQuery],
    enabled: Boolean(activeChannelId),
    queryFn: async () => {
      const messages = await messagingApi.getChannelMessages(channelIdForQuery);
      // Backend returns DESC; UI expects ASC
      return messages
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
  });

  type SendMessageVars = { channelId: string; content: string; parentMessageId?: string | null };
  type SendMessageContext = { previous: Message[]; optimisticId: string };

  const sendMessageMutation = useMutation<Message, unknown, SendMessageVars, SendMessageContext>({
    mutationFn: (vars) =>
      messagingApi.sendMessage(vars.channelId, {
        content: vars.content,
        parentMessageId: vars.parentMessageId ?? undefined,
      }),
    onMutate: async (vars) => {
      const key = ['messaging-messages', vars.channelId] as const;
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<Message[]>(key) ?? [];
      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const authorName =
        user?.fullName?.trim() ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
        user?.email ||
        'Me';

      const optimisticMessage: Message = {
        id: optimisticId,
        channelId: vars.channelId,
        authorId: user?.id ?? 'me',
        authorName,
        authorAvatarUrl: user?.avatarUrl,
        content: vars.content,
        createdAt: new Date().toISOString(),
        updatedAt: undefined,
        isEdited: false,
        isPinned: false,
        isFavorite: false,
        reactions: [],
        threadReplyCount: 0,
        threadLastReplyAt: undefined,
        parentMessageId: vars.parentMessageId ?? undefined,
        attachments: [],
        isSystem: false,
      };

      queryClient.setQueryData<Message[]>(key, [...previous, optimisticMessage]);
      return { previous, optimisticId };
    },
    onError: (_error, vars, ctx) => {
      const key = ['messaging-messages', vars.channelId] as const;
      if (ctx?.previous) {
        queryClient.setQueryData<Message[]>(key, ctx.previous);
      }
    },
    onSuccess: (saved, vars, ctx) => {
      const key = ['messaging-messages', vars.channelId] as const;
      queryClient.setQueryData<Message[]>(key, (current = []) =>
        current.map((m) => (m.id === ctx.optimisticId ? saved : m)),
      );
      // Refresh channels ordering / counts if backend sorts by lastMessageAt.
      queryClient.invalidateQueries({ queryKey: ['messaging-channels'] });
    },
  });

  const createChannelMutation = useMutation<
    Channel,
    unknown,
    { name: string; description?: string; channelType: ChannelType }
  >({
    mutationFn: (vars) => messagingApi.createChannel(vars),
    onSuccess: (created) => {
      toast.success(t('messaging.channelCreatedSuccess'));
      setShowCreateChannel(false);
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('public');
      setActiveChannelId(created.id);
      queryClient.setQueryData<Channel[]>(['messaging-channels'], (current = []) => {
        const exists = current.some((c) => c.id === created.id);
        return exists ? current : [created, ...current];
      });
      queryClient.invalidateQueries({ queryKey: ['messaging-channels'] });
    },
  });

  // Scroll to bottom on channel change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannelId, currentMessages.length]);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!activeChannelId) return;
      sendMessageMutation.mutate({ channelId: activeChannelId, content });
    },
    [activeChannelId, sendMessageMutation],
  );

  const handleReply = useCallback(
    (messageId: string) => {
      setActiveThreadMessageId(messageId);
    },
    [setActiveThreadMessageId],
  );

  const handleReact = useCallback((_messageId: string) => {
      toast.success(t('messaging.reactionAdded'));
  }, []);

  const handlePin = useCallback((_messageId: string) => {
      toast.success(t('messaging.messagePinned'));
  }, []);

  const handleFavorite = useCallback((_messageId: string) => {
      toast.success(t('messaging.messageAddedToFavorites'));
  }, []);

  const handleSendReply = useCallback(
    (content: string) => {
      if (!activeChannelId || !activeThreadMessageId) return;
      sendMessageMutation.mutate({
        channelId: activeChannelId,
        content,
        parentMessageId: activeThreadMessageId,
      });
    },
    [activeChannelId, activeThreadMessageId, sendMessageMutation],
  );

  const threadParentMessage = useMemo(
    () => currentMessages.find((m) => m.id === activeThreadMessageId),
    [currentMessages, activeThreadMessageId],
  );

  const threadReplies: Message[] = useMemo(() => {
    if (!activeThreadMessageId) return [];
    return currentMessages.filter((m) => m.parentMessageId === activeThreadMessageId);
  }, [currentMessages, activeThreadMessageId]);

  const statusDot = (status: UserStatus) => {
    const colors: Record<UserStatus, string> = {
      ONLINE: 'bg-green-500', AWAY: 'bg-yellow-500', BUSY: 'bg-red-500', OFFLINE: 'bg-neutral-300',
    };
    return colors[status];
  };

  return (
    <div className="animate-fade-in -m-6 flex" style={{ height: `calc(100vh - ${layout.topBarHeight}px)` }}>
      {/* LEFT SIDEBAR */}
      <div className="flex-shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700 flex flex-col" style={{ width: layout.channelListWidth }}>
        <ChannelList
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={setActiveChannelId}
          onCreateChannel={() => setShowCreateChannel(true)}
          searchQuery={channelSearchQuery}
          onSearchChange={setChannelSearchQuery}
          onOpenFavorites={() => navigate('/messaging/favorites')}
        />
      </div>

      {/* CENTER — Messages */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-950">
        {activeChannel ? (
          <>
            {/* Channel header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {activeChannel.type === 'direct' ? (
                  <AssigneeAvatar
                    name={activeChannel.otherUserName ?? activeChannel.name}
                    size="sm"
                    online={activeChannel.otherUserStatus === 'ONLINE'}
                  />
                ) : (
                  <Hash size={16} className="text-neutral-400" />
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {activeChannel.type === 'direct'
                      ? activeChannel.otherUserName
                      : activeChannel.name}
                  </h3>
                  {activeChannel.type !== 'direct' && (
                    <p className="text-[11px] text-neutral-400">
                      {t('messaging.membersCount', { count: String(activeChannel.memberCount) })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  title={t('messaging.searchTitle')}
                >
                  <Search size={16} />
                </button>
                <button
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                  title={t('messaging.pinnedTitle')}
                >
                  <Pin size={16} />
                </button>
                <button
                  onClick={() => setShowChannelInfo(!showChannelInfo)}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    showChannelInfo
                      ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  )}
                  title={t('messaging.channelInfoTitle')}
                >
                  <Info size={16} />
                </button>
              </div>
            </div>

            {/* Search bar (inline) */}
            {showSearch && (
              <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center gap-2">
                <Search size={14} className="text-neutral-400" />
                <input
                  type="text"
                  placeholder={t('messaging.searchInChannel')}
                  value={msgSearchQuery}
                  onChange={(e) => setMsgSearchQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400 dark:text-neutral-100"
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setMsgSearchQuery('');
                  }}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="py-4">
                {/* Channel intro */}
                <div className="px-4 pb-4 mb-2">
                  <h2 className="text-lg font-bold text-neutral-900">
                    {activeChannel.type === 'direct'
                      ? activeChannel.otherUserName
                      : `# ${activeChannel.name}`}
                  </h2>
                  {activeChannel.description && (
                    <p className="text-sm text-neutral-500 mt-1">{activeChannel.description}</p>
                  )}
                  <p className="text-xs text-neutral-400 mt-2">
                    {t('messaging.channelCreatedAt')} {formatRelativeTime(activeChannel.createdAt)}
                  </p>
                </div>

                {/* Message list */}
                {messagesLoading ? (
                  <div className="px-4 space-y-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="flex gap-3">
                        <Skeleton variant="circular" className="h-9 w-9 flex-shrink-0 dark:bg-neutral-800" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-40 dark:bg-neutral-800" />
                          <Skeleton className="h-4 w-full dark:bg-neutral-800" />
                          <Skeleton className="h-4 w-5/6 dark:bg-neutral-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  currentMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onReply={handleReply}
                    onReact={handleReact}
                    onPin={handlePin}
                    onFavorite={handleFavorite}
                  />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message input */}
            <MessageInput
              onSend={handleSendMessage}
              onAttach={() => toast(t('messaging.attachmentAvailable'))}
              placeholder={
                activeChannel.type === 'direct'
                  ? t('messaging.messageTo', { user: activeChannel.otherUserName ?? activeChannel.name })
                  : t('messaging.messageInChannel', { channel: activeChannel.name })
              }
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash size={48} className="text-neutral-200 mx-auto mb-3" />
              <p className="text-neutral-500">{t('messaging.selectChannel')}</p>
            </div>
          </div>
        )}
      </div>

      {/* THREAD PANEL */}
      {activeThreadMessageId && threadParentMessage && (
        <ThreadPanel
          parentMessage={threadParentMessage}
          replies={threadReplies}
          onClose={() => setActiveThreadMessageId(null)}
          onSendReply={handleSendReply}
          onReact={handleReact}
          onPin={handlePin}
          onFavorite={handleFavorite}
        />
      )}

      {/* RIGHT SIDEBAR — Channel Info */}
      {showChannelInfo && activeChannel && !activeThreadMessageId && (
        <div className="flex-shrink-0 border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col overflow-y-auto" style={{ width: layout.channelInfoWidth }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('messaging.info')}</h3>
            <button
              onClick={() => setShowChannelInfo(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Channel details */}
          <div className="px-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {activeChannel.type === 'direct'
                ? activeChannel.otherUserName
                : `# ${activeChannel.name}`}
            </h4>
            {activeChannel.description && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">{activeChannel.description}</p>
            )}
          </div>

          {/* Members */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('messaging.membersLabel')} ({0})
              </span>
            </div>
            <div className="space-y-2">
              {([] as any[]).map((member) => (
                <div key={member.id} className="flex items-center gap-2.5 py-1">
                  <div className="relative">
                    <AssigneeAvatar name={member.name} size="sm" />
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-neutral-900',
                        statusDot(member.status),
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{member.name}</p>
                    <p className="text-[10px] text-neutral-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pinned messages */}
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 mb-3">
              <Pin size={12} className="text-neutral-400" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('messaging.pinnedCount')} ({0})
              </span>
            </div>
            {([] as any[]).map((msg) => (
              <div key={msg.id} className="p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30 rounded-lg mb-2">
                <p className="text-xs text-neutral-700 dark:text-neutral-300">{msg.content}</p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {msg.authorName} -- {formatRelativeTime(msg.createdAt)}
                </p>
              </div>
            ))}
          </div>

          {/* Shared files */}
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 mb-3">
              <FileText size={12} className="text-neutral-400" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('messaging.files')}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <FileText size={14} className="text-neutral-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">Протокол_испытаний_B25.pdf</p>
                  <p className="text-[10px] text-neutral-400">240 КБ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create channel modal */}
      <Modal
        open={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        title={t('messaging.createChannel')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateChannel(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                const name = newChannelName.trim();
                const description = newChannelDescription.trim();
                if (!name) return;
                createChannelMutation.mutate({
                  name,
                  description: description ? description : undefined,
                  channelType: newChannelType,
                });
              }}
              disabled={!newChannelName.trim()}
              loading={createChannelMutation.isPending}
            >
              {t('common.create')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('messaging.channelName')} required>
            <Input
              placeholder={t('messaging.channelNamePlaceholder')}
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
            />
          </FormField>
          <FormField label={t('messaging.channelDescription')}>
            <Textarea
              placeholder={t('messaging.channelDescription')}
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
            />
          </FormField>
          <FormField label={t('messaging.channelType')}>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="public"
                  checked={newChannelType === 'public'}
                  onChange={() => setNewChannelType('public')}
                  className="text-primary-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('messaging.publicChannel')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="private"
                  checked={newChannelType === 'private'}
                  onChange={() => setNewChannelType('private')}
                  className="text-primary-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('messaging.privateChannel')}</span>
              </label>
            </div>
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default MessagingPage;
