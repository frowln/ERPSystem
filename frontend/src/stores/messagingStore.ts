import { create } from 'zustand';
import type { Channel, Message, FavoriteMessage, UserStatus } from '@/api/messaging';

interface MessagingState {
  /* Channels */
  channels: Channel[];
  setChannels: (channels: Channel[]) => void;
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;

  /* Messages */
  messages: Record<string, Message[]>; // keyed by channelId
  setMessages: (channelId: string, messages: Message[]) => void;
  addMessage: (channelId: string, message: Message) => void;
  updateMessage: (channelId: string, message: Message) => void;

  /* Unread */
  unreadCounts: Record<string, number>; // keyed by channelId
  setUnreadCount: (channelId: string, count: number) => void;
  clearUnread: (channelId: string) => void;

  /* Favorites */
  favoriteMessages: FavoriteMessage[];
  setFavoriteMessages: (favorites: FavoriteMessage[]) => void;

  /* Search */
  searchResults: Message[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Message[]) => void;

  /* User statuses */
  userStatuses: Record<string, UserStatus>; // keyed by userId
  setUserStatus: (userId: string, status: UserStatus) => void;

  /* Thread */
  activeThreadMessageId: string | null;
  setActiveThreadMessageId: (id: string | null) => void;

  /* Right sidebar */
  showChannelInfo: boolean;
  setShowChannelInfo: (show: boolean) => void;

  /* Channel search */
  channelSearchQuery: string;
  setChannelSearchQuery: (query: string) => void;
}

export const useMessagingStore = create<MessagingState>((set) => ({
  channels: [],
  setChannels: (channels) => set({ channels }),
  activeChannelId: null,
  setActiveChannelId: (id) => set({ activeChannelId: id, activeThreadMessageId: null }),

  messages: {},
  setMessages: (channelId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [channelId]: messages },
    })),
  addMessage: (channelId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] ?? []), message],
      },
    })),
  updateMessage: (channelId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] ?? []).map((m) =>
          m.id === message.id ? message : m,
        ),
      },
    })),

  unreadCounts: {},
  setUnreadCount: (channelId, count) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [channelId]: count },
    })),
  clearUnread: (channelId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [channelId]: 0 },
    })),

  favoriteMessages: [],
  setFavoriteMessages: (favorites) => set({ favoriteMessages: favorites }),

  searchResults: [],
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),

  userStatuses: {},
  setUserStatus: (userId, status) =>
    set((state) => ({
      userStatuses: { ...state.userStatuses, [userId]: status },
    })),

  activeThreadMessageId: null,
  setActiveThreadMessageId: (id) => set({ activeThreadMessageId: id }),

  showChannelInfo: false,
  setShowChannelInfo: (show) => set({ showChannelInfo: show }),

  channelSearchQuery: '',
  setChannelSearchQuery: (query) => set({ channelSearchQuery: query }),
}));
