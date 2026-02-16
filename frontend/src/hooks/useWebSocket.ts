import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  wsClient,
  type Subscription,
  type WebSocketMessage,
} from '@/lib/websocket';
import { useNotificationStore } from '@/stores/notificationStore';

// ---------------------------------------------------------------------------
// useWebSocket  --  low-level hook to manage the connection lifecycle
// ---------------------------------------------------------------------------

/**
 * Manages the WebSocket connection lifetime.  Call once near the root of your
 * authenticated layout so that the connection is opened when the user logs in
 * and closed when they log out or leave.
 *
 * @param token  the current JWT access token (pass `null` / `undefined` when
 *               not yet authenticated)
 */
export function useWebSocket(token: string | null | undefined) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    wsClient.connect(token);

    // Listen for connection state changes instead of polling
    const unregister = wsClient.onConnectionChange((state) => {
      setConnected(state);
    });

    return () => {
      unregister();
      wsClient.disconnect();
      setConnected(false);
    };
  }, [token]);

  return { connected };
}

// ---------------------------------------------------------------------------
// useProjectNotifications  --  subscribe to a specific project
// ---------------------------------------------------------------------------

/**
 * Subscribes to real-time events for a given project and accumulates messages
 * in state.  Automatically unsubscribes when the component unmounts or the
 * project ID changes.
 *
 * @param projectId   UUID of the project to watch
 * @returns `{ messages, latestMessage, clearMessages }`
 */
export function useProjectNotifications(projectId: string | undefined | null) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [latestMessage, setLatestMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const sub: Subscription = wsClient.subscribeToProject(projectId, (msg) => {
      setLatestMessage(msg);
      setMessages((prev) => [msg, ...prev].slice(0, 100)); // keep last 100
    });

    return () => sub.unsubscribe();
  }, [projectId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLatestMessage(null);
  }, []);

  return { messages, latestMessage, clearMessages };
}

// ---------------------------------------------------------------------------
// useUserNotifications  --  subscribe to the current user's personal queue
// ---------------------------------------------------------------------------

/**
 * Subscribes to the authenticated user's personal notification queue.
 * Shows a toast for each incoming notification.
 *
 * @returns `{ notifications, latestNotification, unreadCount, markAllRead }`
 */
export function useUserNotifications() {
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const [latestNotification, setLatestNotification] = useState<WebSocketMessage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pushNotification = useNotificationStore((s) => s.pushNotification);

  useEffect(() => {
    const sub: Subscription = wsClient.subscribeToUser((msg) => {
      setLatestNotification(msg);
      setNotifications((prev) => [msg, ...prev].slice(0, 200));
      setUnreadCount((c) => c + 1);

      // Push into the global store so TopBar badge can read it
      pushNotification(msg);

      // Show a toast notification for the incoming message
      if (msg.type === 'SAFETY_ALERT') {
        toast.error(msg.title, { duration: 6000 });
      } else {
        toast(msg.title, {
          duration: 4000,
          icon: '\u{1F514}',
        });
      }
    });

    return () => sub.unsubscribe();
  }, [pushNotification]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { notifications, latestNotification, unreadCount, markAllRead };
}

// ---------------------------------------------------------------------------
// useBroadcastNotifications  --  subscribe to platform-wide broadcasts
// ---------------------------------------------------------------------------

/**
 * Subscribes to the global `/topic/broadcast` destination.
 */
export function useBroadcastNotifications() {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    const sub: Subscription = wsClient.subscribeToBroadcast((msg) => {
      setMessages((prev) => [msg, ...prev].slice(0, 50));

      // Show broadcast as a toast
      toast(msg.title, {
        duration: 5000,
        icon: '\u{1F4E2}',
      });
    });

    return () => sub.unsubscribe();
  }, []);

  return { messages };
}
