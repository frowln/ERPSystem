// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { useMessagingStore } from './messagingStore';
import type { Channel, Message, FavoriteMessage } from '@/api/messaging';

const mockChannel: Channel = {
  id: 'ch1',
  name: 'general',
  type: 'public',
  description: 'General channel',
  memberCount: 5,
  unreadCount: 0,
  createdAt: '2026-01-01T00:00:00',
};

const mockMessage: Message = {
  id: 'm1',
  channelId: 'ch1',
  authorId: 'u1',
  authorName: 'Test User',
  content: 'Hello world',
  createdAt: '2026-02-15T10:00:00',
  isEdited: false,
  isPinned: false,
  isFavorite: false,
  reactions: [],
  threadReplyCount: 0,
  attachments: [],
  isSystem: false,
};

describe('messagingStore', () => {
  beforeEach(() => {
    const { getState } = useMessagingStore;
    getState().setChannels([]);
    getState().setActiveChannelId(null);
    getState().setSearchQuery('');
    getState().setSearchResults([]);
    getState().setFavoriteMessages([]);
    getState().setActiveThreadMessageId(null);
    getState().setShowChannelInfo(false);
    getState().setChannelSearchQuery('');
  });

  // --- Channels ---
  it('sets and reads channels', () => {
    useMessagingStore.getState().setChannels([mockChannel]);
    expect(useMessagingStore.getState().channels).toEqual([mockChannel]);
  });

  it('sets active channel and clears thread', () => {
    useMessagingStore.getState().setActiveThreadMessageId('m1');
    useMessagingStore.getState().setActiveChannelId('ch1');
    const state = useMessagingStore.getState();
    expect(state.activeChannelId).toBe('ch1');
    expect(state.activeThreadMessageId).toBeNull();
  });

  // --- Messages ---
  it('sets messages for a channel', () => {
    useMessagingStore.getState().setMessages('ch1', [mockMessage]);
    expect(useMessagingStore.getState().messages['ch1']).toEqual([mockMessage]);
  });

  it('adds a message to a channel', () => {
    useMessagingStore.getState().setMessages('ch1', [mockMessage]);
    const newMsg: Message = { ...mockMessage, id: 'm2', content: 'Second' };
    useMessagingStore.getState().addMessage('ch1', newMsg);
    expect(useMessagingStore.getState().messages['ch1']).toHaveLength(2);
    expect(useMessagingStore.getState().messages['ch1']![1]!.id).toBe('m2');
  });

  it('adds a message to empty channel', () => {
    useMessagingStore.getState().addMessage('ch2', mockMessage);
    expect(useMessagingStore.getState().messages['ch2']).toHaveLength(1);
  });

  it('updates an existing message', () => {
    useMessagingStore.getState().setMessages('ch1', [mockMessage]);
    const updated: Message = { ...mockMessage, content: 'Updated', isEdited: true };
    useMessagingStore.getState().updateMessage('ch1', updated);
    expect(useMessagingStore.getState().messages['ch1']![0]!.content).toBe('Updated');
    expect(useMessagingStore.getState().messages['ch1']![0]!.isEdited).toBe(true);
  });

  it('update on nonexistent message does not add it', () => {
    useMessagingStore.getState().setMessages('ch1', [mockMessage]);
    const other: Message = { ...mockMessage, id: 'm99', content: 'Other' };
    useMessagingStore.getState().updateMessage('ch1', other);
    expect(useMessagingStore.getState().messages['ch1']).toHaveLength(1);
    expect(useMessagingStore.getState().messages['ch1']![0]!.id).toBe('m1');
  });

  // --- Unread ---
  it('sets and clears unread count', () => {
    useMessagingStore.getState().setUnreadCount('ch1', 5);
    expect(useMessagingStore.getState().unreadCounts['ch1']).toBe(5);
    useMessagingStore.getState().clearUnread('ch1');
    expect(useMessagingStore.getState().unreadCounts['ch1']).toBe(0);
  });

  // --- Favorites ---
  it('sets favorite messages', () => {
    const fav: FavoriteMessage = {
      id: 'f1',
      messageId: 'm1',
      message: mockMessage,
      channelName: 'general',
      createdAt: '2026-02-15T11:00:00',
    };
    useMessagingStore.getState().setFavoriteMessages([fav]);
    expect(useMessagingStore.getState().favoriteMessages).toHaveLength(1);
  });

  // --- Search ---
  it('sets search query and results', () => {
    useMessagingStore.getState().setSearchQuery('hello');
    expect(useMessagingStore.getState().searchQuery).toBe('hello');
    useMessagingStore.getState().setSearchResults([mockMessage]);
    expect(useMessagingStore.getState().searchResults).toHaveLength(1);
  });

  // --- User statuses ---
  it('sets user status', () => {
    useMessagingStore.getState().setUserStatus('u1', 'ONLINE');
    expect(useMessagingStore.getState().userStatuses['u1']).toBe('ONLINE');
    useMessagingStore.getState().setUserStatus('u1', 'AWAY');
    expect(useMessagingStore.getState().userStatuses['u1']).toBe('AWAY');
  });

  // --- Thread ---
  it('sets active thread message id', () => {
    useMessagingStore.getState().setActiveThreadMessageId('m1');
    expect(useMessagingStore.getState().activeThreadMessageId).toBe('m1');
  });

  // --- Channel info sidebar ---
  it('toggles channel info sidebar', () => {
    useMessagingStore.getState().setShowChannelInfo(true);
    expect(useMessagingStore.getState().showChannelInfo).toBe(true);
    useMessagingStore.getState().setShowChannelInfo(false);
    expect(useMessagingStore.getState().showChannelInfo).toBe(false);
  });

  // --- Channel search ---
  it('sets channel search query', () => {
    useMessagingStore.getState().setChannelSearchQuery('proj');
    expect(useMessagingStore.getState().channelSearchQuery).toBe('proj');
  });
});
