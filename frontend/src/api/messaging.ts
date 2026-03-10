import { apiClient } from './client';

/* ─── Types ─── */

export type ChannelType = 'public' | 'private' | 'direct';
export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
  memberCount: number;
  unreadCount: number;
  lastMessage?: MessagePreview;
  createdAt: string;
  avatarUrl?: string;
  /** For DMs: the other user */
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatarUrl?: string;
  otherUserStatus?: UserStatus;
}

export interface MessagePreview {
  content: string;
  authorName: string;
  createdAt: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userNames: string[];
  includesMe: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  isPinned: boolean;
  isFavorite: boolean;
  reactions: MessageReaction[];
  threadReplyCount: number;
  threadLastReplyAt?: string;
  parentMessageId?: string;
  attachments: MessageAttachment[];
  isSystem: boolean;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  /** If present, the attachment can be downloaded via getAttachmentDownloadUrl(attachmentId) */
  attachmentId?: string;
}

interface BackendMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  messageType?: string;
  parentMessageId?: string;
  isEdited?: boolean;
  isPinned?: boolean;
  reactionCount?: number;
  replyCount?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    userNames: string[];
    includesMe: boolean;
  }>;
  createdAt: string;
  updatedAt?: string;
}

interface BackendFavoriteMessage {
  id: string;
  messageId: string;
  note?: string;
  createdAt: string;
  channelName?: string;
  message: BackendMessage;
}

interface BackendChannel {
  id: string;
  name: string;
  description?: string;
  channelType: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
  memberCount?: number;
  createdAt: string;
  avatarUrl?: string;
  // DM-specific
  otherUserId?: string;
  otherUserName?: string;
  otherUserAvatarUrl?: string;
}

const mapBackendMessage = (message: BackendMessage): Message => ({
  id: message.id,
  channelId: message.channelId,
  authorId: message.authorId,
  authorName: message.authorName,
  authorAvatarUrl: message.authorAvatarUrl,
  content: message.content,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  isEdited: Boolean(message.isEdited),
  isPinned: Boolean(message.isPinned),
  isFavorite: false,
  reactions: (message.reactions ?? []).map(r => ({
    emoji: r.emoji,
    count: r.count,
    userNames: r.userNames,
    includesMe: r.includesMe,
  })),
  threadReplyCount: message.replyCount ?? 0,
  parentMessageId: message.parentMessageId,
  attachments: message.attachmentUrl
    ? [(() => {
        const raw = message.attachmentUrl!;
        const isAttRef = raw.startsWith('att:');
        const attId = isAttRef ? raw.slice(4) : undefined;
        return {
          id: attId ?? `${message.id}-att`,
          fileName: message.attachmentName ?? 'attachment',
          fileSize: message.attachmentSize ?? 0,
          mimeType: message.attachmentType ?? 'application/octet-stream',
          url: isAttRef ? '' : raw,
          attachmentId: attId,
        };
      })()]
    : [],
  isSystem: (message.messageType ?? '').toUpperCase() === 'SYSTEM',
});

const mapChannelType = (channelType: BackendChannel['channelType']): ChannelType => {
  switch (channelType) {
    case 'PRIVATE':
      return 'private';
    case 'DIRECT':
      return 'direct';
    case 'PUBLIC':
    default:
      return 'public';
  }
};

const mapBackendChannel = (channel: BackendChannel): Channel => ({
  id: channel.id,
  name: channel.name,
  type: mapChannelType(channel.channelType),
  description: channel.description,
  memberCount: channel.memberCount ?? 0,
  unreadCount: 0,
  createdAt: channel.createdAt,
  avatarUrl: channel.avatarUrl,
  otherUserId: channel.otherUserId,
  otherUserName: channel.otherUserName,
  otherUserAvatarUrl: channel.otherUserAvatarUrl,
});

export interface FavoriteMessage {
  id: string;
  messageId: string;
  message: Message;
  channelName: string;
  note?: string;
  createdAt: string;
}

export interface ChannelMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  status: UserStatus;
}

interface BackendChannelMember {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  role: string;
  roleDisplayName?: string;
  isMuted?: boolean;
  lastReadAt?: string;
  unreadCount?: number;
  joinedAt?: string;
  availabilityStatus?: string;
}

export interface OrgUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export interface CreateChannelRequest {
  name: string;
  channelType: ChannelType;
  description?: string;
  memberIds?: string[];
}

export type MessageType = 'TEXT' | 'SYSTEM' | 'FILE' | 'IMAGE' | 'VOICE';

export interface SendMessageRequest {
  content: string;
  messageType?: MessageType;
  parentMessageId?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  /** Frontend-only: not sent to backend, used to construct att: reference */
  _attachmentId?: string;
}

/* ─── File attachment helpers ─── */

export interface FileAttachmentResponse {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  storagePath: string;
  description?: string;
  uploadedBy?: string;
  createdAt: string;
  downloadUrl?: string;
}

/* ─── API ─── */

