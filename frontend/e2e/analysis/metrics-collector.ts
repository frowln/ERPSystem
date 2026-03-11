/**
 * Performance metrics collector for E2E tests.
 *
 * Usage in tests:
 *   import { measurePageLoad, measureInteraction, collectWebVitals } from '../analysis/metrics-collector';
 *   const loadTime = await measurePageLoad(page, '/projects');
 *   const lcp = await collectWebVitals(page);
 */
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/* ───────────────────── Types ───────────────────── */

export interface PageLoadMetric {
  url: string;
  timestamp: string;
  durationMs: number;
  domContentLoaded?: number;
  loadEvent?: number;
}

export interface InteractionMetric {
  url: string;
  action: string;
  timestamp: string;
  durationMs: number;
}

export interface WebVitals {
  url: string;
  timestamp: string;
  lcp?: number; // Largest Contentful Paint (ms)
  cls?: number; // Cumulative Layout Shift (score)
}

interface PerformanceReport {
  pageLoads: PageLoadMetric[];
  interactions: InteractionMetric[];
  webVitals: WebVitals[];
}

/* ────────────── Report file path ──────────────── */

const REPORTS_DIR = path.resolve(__dirname, '../reports');
const METRICS_FILE = path.join(REPORTS_DIR, 'performance-metrics.json');

function ensureReportsDir(): void {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function readExistingReport(): PerformanceReport {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      const raw = fs.readFileSync(METRICS_FILE, 'utf-8');
      return JSON.parse(raw) as PerformanceReport;
    }
  } catch {
    // Corrupted file — start fresh
  }
  return { pageLoads: [], interactions: [], webVitals: [] };
}

function appendMetric<K extends keyof PerformanceReport>(
  key: K,
  entry: PerformanceReport[K][number],
): void {
  ensureReportsDir();
  const report = readExistingReport();
  (report[key] as PerformanceReport[K][number][]).push(entry);
  fs.writeFileSync(METRICS_FILE, JSON.stringify(report, null, 2), 'utf-8');
}

/* ───────────── measurePageLoad ─────────────────── */

/**
 * Navigate to `url` and measure time until `networkidle`.
 * Also captures Navigation Timing API metrics (domContentLoaded, loadEvent).
 */
export async function measurePageLoad(
  page: Page,
  url: string,
): Promise<PageLoadMetric> {
  const start = Date.now();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  const durationMs = Date.now() - start;

  // Extract Navigation Timing data
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return null;
    return {
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      loadEvent: Math.round(nav.loadEventEnd - nav.startTime),
    };
  });

  const metric: PageLoadMetric = {
    url,
    timestamp: new Date().toISOString(),
    durationMs,
    domContentLoaded: timing?.domContentLoaded,
    loadEvent: timing?.loadEvent,
  };

  appendMetric('pageLoads', metric);
  return metric;
}

/* ───────────── measureInteraction ──────────────── */

/**
 * Run an arbitrary async `action` (e.g. click, fill) and measure how long
 * it takes until the page settles (next network response or idle).
 */
export async function measureInteraction(
  page: Page,
  actionName: string,
  action: () => Promise<void>,
): Promise<InteractionMetric> {
  const url = page.url();
  const start = Date.now();

  await action();

  // Wait for network to settle (up to 5s)
  try {
    await page.waitForLoadState('networkidle', { timeout: 5_000 });
  } catch {
    // Timeout is OK — some interactions don't trigger network
  }

  const durationMs = Date.now() - start;

  const metric: InteractionMetric = {
    url,
    action: actionName,
    timestamp: new Date().toISOString(),
    durationMs,
  };

  appendMetric('interactions', metric);
  return metric;
}

/* ───────────── collectWebVitals ────────────────── */

/**
 * Inject PerformanceObserver to collect LCP and CLS.
 * Must be called AFTER page has loaded content.
 * Waits up to 5s for LCP entry.
 */
export async function collectWebVitals(page: Page): Promise<WebVitals> {
  const url = page.url();

  const vitals = await page.evaluate(() => {
    return new Promise<{ lcp?: number; cls?: number }>((resolve) => {
      let lcp: number | undefined;
      let cls = 0;

      // LCP observer
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            lcp = entries[entries.length - 1].startTime;
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // Not supported in this browser context
      }

      // CLS observer
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // LayoutShift entries have a `value` property
            if ('value' in entry && !(entry as any).hadRecentInput) {
              cls += (entry as any).value as number;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch {
        // Not supported
      }

      // Give observers time to collect (buffered entries arrive quickly)
      setTimeout(() => {
        resolve({ lcp: lcp ? Math.round(lcp) : undefined, cls: Math.round(cls * 1000) / 1000 });
      }, 3000);
    });
  });

  const metric: WebVitals = {
    url,
    timestamp: new Date().toISOString(),
    lcp: vitals.lcp,
    cls: vitals.cls,
  };

  appendMetric('webVitals', metric);
  return metric;
}
