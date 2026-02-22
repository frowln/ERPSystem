import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OfflineRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
  description: string;
}

interface OfflineQueueState {
  queue: OfflineRequest[];
  isOnline: boolean;
  pendingSync: boolean;
  addRequest: (request: Omit<OfflineRequest, 'id' | 'timestamp'>) => void;
  removeRequest: (id: string) => void;
  clearQueue: () => void;
  setOnline: (online: boolean) => void;
  triggerSync: () => void;
  replayManually: () => Promise<void>;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingSync: false,

      addRequest: (request) => {
        const item: OfflineRequest = {
          ...request,
          id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
        };

        set((state) => ({ queue: [...state.queue, item] }));

        // Forward to service worker for Background Sync API
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'QUEUE_REQUEST',
            payload: item,
          });
        }
      },

      removeRequest: (id) => {
        set((state) => ({ queue: state.queue.filter((r) => r.id !== id) }));
      },

      clearQueue: () => set({ queue: [] }),

      setOnline: (online) => {
        set({ isOnline: online });
        if (online && get().queue.length > 0) {
          get().triggerSync();
        }
      },

      triggerSync: () => {
        if (!('serviceWorker' in navigator)) return;
        set({ pendingSync: true });

        navigator.serviceWorker.ready
          .then((reg) => {
            // Background Sync API (not universally supported)
            if ('sync' in reg) {
              return (
                reg as ServiceWorkerRegistration & {
                  sync: { register: (tag: string) => Promise<void> };
                }
              ).sync.register('offline-mutations');
            }
            // Fall back to manual replay
            return get().replayManually();
          })
          .catch(() => get().replayManually())
          .finally(() => set({ pendingSync: false }));
      },

      replayManually: async () => {
        const items = [...get().queue];
        for (const item of items) {
          try {
            const response = await fetch(item.url, {
              method: item.method,
              headers: item.headers,
              body: item.body,
            });
            if (response.ok) {
              get().removeRequest(item.id);
            }
          } catch {
            // Retry on next sync
          }
        }
      },
    }),
    {
      name: 'privod-offline-queue',
      partialize: (state) => ({ queue: state.queue }),
    },
  ),
);

// Bind global online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineQueue.getState().setOnline(true);
  });
  window.addEventListener('offline', () => {
    useOfflineQueue.getState().setOnline(false);
  });

  // Handle sync success messages posted by the service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_SUCCESS') {
        useOfflineQueue.getState().removeRequest(event.data.requestId);
      }
    });
  }
}
