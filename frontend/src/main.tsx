import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { initSentry } from './lib/sentry';
import { App } from './App';
import './styles/globals.css';

// Initialize Sentry before rendering (no-op when VITE_SENTRY_DSN is not set)
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

function registerServiceWorkerProd(): void {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Apply waiting update immediately to avoid mixed old/new bundles.
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('Failed to register service worker:', error);
        }
      });
  });
}

async function cleanupServiceWorkerDev(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheKeys = await caches.keys();
    const appCachePrefixes = ['privod-app-shell-', 'privod-api-cache-'];
    await Promise.all(
      cacheKeys
        .filter((key) => appCachePrefixes.some((prefix) => key.startsWith(prefix)))
        .map((key) => caches.delete(key)),
    );
  }
}

// Service worker handling:
// - PROD: register and auto-activate updates to prevent stale chunks/404s.
// - DEV: remove previously installed SW/caches so local development is deterministic.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    registerServiceWorkerProd();
  } else {
    window.addEventListener('load', () => {
      void cleanupServiceWorkerDev();
    });
  }
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              fontSize: '14px',
              borderRadius: '10px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
