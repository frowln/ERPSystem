import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '@/api/messaging';
import { callsApi } from '@/api/calls';
import {
  Hash,
  Search,
  Pin,
  Info,
  X,
  FileText,
  Phone,
  Video,
  Forward,
  Link2,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { layout } from '@/design-system/tokens';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { FormField, Input, Textarea } from '@/design-system/components/FormField';
import { ChannelList } from '@/components/ChannelList';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { EmojiPicker } from '@/components/EmojiPicker';
import { ThreadPanel } from '@/components/ThreadPanel';
import { AssigneeAvatar } from '@/components/AssigneeAvatar';
import { DropZone } from '@/components/DropZone';
import { DateSeparator, shouldShowDateSeparator } from '@/components/DateSeparator';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ReplyQuote } from '@/components/ReplyQuote';
import { ForwardModal } from '@/components/ForwardModal';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { ImageLightbox } from '@/components/ImageLightbox';
import CallDialog, { type CallDialogMode } from '@/components/CallDialog';
import type { CallSession } from '@/api/calls';
import { useMessagingStore } from '@/stores/messagingStore';
import { useAuthStore } from '@/stores/authStore';
import { wsClient } from '@/lib/websocket';
import { notificationSounds } from '@/lib/notificationSounds';
import { type Channel, type Message, type UserStatus, type ChannelType, type ChannelMember, type OrgUser } from '@/api/messaging';
import { formatRelativeTime } from '@/lib/format';
import { Skeleton } from '@/design-system/components/Skeleton';
import toast from 'react-hot-toast';

