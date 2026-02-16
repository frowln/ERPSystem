import { create } from 'zustand';
import type { WebSocketMessage } from '@/lib/websocket';

interface NotificationState {
  /** Number of unread real-time notifications since last reset. */
  unreadCount: number;
  /** Recent notifications received via WebSocket (most recent first). */
  recentNotifications: WebSocketMessage[];
  /** Push a new notification (called by the WebSocket subscription). */
  pushNotification: (msg: WebSocketMessage) => void;
  /** Mark all as read (resets unread count). */
  markAllRead: () => void;
  /** Reset the store (e.g. on logout). */
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  recentNotifications: [],

  pushNotification: (msg) =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
      recentNotifications: [msg, ...state.recentNotifications].slice(0, 200),
    })),

  markAllRead: () => set({ unreadCount: 0 }),

  reset: () => set({ unreadCount: 0, recentNotifications: [] }),
}));
