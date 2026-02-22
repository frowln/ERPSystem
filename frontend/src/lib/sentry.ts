import * as Sentry from '@sentry/react';
import type { ErrorEvent } from '@sentry/core';

/**
 * Initialize Sentry error monitoring.
 * The DSN is provided via VITE_SENTRY_DSN environment variable.
 * When missing, Sentry silently becomes a no-op (safe for local dev).
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'development' | 'production'
    release: `privod-ui@${import.meta.env.VITE_APP_VERSION ?? '0.0.0'}`,

    // Sample 100% of errors, 10% of transactions
    sampleRate: 1.0,
    tracesSampleRate: 0.1,

    // Filter out noisy browser errors
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'Network Error',
      'AbortError',
      'ChunkLoadError',
    ],

    beforeSend(event: ErrorEvent) {
      // Strip PII from URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/token=[^&]+/, 'token=***');
      }
      return event;
    },
  });
}

export { Sentry };
