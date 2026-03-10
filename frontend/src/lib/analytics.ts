/**
 * Yandex Metrica analytics integration.
 *
 * Environment variable: VITE_YM_COUNTER_ID
 * Set this in .env or .env.production with your Yandex Metrica counter ID.
 * Example: VITE_YM_COUNTER_ID=12345678
 *
 * When the variable is not set, all functions are safe no-ops.
 */

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

const COUNTER_ID = import.meta.env.VITE_YM_COUNTER_ID
  ? Number(import.meta.env.VITE_YM_COUNTER_ID)
  : null;

/**
 * Dynamically insert the Yandex Metrica script tag.
 * Safe to call multiple times — will only inject once.
 * No-op when VITE_YM_COUNTER_ID is not configured.
 */
export function initAnalytics(): void {
  if (!COUNTER_ID) return;

  // Prevent double-injection
  if (document.getElementById('ym-script')) return;

  // Create ym() queue function so calls before script loads are buffered
  const ymQueue = Object.assign(
    function (...args: unknown[]) {
      ymQueue.a.push(args);
    },
    { a: [] as unknown[][], l: Date.now() },
  );
  window.ym = ymQueue;

  // Inject the Yandex Metrica tag.js script
  const script = document.createElement('script');
  script.id = 'ym-script';
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  // Initialize the counter
  window.ym(COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}

/**
 * Track a page view (SPA route change).
 */
export function trackPageView(url: string): void {
  if (!COUNTER_ID || !window.ym) return;
  window.ym(COUNTER_ID, 'hit', url);
}

/**
 * Track a custom event / goal.
 */
export function trackEvent(category: string, action: string, label?: string): void {
  if (!COUNTER_ID || !window.ym) return;
  window.ym(COUNTER_ID, 'reachGoal', action, { category, label });
}

/**
 * Send authenticated user parameters to Yandex Metrica.
 */
export function trackUser(userId: string): void {
  if (!COUNTER_ID || !window.ym) return;
  window.ym(COUNTER_ID, 'userParams', { UserID: userId });
}
