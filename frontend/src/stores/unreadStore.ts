import { create } from 'zustand';

interface UnreadState {
  messagingUnread: number;
  setMessagingUnread: (count: number) => void;
}

export const useUnreadStore = create<UnreadState>((set) => ({
  messagingUnread: 0,
  setMessagingUnread: (count) => set({ messagingUnread: count }),
}));
