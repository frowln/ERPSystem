/// <reference lib="webworker" />

const CACHE_NAME = 'privod-app-shell-v5';
const API_CACHE_NAME = 'privod-api-cache-v2';
const OFFLINE_URL = '/offline.html';

// App-shell assets to pre-cache on install
const APP_SHELL = [
  OFFLINE_URL,
  '/favicon.svg',
  '/manifest.webmanifest',
];

// API base path for network-first caching
const API_PATH_PREFIX = '/api/';

// ---------------------------------------------------------------------------
// Install
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — clean up old caches
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event) => {
  const currentCaches = new Set([CACHE_NAME, API_CACHE_NAME]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !currentCaches.has(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch — cache-first for static, network-first for API, network-first for nav
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation requests -> network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the navigation response for offline use
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // API requests -> network-first with cache fallback
  if (url.pathname.startsWith(API_PATH_PREFIX)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            // Return a synthetic offline response for API calls
            return new Response(
              JSON.stringify({ error: 'offline', message: 'No network connection' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }),
        ),
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) -> cache-first with network fallback
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cached immediately but update cache in background (stale-while-revalidate)
          const networkFetch = fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          });
          // For hashed assets (/assets/...), no need to revalidate
          if (url.pathname.startsWith('/assets/')) {
            return cached;
          }
          // For non-hashed static assets, use stale-while-revalidate
          networkFetch.catch(() => { /* ignore network errors */ });
          return cached;
        }
        // Not in cache — fetch from network and cache it
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // All other requests — network only (no caching)
});

// ---------------------------------------------------------------------------
// Background Sync — replay offline mutations
// ---------------------------------------------------------------------------

self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-mutations') {
    event.waitUntil(replayQueuedRequests());
  }
});

/**
 * Replay queued requests stored by the main thread.
 * The main thread posts QUEUE_REQUEST messages with request payloads.
 */
const queuedRequests = [];

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'QUEUE_REQUEST') {
    queuedRequests.push(event.data.payload);

    // Attempt to register background sync if available
    if (self.registration.sync) {
      self.registration.sync.register('offline-mutations').catch(() => {
        // Background sync not available, will replay on next TRIGGER_SYNC
      });
    }
  }

  // Allow the main thread to trigger a manual sync
  if (event.data.type === 'TRIGGER_SYNC') {
    replayQueuedRequests().then(() => {
      notifyClients({ type: 'SYNC_COMPLETE' });
    });
  }

  // Skip waiting when the main thread requests it (e.g., after update)
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Clear API cache on demand (e.g., after logout)
  if (event.data.type === 'CLEAR_API_CACHE') {
    caches.delete(API_CACHE_NAME);
  }
});

async function replayQueuedRequests() {
  const items = [...queuedRequests];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (response.ok) {
        // Remove from local queue
        const idx = queuedRequests.indexOf(item);
        if (idx !== -1) queuedRequests.splice(idx, 1);

        // Notify clients
        notifyClients({
          type: 'SYNC_SUCCESS',
          requestId: item.id,
        });
      } else if (response.status === 409) {
        // Conflict — remove from queue and notify client
        const idx = queuedRequests.indexOf(item);
        if (idx !== -1) queuedRequests.splice(idx, 1);

        notifyClients({
          type: 'SYNC_CONFLICT',
          requestId: item.id,
          status: response.status,
        });
      }
      // Other errors: leave in queue for next sync attempt
    } catch {
      // Network still unavailable — leave in queue for next sync
    }
  }
}

// ---------------------------------------------------------------------------
// Push Notifications
// ---------------------------------------------------------------------------

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // Fallback for plain text payloads
    payload = {
      title: 'PRIVOD',
      body: event.data.text(),
    };
  }

  const title = payload.title || 'PRIVOD';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/favicon.svg',
    badge: payload.badge || '/favicon.svg',
    tag: payload.tag || 'privod-notification',
    data: payload.data || {},
    // Vibration pattern for mobile
    vibrate: [100, 50, 100],
    // Actions the user can take from the notification
    actions: payload.actions || [],
    // Require user interaction to dismiss
    requireInteraction: payload.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — open the relevant URL or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  // Handle action clicks
  if (event.action) {
    const actionUrl = event.notification.data?.actionUrls?.[event.action];
    if (actionUrl) {
      event.waitUntil(self.clients.openWindow(actionUrl));
      return;
    }
  }

  // Default: focus existing window or open new one
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing tab with the app
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // Open new window
        return self.clients.openWindow(url);
      }),
  );
});

// Handle notification close (for analytics if needed)
self.addEventListener('notificationclose', (_event) => {
  // Could send analytics event here
});

// ---------------------------------------------------------------------------
// Periodic cache cleanup
// ---------------------------------------------------------------------------

/**
 * Clean up stale API cache entries older than 24 hours.
 */
async function cleanupApiCache() {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = Date.now();

    for (const request of requests) {
      const response = await cache.match(request);
      if (!response) continue;

      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const cachedAt = new Date(dateHeader).getTime();
        if (now - cachedAt > maxAge) {
          await cache.delete(request);
        }
      }
    }
  } catch {
    // Cache cleanup is best-effort
  }
}

// Run cleanup periodically via the periodic background sync API (if available)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupApiCache());
  }
});

// ---------------------------------------------------------------------------
// Utility: notify all clients
// ---------------------------------------------------------------------------

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage(message);
  }
}