/* ─── Image MIME types for inline preview ─── */
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const isImageAttachment = (mimeType: string) => IMAGE_MIME_TYPES.includes(mimeType);

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
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelType, setNewChannelType] = useState<ChannelType>('public');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Emoji picker state for reactions
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<string | null>(null);

  // Inline edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Delete confirmation state
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);

  // Add member to existing channel state
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');

  // Reply-with-quote state
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  // Forward message state
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  // Image lightbox state
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Typing indicator state
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Read receipts state
  const [readStatuses, setReadStatuses] = useState<Record<string, 'sent' | 'delivered' | 'read'>>({});

  // Previous message count for notification sounds
  const prevMessageCountRef = useRef(0);
  const prevUnreadRef = useRef<Record<string, number>>({});

  // Call state
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
  const [callDialogMode, setCallDialogMode] = useState<CallDialogMode | null>(null);

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ['messaging-channels'],
    queryFn: messagingApi.getChannels,
    refetchInterval: 10000, // Poll every 10s for new channels/DMs
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
    refetchInterval: 5000, // Poll every 5s for new messages
    queryFn: async () => {
      const messages = await messagingApi.getChannelMessages(channelIdForQuery);
      // Backend returns DESC; UI expects ASC
      return messages
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
  });

  // Fetch channel members (always: needed for @mentions + channel info)
  const { data: channelMembers = [] } = useQuery<ChannelMember[]>({
    queryKey: ['messaging-members', channelIdForQuery],
    enabled: Boolean(activeChannelId),
    queryFn: () => messagingApi.getChannelMembers(channelIdForQuery),
  });

  // Fetch pinned messages
  const { data: pinnedMessages = [] } = useQuery<Message[]>({
    queryKey: ['messaging-pinned', channelIdForQuery],
    enabled: Boolean(activeChannelId) && (showChannelInfo || showPinnedPanel),
    queryFn: () => messagingApi.getPinnedMessages(channelIdForQuery),
  });

  // Org users for create channel modal
  const { data: orgUsers = [] } = useQuery({
    queryKey: ['org-users-for-channel', memberSearch],
    queryFn: () => messagingApi.getOrganizationUsers(memberSearch || undefined),
    enabled: showCreateChannel,
  });

  // Org users for DM search in sidebar — show from 1 char (like Telegram)
  const { data: searchedUsers = [] } = useQuery({
    queryKey: ['org-users-search', channelSearchQuery],
    queryFn: () => messagingApi.getOrganizationUsers(channelSearchQuery || undefined),
    enabled: Boolean(channelSearchQuery && channelSearchQuery.length >= 1),
  });

  // Org users for add-member modal on existing channels
  const { data: addMemberUsers = [] } = useQuery({
    queryKey: ['org-users-add-member', addMemberSearch],
    queryFn: () => messagingApi.getOrganizationUsers(addMemberSearch || undefined),
    enabled: showAddMember,
  });

  // Listen for incoming call signals via WebSocket
  useEffect(() => {
    if (!user) return;
    const sub = wsClient.subscribeRaw<{
      type: string;
      callId: string;
      fromUserId: string;
      toUserId: string;
      callType?: string;
      callerName?: string;
    }>('/user/queue/signal', (signal) => {
      if (signal.type === 'call-invite' && signal.toUserId === user.id && !activeCallId) {
        // Incoming call — load the session and show the dialog
        callsApi.list().then((calls) => {
          const session = calls.find((c) => c.id === signal.callId);
          if (session && session.status !== 'ENDED' && session.status !== 'CANCELLED') {
            setActiveCallSession(session);
            setActiveCallId(session.id);
            setCallDialogMode('ringing-incoming');
          }
        }).catch(() => { /* ignore */ });
      }
    });
    return () => sub.unsubscribe();
  }, [user, activeCallId]);

  // Auto-transition from ringing-outgoing to active when participants join
  useEffect(() => {
    if (!activeCallId || callDialogMode !== 'ringing-outgoing') return;
    const interval = setInterval(async () => {
      try {
        const calls = await callsApi.listActive();
        const session = calls.find((c) => c.id === activeCallId);
        if (session && session.status === 'ACTIVE') {
          setActiveCallSession(session);
          setCallDialogMode('active');
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeCallId, callDialogMode]);

  // Collect shared files from current messages
  const sharedFiles = useMemo(() => {
    return currentMessages
      .flatMap((m) => m.attachments.map((att) => ({ ...att, authorName: m.authorName, createdAt: m.createdAt })))
      .slice(0, 20);
  }, [currentMessages]);

  /* ─── WebSocket: Typing indicator ─── */
  useEffect(() => {
    if (!activeChannelId) return;
    const sub = wsClient.subscribeToChannelTyping(activeChannelId, (msg) => {
      if (msg.userId === user?.id) return;
      const userName = msg.userName;
      setTypingUsers((prev) => (prev.includes(userName) ? prev : [...prev, userName]));
      if (typingTimeoutsRef.current[msg.userId]) clearTimeout(typingTimeoutsRef.current[msg.userId]);
      typingTimeoutsRef.current[msg.userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== userName));
        delete typingTimeoutsRef.current[msg.userId];
      }, 3000);
    });
    return () => {
      sub.unsubscribe();
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
      typingTimeoutsRef.current = {};
      setTypingUsers([]);
    };
  }, [activeChannelId, user?.id]);

  /* ─── WebSocket: Read receipts ─── */
  useEffect(() => {
    if (!activeChannelId) return;
    const sub = wsClient.subscribeToChannelReadReceipts(activeChannelId, (msg) => {
      setReadStatuses((prev) => ({ ...prev, [msg.messageId]: msg.status as 'sent' | 'delivered' | 'read' }));
    });
    return () => sub.unsubscribe();
  }, [activeChannelId]);

  /* ─── Mark messages as read when entering channel ─── */
  useEffect(() => {
    if (!activeChannelId || !user?.id) return;
    wsClient.publish('/app/read', { channelId: activeChannelId, userId: user.id, status: 'read' });
  }, [activeChannelId, user?.id, currentMessages.length]);

  /* ─── Notification sounds ─── */
  useEffect(() => {
    const count = currentMessages.length;
    if (prevMessageCountRef.current > 0 && count > prevMessageCountRef.current) {
      const lastMessage = currentMessages[count - 1];
      if (lastMessage && lastMessage.authorId !== user?.id) {
        notificationSounds.playMessageActive();
      }
    }
    prevMessageCountRef.current = count;
  }, [currentMessages.length, currentMessages, user?.id]);

  useEffect(() => {
    for (const ch of channels) {
      if (ch.id === activeChannelId) continue;
      const prev = prevUnreadRef.current[ch.id] ?? 0;
      if (ch.unreadCount > prev) { notificationSounds.playMessageOther(); break; }
    }
    const newCounts: Record<string, number> = {};
    for (const ch of channels) newCounts[ch.id] = ch.unreadCount;
    prevUnreadRef.current = newCounts;
  }, [channels, activeChannelId]);

  /* ─── Typing send handler ─── */
  const handleTyping = useCallback(() => {
    if (!activeChannelId || !user) return;
    wsClient.publish('/app/typing', {
      channelId: activeChannelId,
      userId: user.id,
      userName: user.fullName || user.email || 'User',
    });
  }, [activeChannelId, user]);

  /* ─── Scroll to message (for reply quote click) ─── */
  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20');
      setTimeout(() => { el.classList.remove('bg-yellow-50', 'dark:bg-yellow-900/20'); }, 2000);
    }
  }, []);

  /* ─── Render @mentions as highlighted spans ─── */
  const renderContent = useCallback((text: string) => {
    const parts = text.split(/(@\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/30 rounded px-0.5">
            {part}
          </span>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  }, []);

  /* ─── Total unread for sidebar badge ─── */
  const totalUnread = useMemo(() => channels.reduce((sum, ch) => sum + (ch.unreadCount ?? 0), 0), [channels]);

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
      toast.error(t('common.operationError'));
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
    { name: string; description?: string; channelType: ChannelType; memberIds?: string[] }
  >({
    mutationFn: (vars) => messagingApi.createChannel(vars),
    onSuccess: (created) => {
      toast.success(t('messaging.channelCreatedSuccess'));
      setShowCreateChannel(false);
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelType('public');
      setSelectedMemberIds([]);
      setMemberSearch('');
      setActiveChannelId(created.id);
      queryClient.setQueryData<Channel[]>(['messaging-channels'], (current = []) => {
        const exists = current.some((c) => c.id === created.id);
        return exists ? current : [created, ...current];
      });
      queryClient.invalidateQueries({ queryKey: ['messaging-channels'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  /* ─── Reaction mutation (A) ─── */
  const addReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messagingApi.addReaction(messageId, emoji),
    onSuccess: () => {
      toast.success(t('messaging.reactionAdded'));
      if (activeChannelId) {
        queryClient.invalidateQueries({ queryKey: ['messaging-messages', activeChannelId] });
      }
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  /* ─── Pin mutation (A) ─── */
  const pinMessageMutation = useMutation({
    mutationFn: (messageId: string) => messagingApi.pinMessage(messageId),
    onSuccess: () => {
      toast.success(t('messaging.messagePinned'));
      if (activeChannelId) {
        queryClient.invalidateQueries({ queryKey: ['messaging-messages', activeChannelId] });
        queryClient.invalidateQueries({ queryKey: ['messaging-pinned', activeChannelId] });
      }
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  /* ─── Favorite mutation (A) ─── */
  const addToFavoritesMutation = useMutation({
    mutationFn: (messageId: string) => messagingApi.addToFavorites(messageId),
    onSuccess: () => {
      toast.success(t('messaging.messageAddedToFavorites'));
      if (activeChannelId) {
        queryClient.invalidateQueries({ queryKey: ['messaging-messages', activeChannelId] });
      }
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  /* ─── Edit message mutation (D) ─── */
  const editMessageMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messagingApi.editMessage(messageId, content),
    onSuccess: (updatedMsg) => {
      toast.success(t('messaging.messageUpdated'));
      setEditingMessageId(null);
      setEditingContent('');
      if (activeChannelId) {
        queryClient.setQueryData<Message[]>(['messaging-messages', activeChannelId], (current = []) =>
          current.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
        );
      }
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  /* ─── Delete message mutation (D) ─── */
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => messagingApi.deleteMessage(messageId),
    onSuccess: (_data, messageId) => {
      toast.success(t('messaging.messageDeleted'));
      setDeleteMessageId(null);
      if (activeChannelId) {
        queryClient.setQueryData<Message[]>(['messaging-messages', activeChannelId], (current = []) =>
          current.filter((m) => m.id !== messageId),
        );
        queryClient.invalidateQueries({ queryKey: ['messaging-pinned', activeChannelId] });
      }
    },
    onError: () => {
      toast.error(t('common.operationError'));
      setDeleteMessageId(null);
    },
  });

  /* ─── Add member to existing channel mutation ─── */
  const addMemberMutation = useMutation({
    mutationFn: ({ channelId, userId }: { channelId: string; userId: string }) =>
      messagingApi.addChannelMember(channelId, userId),
    onSuccess: () => {
      toast.success(t('messaging.memberAdded'));
      if (activeChannelId) {
        queryClient.invalidateQueries({ queryKey: ['messaging-members', activeChannelId] });
        queryClient.invalidateQueries({ queryKey: ['messaging-channels'] });
      }
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  // Scroll to bottom on channel change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannelId, currentMessages.length]);

  const [fileUploading, setFileUploading] = useState(false);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!activeChannelId) return;
      const parentId = replyToMessage?.id ?? null;
      sendMessageMutation.mutate({ channelId: activeChannelId, content, parentMessageId: parentId });
      setReplyToMessage(null);
    },
    [activeChannelId, sendMessageMutation, replyToMessage],
  );

  const handleSendWithFile = useCallback(
    async (content: string, file: File) => {
      if (!activeChannelId) return;
      setFileUploading(true);
      try {
        const attachment = await messagingApi.uploadAttachment(file, activeChannelId);
        await messagingApi.sendMessage(activeChannelId, {
          content: content || file.name,
          messageType: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
          attachmentUrl: `att:${attachment.id}`,
          attachmentName: attachment.fileName,
          attachmentSize: attachment.fileSize,
          attachmentType: attachment.contentType,
        });
        queryClient.invalidateQueries({ queryKey: ['messaging-messages', activeChannelId] });
        queryClient.invalidateQueries({ queryKey: ['messaging-channels'] });
      } catch {
        toast.error(t('common.operationError'));
      } finally {
        setFileUploading(false);
      }
    },
    [activeChannelId, queryClient],
  );

  const handleReply = useCallback(
    (messageId: string) => {
      const message = currentMessages.find((m) => m.id === messageId);
      if (message) setReplyToMessage(message);
    },
    [currentMessages],
  );

  const handleOpenThread = useCallback(
    (messageId: string) => {
      setActiveThreadMessageId(messageId);
    },
    [setActiveThreadMessageId],
  );

  /* (A) handleReact -- open emoji picker, then call API */
  const handleReact = useCallback((messageId: string) => {
    setEmojiPickerMessageId((prev) => (prev === messageId ? null : messageId));
  }, []);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      if (emojiPickerMessageId) {
        addReactionMutation.mutate({ messageId: emojiPickerMessageId, emoji });
      }
      setEmojiPickerMessageId(null);
    },
    [emojiPickerMessageId, addReactionMutation],
  );

  /* (A) handlePin -- call API */
  const handlePin = useCallback(
    (messageId: string) => {
      pinMessageMutation.mutate(messageId);
    },
    [pinMessageMutation],
  );

  /* (A) handleFavorite -- call API */
  const handleFavorite = useCallback(
    (messageId: string) => {
      addToFavoritesMutation.mutate(messageId);
    },
    [addToFavoritesMutation],
  );

  /* (D) handleEditMessage -- inline edit */
  const handleEditMessage = useCallback(
    (messageId: string) => {
      const message = currentMessages.find((m) => m.id === messageId);
      if (message) {
        setEditingMessageId(messageId);
        setEditingContent(message.content);
      }
    },
    [currentMessages],
  );

  const handleEditSubmit = useCallback(() => {
    if (!editingMessageId || !editingContent.trim()) return;
    editMessageMutation.mutate({ messageId: editingMessageId, content: editingContent.trim() });
  }, [editingMessageId, editingContent, editMessageMutation]);

  const handleEditCancel = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent('');
  }, []);

  /* (D) handleDeleteMessage -- confirmation then API */
  const handleDeleteMessage = useCallback((messageId: string) => {
    setDeleteMessageId(messageId);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteMessageId) {
      deleteMessageMutation.mutate(deleteMessageId);
    }
  }, [deleteMessageId, deleteMessageMutation]);

  const handleSendReply = useCallback(
    (content: string) => {
      if (!activeChannelId || !activeThreadMessageId) return;
      sendMessageMutation.mutate(
        { channelId: activeChannelId, content, parentMessageId: activeThreadMessageId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messaging-thread-replies', activeThreadMessageId] });
            queryClient.invalidateQueries({ queryKey: ['messaging-messages', activeChannelId] });
          },
        },
      );
    },
    [activeChannelId, activeThreadMessageId, sendMessageMutation, queryClient],
  );

  /* ─── Reply-with-quote: send message with parentMessageId ─── */
  const handleReplyWithQuote = useCallback(
    (content: string) => {
      if (!activeChannelId || !replyToMessage) return;
      sendMessageMutation.mutate(
        { channelId: activeChannelId, content, parentMessageId: replyToMessage.id },
        {
          onSuccess: () => {
            setReplyToMessage(null);
          },
        },
      );
    },
    [activeChannelId, replyToMessage, sendMessageMutation],
  );

  /* ─── Forward message to another channel ─── */
  const handleForward = useCallback(
    (channelId: string, message: Message) => {
      const fwdContent = `${t('messaging.forwardedFrom', { name: message.authorName })}:\n${message.content}`;
      sendMessageMutation.mutate({ channelId, content: fwdContent });
      toast.success(t('messaging.messageForwarded'));
    },
    [sendMessageMutation],
  );

  /* ─── Forward: open modal for specific message ─── */
  const handleForwardAction = useCallback(
    (messageId: string) => {
      const message = currentMessages.find((m) => m.id === messageId);
      if (message) {
        setForwardMessage(message);
        setShowForwardModal(true);
      }
    },
    [currentMessages],
  );

  /* ─── Start audio/video call ─── */
  const handleStartCall = useCallback(
    async (callType: 'AUDIO' | 'VIDEO') => {
      if (!user || !activeChannel) return;
      try {
        const session = await callsApi.create({
          callType,
          channelId: activeChannel.id,
          initiatorId: user.id,
          initiatorName: user.fullName ?? user.email,
          title: callType === 'VIDEO' ? t('calls.quickVideoCall') : t('calls.quickAudioCall'),
          inviteeIds: activeChannel.type === 'direct' && activeChannel.otherUserId
            ? [activeChannel.otherUserId]
            : undefined,
        });
        setActiveCallId(session.id);
        setActiveCallSession(session);
        setCallDialogMode('ringing-outgoing');
        toast.success(callType === 'VIDEO' ? t('calls.startingVideoCall') : t('calls.startingAudioCall'));
      } catch {
        toast.error(t('common.operationError'));
      }
    },
    [user, activeChannel],
  );

  /* ─── Copy invite link for group call ─── */
  const handleCopyCallLink = useCallback(
    async (callId: string) => {
      try {
        const session = await callsApi.generateInviteLink(callId);
        if (session.inviteToken) {
          const link = `${window.location.origin}/call/${session.inviteToken}`;
          await navigator.clipboard.writeText(link);
          toast.success(t('common.copiedToClipboard'));
        }
      } catch {
        toast.error(t('common.operationError'));
      }
    },
    [],
  );

  /* ─── Voice message handler ─── */
  const handleVoiceSend = useCallback(
    async (blob: Blob, durationSec: number) => {
      if (!activeChannelId) return;
      const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      setFileUploading(true);
      try {
        const attachment = await messagingApi.uploadAttachment(file, activeChannelId);
        await messagingApi.sendMessage(activeChannelId, {
          content: t('messaging.voiceDuration', { duration: `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, '0')}` }),
          messageType: 'VOICE',
          attachmentUrl: `att:${attachment.id}`,
          attachmentName: attachment.fileName,
          attachmentSize: attachment.fileSize,
          attachmentType: attachment.contentType,
        });
        queryClient.invalidateQueries({ queryKey: ['messaging-messages', activeChannelId] });
      } catch {
        toast.error(t('common.operationError'));
      } finally {
        setFileUploading(false);
      }
    },
    [activeChannelId, queryClient],
  );

  /* ─── Drag & drop file handler ─── */
  const handleFileDrop = useCallback(
    (file: File) => {
      handleSendWithFile(file.name, file);
    },
    [handleSendWithFile],
  );

  const threadParentMessage = useMemo(
    () => currentMessages.find((m) => m.id === activeThreadMessageId),
    [currentMessages, activeThreadMessageId],
  );

  // Fetch thread replies from dedicated backend endpoint
  const { data: threadReplies = [] } = useQuery<Message[]>({
    queryKey: ['messaging-thread-replies', activeThreadMessageId],
    enabled: Boolean(activeThreadMessageId),
    refetchInterval: 5000,
    queryFn: () => messagingApi.getThreadReplies(activeThreadMessageId!),
  });

  // Set user status to ONLINE on mount
  useEffect(() => {
    messagingApi.setUserStatus('online').catch(() => {});
    return () => {
      messagingApi.setUserStatus('offline').catch(() => {});
    };
  }, []);

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!msgSearchQuery.trim()) return currentMessages;
    const lower = msgSearchQuery.toLowerCase();
    return currentMessages.filter(
      (m) =>
        m.content.toLowerCase().includes(lower) ||
        m.authorName.toLowerCase().includes(lower),
    );
  }, [currentMessages, msgSearchQuery]);

  // Helper to get proper display name for DM channels
  const channelDisplayName = useCallback(
    (ch: Channel) => {
      if (ch.type === 'direct') {
        return ch.otherUserName || ch.name;
      }
      return ch.name;
    },
    [],
  );

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
          searchUsers={searchedUsers}
          onStartDm={(userId) => {
            messagingApi.createDirectChannel(userId).then((ch) => {
              queryClient.invalidateQueries({ queryKey: ['messaging-channels'] });
              setActiveChannelId(ch.id);
            });
          }}
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
                    name={channelDisplayName(activeChannel)}
                    avatarUrl={activeChannel.otherUserAvatarUrl}
                    size="sm"
                    online={activeChannel.otherUserStatus === 'ONLINE'}
                  />
                ) : (
                  <Hash size={16} className="text-neutral-400" />
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {activeChannel.type === 'direct'
                      ? channelDisplayName(activeChannel)
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
                {/* (E) Pin button -- toggle pinned panel */}
                <button
                  onClick={() => setShowPinnedPanel((prev) => !prev)}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    showPinnedPanel
                      ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                  )}
                  title={t('messaging.pinnedTitle')}
                >
                  <Pin size={16} />
                </button>
                {/* Call buttons — for DMs: 1-on-1 call, for channels: group call */}
                <button
                  onClick={() => handleStartCall('AUDIO')}
                  className="p-1.5 text-neutral-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title={t('calls.newAudioCall')}
                >
                  <Phone size={16} />
                </button>
                <button
                  onClick={() => handleStartCall('VIDEO')}
                  className="p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title={t('calls.newVideoCall')}
                >
                  <Video size={16} />
                </button>
                {activeCallId && (
                  <button
                    onClick={() => handleCopyCallLink(activeCallId)}
                    className="p-1.5 text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
                    title={t('common.copyLink')}
                  >
                    <Link2 size={16} />
                  </button>
                )}
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

            {/* Pinned messages panel (E) */}
            {showPinnedPanel && (
              <div className="px-4 py-3 border-b border-yellow-100 dark:border-yellow-800/30 bg-yellow-50/50 dark:bg-yellow-900/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Pin size={12} className="text-yellow-600" />
                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">
                      {t('messaging.pinnedMessages')}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPinnedPanel(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    <X size={14} />
                  </button>
                </div>
                {pinnedMessages.length === 0 ? (
                  <p className="text-xs text-neutral-400">{t('messaging.noPinnedMessages')}</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pinnedMessages.map((msg) => (
                      <div key={msg.id} className="p-2 bg-white dark:bg-neutral-800 border border-yellow-100 dark:border-yellow-800/30 rounded-lg">
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2">{msg.content}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          {msg.authorName} — {formatRelativeTime(msg.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages — wrapped in DropZone for drag & drop uploads */}
            <DropZone onFileDrop={handleFileDrop} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto">
                <div className="py-4 pb-2">
                  {/* Channel intro */}
                  <div className="px-4 pb-4 mb-2">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {activeChannel.type === 'direct'
                        ? channelDisplayName(activeChannel)
                        : `# ${activeChannel.name}`}
                    </h2>
                    {activeChannel.description && (
                      <p className="text-sm text-neutral-500 mt-1">{activeChannel.description}</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-2">
                      {t('messaging.channelCreatedAt', { time: formatRelativeTime(activeChannel.createdAt) })}
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
                    filteredMessages.map((message, idx) => (
                      <div key={message.id} className="relative">
                        {/* Date separator between messages on different days */}
                        {shouldShowDateSeparator(
                          message.createdAt,
                          idx > 0 ? filteredMessages[idx - 1]?.createdAt : undefined,
                        ) && (
                          <DateSeparator date={message.createdAt} />
                        )}

                        {/* Inline edit mode */}
                        {editingMessageId === message.id ? (
                          <div className="px-4 py-2 bg-primary-50/50 dark:bg-primary-900/10 border-l-2 border-primary-400">
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <AssigneeAvatar
                                  name={message.authorName}
                                  avatarUrl={message.authorAvatarUrl}
                                  size="md"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                    {message.authorName}
                                  </span>
                                </div>
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-primary-400 resize-none dark:text-neutral-100"
                                  rows={3}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleEditSubmit();
                                    }
                                    if (e.key === 'Escape') {
                                      handleEditCancel();
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    onClick={handleEditCancel}
                                    className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                  <button
                                    onClick={handleEditSubmit}
                                    disabled={!editingContent.trim() || editMessageMutation.isPending}
                                    className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                                  >
                                    {t('common.save')}
                                  </button>
                                  <span className="text-[10px] text-neutral-400">
                                    Enter - {t('common.save')}, Esc - {t('common.cancel')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <MessageBubble
                            message={message}
                            onReply={(msgId) => {
                              const msg = currentMessages.find((m) => m.id === msgId);
                              if (msg) setReplyToMessage(msg);
                            }}
                            onReact={handleReact}
                            onPin={handlePin}
                            onFavorite={handleFavorite}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            onForward={(msgId) => {
                              const msg = currentMessages.find((m) => m.id === msgId);
                              if (msg) {
                                setForwardMessage(msg);
                                setShowForwardModal(true);
                              }
                            }}
                          />
                        )}

                        {/* Emoji picker for this message */}
                        {emojiPickerMessageId === message.id && (
                          <div className="absolute right-4 top-0 z-30">
                            <EmojiPicker
                              onSelect={handleEmojiSelect}
                              onClose={() => setEmojiPickerMessageId(null)}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Typing indicator */}
              <TypingIndicator typingUsers={[]} />

              {/* Reply quote bar */}
              {replyToMessage && (
                <ReplyQuote
                  message={replyToMessage}
                  onCancel={() => setReplyToMessage(null)}
                />
              )}

              {/* Message input with voice recorder */}
              <div className="flex items-end gap-1 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex-1">
                  <MessageInput
                    onSend={replyToMessage ? handleReplyWithQuote : handleSendMessage}
                    onSendWithFile={handleSendWithFile}
                    uploading={fileUploading}
                    placeholder={
                      activeChannel.type === 'direct'
                        ? t('messaging.messageTo', { user: channelDisplayName(activeChannel) })
                        : t('messaging.messageInChannel', { channel: activeChannel.name })
                    }
                  />
                </div>
                <div className="flex-shrink-0 pb-2 pr-2">
                  <VoiceRecorder onSend={handleVoiceSend} disabled={fileUploading} />
                </div>
              </div>
            </DropZone>
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
                ? channelDisplayName(activeChannel)
                : `# ${activeChannel.name}`}
            </h4>
            {activeChannel.description && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">{activeChannel.description}</p>
            )}
          </div>

          {/* (F) Members -- actual member count & data */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('messaging.membersLabel', { count: String(activeChannel.memberCount) })}
              </span>
              {activeChannel.type !== 'direct' && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                >
                  + {t('messaging.addMemberBtn')}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {channelMembers.map((member) => (
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

          {/* (G) Pinned messages -- actual data */}
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 mb-3">
              <Pin size={12} className="text-neutral-400" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('messaging.pinnedMessages')}
              </span>
            </div>
            {pinnedMessages.length === 0 ? (
              <p className="text-xs text-neutral-400">{t('messaging.noPinnedMessages')}</p>
            ) : (
              pinnedMessages.map((msg) => (
                <div key={msg.id} className="p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30 rounded-lg mb-2">
                  <p className="text-xs text-neutral-700 dark:text-neutral-300">{msg.content}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {msg.authorName} — {formatRelativeTime(msg.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* (H) Shared files -- actual attachments from messages */}
          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 mb-3">
              <FileText size={12} className="text-neutral-400" />
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {t('messaging.files')}
              </span>
            </div>
            {sharedFiles.length === 0 ? (
              <p className="text-xs text-neutral-400">{t('messaging.noFiles')}</p>
            ) : (
              <div className="space-y-1.5">
                {sharedFiles.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <FileText size={14} className="text-neutral-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{file.fileName}</p>
                      <p className="text-[10px] text-neutral-400">
                        {t('messaging.fileSizeKb', { size: String(Math.round(file.fileSize / 1024)) })}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation dialog (D) */}
      <ConfirmDialog
        open={Boolean(deleteMessageId)}
        onClose={() => setDeleteMessageId(null)}
        onConfirm={handleDeleteConfirm}
        title={t('messaging.deleteMessageConfirmTitle')}
        description={t('messaging.deleteMessageConfirmDesc')}
        confirmLabel={t('common.delete')}
        confirmVariant="danger"
        loading={deleteMessageMutation.isPending}
      />

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
                  memberIds: selectedMemberIds,
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
          <FormField label={t('messaging.addMembers')}>
            <Input
              placeholder={t('messaging.searchUsers')}
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />
            {selectedMemberIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedMemberIds.map((uid) => {
                  const u = orgUsers.find((ou) => ou.id === uid);
                  return (
                    <span key={uid} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                      {u?.fullName || uid.slice(0, 8)}
                      <button onClick={() => setSelectedMemberIds(prev => prev.filter(id => id !== uid))} className="hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="max-h-32 overflow-y-auto mt-2 border border-neutral-200 dark:border-neutral-700 rounded-lg">
              {orgUsers
                .filter((u) => !selectedMemberIds.includes(u.id))
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedMemberIds(prev => [...prev, u.id])}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left"
                  >
                    <span className="text-neutral-700 dark:text-neutral-300">{u.fullName}</span>
                    <span className="text-xs text-neutral-400">{u.email}</span>
                  </button>
                ))}
            </div>
          </FormField>
        </div>
      </Modal>

      {/* Add member to existing channel modal */}
      <Modal
        open={showAddMember}
        onClose={() => { setShowAddMember(false); setAddMemberSearch(''); }}
        title={t('messaging.addMemberBtn')}
        size="sm"
      >
        <div className="space-y-3">
          <Input
            placeholder={t('messaging.searchUsers')}
            value={addMemberSearch}
            onChange={(e) => setAddMemberSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg">
            {addMemberUsers
              .filter((u) => !channelMembers.some((m) => m.userId === u.id))
              .map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    if (!activeChannelId) return;
                    addMemberMutation.mutate({ channelId: activeChannelId, userId: u.id });
                  }}
                  disabled={addMemberMutation.isPending}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left"
                >
                  <AssigneeAvatar name={u.fullName} size="xs" />
                  <div className="flex-1 min-w-0">
                    <span className="text-neutral-700 dark:text-neutral-300">{u.fullName}</span>
                    <span className="text-xs text-neutral-400 ml-2">{u.email}</span>
                  </div>
                  {u.isOnline && (
                    <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            {addMemberUsers.filter((u) => !channelMembers.some((m) => m.userId === u.id)).length === 0 && (
              <p className="text-xs text-neutral-400 p-3 text-center">{t('messaging.noUsersToAdd')}</p>
            )}
          </div>
        </div>
      </Modal>
      {/* Forward message modal */}
      <ForwardModal
        open={showForwardModal}
        onClose={() => { setShowForwardModal(false); setForwardMessage(null); }}
        message={forwardMessage}
        channels={channels}
        currentChannelId={activeChannelId}
        onForward={handleForward}
      />

      {/* Image lightbox */}
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {/* Call Dialog */}
      {callDialogMode && activeCallSession && user && (
        <CallDialog
          callSession={activeCallSession}
          userId={user.id}
          userName={user.fullName ?? user.email}
          mode={callDialogMode}
          onClose={() => {
            setCallDialogMode(null);
            setActiveCallSession(null);
            setActiveCallId(null);
          }}
          onAccept={async () => {
            if (!activeCallSession || !user) return;
            try {
              const updated = await callsApi.join(activeCallSession.id, {
                userId: user.id,
                userName: user.fullName ?? user.email,
                videoEnabled: activeCallSession.callType === 'VIDEO',
              });
              setActiveCallSession(updated);
              setCallDialogMode('active');
            } catch {
              toast.error(t('common.operationError'));
            }
          }}
          onDecline={async () => {
            setCallDialogMode(null);
            setActiveCallSession(null);
            setActiveCallId(null);
          }}
          onCallEnded={() => {
            setCallDialogMode('ended');
          }}
        />
      )}
    </div>
  );
};

export default MessagingPage;