export const messagingApi = {
  getChannels: async (): Promise<Channel[]> => {
    const response = await apiClient.get<BackendChannel[]>('/messaging/channels');
    return response.data.map(mapBackendChannel);
  },

  createChannel: async (data: CreateChannelRequest): Promise<Channel> => {
    const response = await apiClient.post<BackendChannel>('/messaging/channels', {
      name: data.name,
      description: data.description,
      channelType: data.channelType.toUpperCase(),
      memberIds: data.memberIds,
    });
    return mapBackendChannel(response.data);
  },

  getChannelMessages: async (
    channelId: string,
    params?: { before?: string; limit?: number },
  ): Promise<Message[]> => {
    const response = await apiClient.get<BackendMessage[]>(
      `/messaging/channels/${channelId}/messages`,
      { params },
    );
    return response.data.map(mapBackendMessage);
  },

  getThreadReplies: async (parentMessageId: string): Promise<Message[]> => {
    const response = await apiClient.get<BackendMessage[]>(
      `/messaging/messages/${parentMessageId}/replies`,
    );
    return response.data.map(mapBackendMessage);
  },

  sendMessage: async (channelId: string, data: SendMessageRequest): Promise<Message> => {
    const response = await apiClient.post<BackendMessage>(
      `/messaging/channels/${channelId}/messages`,
      data,
    );
    return mapBackendMessage(response.data);
  },

  editMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await apiClient.patch<BackendMessage>(
      `/messaging/messages/${messageId}`,
      { content },
    );
    return mapBackendMessage(response.data);
  },

  addReaction: async (messageId: string, emoji: string): Promise<void> => {
    await apiClient.post(`/messaging/messages/${messageId}/reactions`, { emoji });
  },

  removeReaction: async (messageId: string, emoji: string): Promise<void> => {
    await apiClient.delete(`/messaging/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  },

  pinMessage: async (messageId: string): Promise<void> => {
    await apiClient.post(`/messaging/messages/${messageId}/pin`);
  },

  addToFavorites: async (messageId: string, note?: string): Promise<FavoriteMessage> => {
    const response = await apiClient.post<BackendFavoriteMessage>(
      `/messaging/messages/${messageId}/favorite`,
      { note },
    );
    const fav = response.data;
    return {
      id: fav.id,
      messageId: fav.messageId,
      channelName: fav.channelName ?? '',
      note: fav.note,
      createdAt: fav.createdAt,
      message: mapBackendMessage(fav.message),
    };
  },

  removeFromFavorites: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messaging/messages/${messageId}/favorite`);
  },

  updateFavoriteNote: async (messageId: string, note: string): Promise<void> => {
    await apiClient.patch(`/messaging/favorites/${messageId}/note`, { note });
  },

  getMyFavorites: async (): Promise<FavoriteMessage[]> => {
    const response = await apiClient.get<BackendFavoriteMessage[]>('/messaging/favorites');
    return response.data.map((fav) => ({
      id: fav.id,
      messageId: fav.messageId,
      channelName: fav.channelName ?? '',
      note: fav.note,
      createdAt: fav.createdAt,
      message: mapBackendMessage(fav.message),
    }));
  },

  searchMessages: async (query: string): Promise<Message[]> => {
    const response = await apiClient.get<BackendMessage[]>('/messaging/search', {
      params: { q: query },
    });
    return response.data.map(mapBackendMessage);
  },

  getUserStatus: async (userId: string): Promise<{ userId: string; status: UserStatus }> => {
    const response = await apiClient.get<{ userId: string; status: UserStatus }>(
      `/messaging/users/${userId}/status`,
    );
    return response.data;
  },

  setUserStatus: async (status: string): Promise<void> => {
    await apiClient.patch('/messaging/me/status', { status }, { _silentErrors: true } as never);
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messaging/messages/${messageId}`);
  },

  unpinMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messaging/messages/${messageId}/pin`);
  },

  getChannelMembers: async (channelId: string): Promise<ChannelMember[]> => {
    const response = await apiClient.get<BackendChannelMember[]>(
      `/messaging/channels/${channelId}/members`,
    );
    return response.data.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.userName,
      role: m.roleDisplayName ?? m.role,
      status: (m.availabilityStatus as UserStatus) ?? 'OFFLINE',
    }));
  },

  addChannelMember: async (channelId: string, userId: string): Promise<ChannelMember> => {
    const response = await apiClient.post<BackendChannelMember>(
      `/messaging/channels/${channelId}/members`,
      { userId },
    );
    const m = response.data;
    return {
      id: m.id,
      userId: m.userId,
      name: m.userName,
      role: m.roleDisplayName ?? m.role,
      status: (m.availabilityStatus as UserStatus) ?? 'OFFLINE',
    };
  },

  getPinnedMessages: async (channelId: string): Promise<Message[]> => {
    const response = await apiClient.get<BackendMessage[]>(
      `/messaging/channels/${channelId}/pinned`,
    );
    return response.data.map(mapBackendMessage);
  },

  getOrganizationUsers: async (search?: string): Promise<OrgUser[]> => {
    const response = await apiClient.get<OrgUser[]>('/messaging/users', {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  createDirectChannel: async (userId: string): Promise<Channel> => {
    const response = await apiClient.post<BackendChannel>('/messaging/channels', {
      name: 'DM',
      channelType: 'DIRECT',
      memberIds: [userId],
    });
    return mapBackendChannel(response.data);
  },

  uploadAttachment: async (file: File, channelId: string): Promise<FileAttachmentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'channel_message');
    formData.append('entityId', channelId);
    const response = await apiClient.post<FileAttachmentResponse>('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAttachmentDownloadUrl: async (attachmentId: string): Promise<string> => {
    const response = await apiClient.get<string>(`/attachments/${attachmentId}/download-url`);
    return response.data;
  },
};
