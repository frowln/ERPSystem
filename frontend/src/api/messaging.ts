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
  otherUserName?: string;
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
  reactions: [],
  threadReplyCount: message.replyCount ?? 0,
  parentMessageId: message.parentMessageId,
  attachments: message.attachmentUrl
    ? [{
        id: `${message.id}-att`,
        fileName: message.attachmentName ?? 'attachment',
        fileSize: message.attachmentSize ?? 0,
        mimeType: message.attachmentType ?? 'application/octet-stream',
        url: message.attachmentUrl,
      }]
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

export interface FavoriteMessage {
  id: string;
  messageId: string;
  message: Message;
  channelName: string;
  note?: string;
  createdAt: string;
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
}

/* ─── API ─── */

export const messagingApi = {
  getChannels: async (): Promise<Channel[]> => {
    const response = await apiClient.get<BackendChannel[]>('/messaging/channels');
    return response.data.map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: mapChannelType(channel.channelType),
      description: channel.description,
      memberCount: channel.memberCount ?? 0,
      unreadCount: 0,
      createdAt: channel.createdAt,
      avatarUrl: channel.avatarUrl,
    }));
  },

  createChannel: async (data: CreateChannelRequest): Promise<Channel> => {
    const response = await apiClient.post<BackendChannel>('/messaging/channels', {
      name: data.name,
      description: data.description,
      channelType: data.channelType.toUpperCase(),
      memberIds: data.memberIds,
    });
    return {
      id: response.data.id,
      name: response.data.name,
      type: mapChannelType(response.data.channelType),
      description: response.data.description,
      memberCount: response.data.memberCount ?? 0,
      unreadCount: 0,
      createdAt: response.data.createdAt,
      avatarUrl: response.data.avatarUrl,
    };
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
      channelName: fav.channelName ?? '# неизвестный-канал',
      note: fav.note,
      createdAt: fav.createdAt,
      message: mapBackendMessage(fav.message),
    };
  },

  removeFromFavorites: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messaging/messages/${messageId}/favorite`);
  },

  getMyFavorites: async (): Promise<FavoriteMessage[]> => {
    const response = await apiClient.get<BackendFavoriteMessage[]>('/messaging/favorites');
    return response.data.map((fav) => ({
      id: fav.id,
      messageId: fav.messageId,
      channelName: fav.channelName ?? '# неизвестный-канал',
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

  setUserStatus: async (status: UserStatus): Promise<void> => {
    await apiClient.patch('/messaging/me/status', { status });
  },
};
