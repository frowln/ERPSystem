import { expect, test } from '@playwright/test';

interface RuntimePerfSnapshot {
  domContentLoadedMs: number;
  loadEventMs: number;
  responseStartMs: number;
  transferKb: number;
  resourceCount: number;
}

const criticalRoutes = [
  '/',
  '/projects',
  '/operations/work-orders/1',
  '/mobile/dashboard',
];

test.describe('Runtime health and perf baseline', () => {
  for (const route of criticalRoutes) {
    test(`captures baseline metrics for ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.ok()).toBeTruthy();

      const metrics = await page.evaluate<RuntimePerfSnapshot>(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const transferBytes = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);

        return {
          domContentLoadedMs: nav?.domContentLoadedEventEnd ?? -1,
          loadEventMs: nav?.loadEventEnd ?? -1,
          responseStartMs: nav?.responseStart ?? -1,
          transferKb: Math.round((transferBytes / 1024) * 100) / 100,
          resourceCount: resources.length,
        };
      });

      // Smoke-level thresholds for dev runtime: broad enough to avoid flaky CI, strict enough to catch major regressions.
      expect(metrics.domContentLoadedMs).toBeGreaterThan(0);
      expect(metrics.loadEventMs).toBeGreaterThan(0);
      expect(metrics.responseStartMs).toBeGreaterThan(0);
      expect(metrics.domContentLoadedMs).toBeLessThan(12_000);
      expect(metrics.loadEventMs).toBeLessThan(20_000);
      expect(metrics.transferKb).toBeLessThan(25_000);
      expect(metrics.resourceCount).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'runtime-perf',
        description: `${route}: dcl=${metrics.domContentLoadedMs}ms, load=${metrics.loadEventMs}ms, ttfb=${metrics.responseStartMs}ms, transfer=${metrics.transferKb}KB, resources=${metrics.resourceCount}`,
      });
    });
  }
});
