/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, Page } from '@playwright/test';

/**
 * Extended Playwright test with:
 * - Auto-login via storageState
 * - Performance timing (page load ms, interaction ms)
 * - Auto-screenshot on failure with descriptive names
 * - Console error collector (fails test if unexpected console.error)
 *
 * Note: eslint react-hooks/rules-of-hooks is disabled because Playwright's
 * fixture `use()` function is not a React hook.
 */

export interface PerformanceTiming {
  pageLoadMs: number;
  interactionMs: number;
}

/** Known noisy console errors to ignore (browser internals, dev-only, etc.) */
const IGNORED_ERRORS = [
  'Failed to load resource',
  'favicon.ico',
  'ResizeObserver loop',
  'net::ERR_',
  'Download the React DevTools',
  'Warning: ',
  'ChunkLoadError',
  'Loading chunk',
  'Hydration',
];

function shouldIgnoreError(text: string): boolean {
  return IGNORED_ERRORS.some((pattern) => text.includes(pattern));
}

type TestFixtures = {
  /** Page with console error tracking enabled */
  trackedPage: Page;
  /** Collected console errors during the test (shared with trackedPage) */
  consoleErrors: string[];
  /** Performance measurements collected during the test */
  perfTiming: PerformanceTiming;
};

/**
 * Shared error collector — the same array instance is used by both
 * `trackedPage` (which pushes errors) and `consoleErrors` (which exposes them).
 */
export const test = base.extend<TestFixtures>({
  // eslint-disable-next-line no-empty-pattern
  consoleErrors: async ({}, use) => {
    const errors: string[] = [];
    await use(errors);
  },

  trackedPage: async ({ page, consoleErrors }, use, testInfo) => {
    // Collect console errors into the shared array
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!shouldIgnoreError(text)) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(`PAGE_ERROR: ${err.message}`);
    });

    await use(page);

    // Auto-screenshot on failure with descriptive name
    if (testInfo.status !== testInfo.expectedStatus) {
      const safeName = testInfo.title
        .replace(/[^a-zA-Z0-9\u0400-\u04FF\-_]/g, '_')
        .slice(0, 80);
      await page
        .screenshot({
          path: testInfo.outputPath(`failure-${safeName}.png`),
          fullPage: true,
        })
        .catch(() => {
          /* page may have crashed */
        });
    }

    // Annotate test with console errors if any
    if (consoleErrors.length > 0) {
      testInfo.annotations.push({
        type: 'console-errors',
        description: consoleErrors.join(' | '),
      });
    }
  },

  // eslint-disable-next-line no-empty-pattern
  perfTiming: async ({}, use) => {
    const timing: PerformanceTiming = { pageLoadMs: 0, interactionMs: 0 };
    await use(timing);
  },
});

export { expect };

/**
 * Measure page load time (navigation start to networkidle).
 * Stores the result in the provided perfTiming object.
 */
export async function measurePageLoad(
  page: Page,
  url: string,
  perfTiming?: PerformanceTiming,
): Promise<number> {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  const elapsed = Date.now() - start;
  if (perfTiming) {
    perfTiming.pageLoadMs = elapsed;
  }
  return elapsed;
}

/**
 * Measure an interaction (click + wait for response).
 * Stores the result in the provided perfTiming object.
 */
export async function measureInteraction(
  page: Page,
  action: () => Promise<void>,
  perfTiming?: PerformanceTiming,
): Promise<number> {
  const start = Date.now();
  await action();
  const elapsed = Date.now() - start;
  if (perfTiming) {
    perfTiming.interactionMs = elapsed;
  }
  return elapsed;
}
