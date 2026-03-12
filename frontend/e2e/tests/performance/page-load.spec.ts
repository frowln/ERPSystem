/**
 * Phase 1: Page Load Benchmarks — ALL navigation URLs.
 *
 * Measures:
 * - DOM ready time (domcontentloaded)
 * - Network idle time
 * - Fully loaded time (loaders/skeletons gone)
 * - Navigation timing API vitals (DNS, TCP, TTFB, DOM parsing)
 * - JS heap memory usage
 * - DOM node count
 *
 * SLA: every page must load < 5s (FAIL threshold).
 * Grades: A (<1s) / B (<2s) / C (<3s) / F (>5s)
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  ALL_NAV_URLS,
  PERF_THRESHOLDS,
  gradePageLoad,
  saveResults,
  writeReport,
  type PageLoadResult,
  type Grade,
} from './perf-config';

// ── Collect results across all tests ──────────────────────────────────────────

const results: PageLoadResult[] = [];

// ── Batched page load tests ───────────────────────────────────────────────────
// Test ALL 244 navigation URLs in batches for maintainable output.

const BATCH_SIZE = 20;
const batches: string[][] = [];
for (let i = 0; i < ALL_NAV_URLS.length; i += BATCH_SIZE) {
  batches.push(ALL_NAV_URLS.slice(i, i + BATCH_SIZE));
}

test.describe('Phase 1: Page Load Benchmarks', () => {
  test.describe.configure({ mode: 'serial' });

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const batchStart = batchIdx * BATCH_SIZE + 1;
    const batchEnd = batchStart + batch.length - 1;

    test(`Batch ${batchIdx + 1}: pages ${batchStart}-${batchEnd}`, async ({ page }) => {
      for (const url of batch) {
        // Clear performance marks
        await page.evaluate(() => {
          performance.clearMarks();
          performance.clearMeasures();
        });

        const startTime = Date.now();

        // Navigate
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        } catch {
          results.push({
            url,
            domReady: -1,
            networkIdle: -1,
            fullyLoaded: -1,
            vitals: null,
            memory: null,
            domNodes: 0,
            grade: 'F',
          });
          continue;
        }

        const domReady = Date.now() - startTime;

        // Wait for network idle
        try {
          await page.waitForLoadState('networkidle', { timeout: 10_000 });
        } catch {
          // Some pages may never reach networkidle (WebSocket, polling)
        }
        const networkIdle = Date.now() - startTime;

        // Wait for loading spinners/skeletons to disappear
        try {
          await page.waitForSelector(
            '.animate-pulse, .skeleton, [data-loading="true"], [data-testid="loading"]',
            { state: 'hidden', timeout: 5_000 },
          );
        } catch {
          // No loaders found or they didn't appear — that's fine
        }
        const fullyLoaded = Date.now() - startTime;

        // Collect Navigation Timing API vitals
        const vitals = await page.evaluate(() => {
          const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
          const nav = entries[0];
          if (!nav) return null;
          return {
            dns: nav.domainLookupEnd - nav.domainLookupStart,
            tcp: nav.connectEnd - nav.connectStart,
            ttfb: nav.responseStart - nav.requestStart,
            domParsing: nav.domInteractive - nav.responseEnd,
            domContentLoaded: nav.domContentLoadedEventEnd - nav.navigationStart,
          };
        });

        // JS Heap memory (Chrome-only)
        const memory = await page.evaluate(() => {
          const perf = performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } };
          if (perf.memory) {
            return {
              usedJSHeapSize: perf.memory.usedJSHeapSize / 1024 / 1024,
              totalJSHeapSize: perf.memory.totalJSHeapSize / 1024 / 1024,
            };
          }
          return null;
        });

        // Count DOM nodes
        const domNodes = await page.evaluate(() => document.querySelectorAll('*').length);

        const result: PageLoadResult = {
          url,
          domReady,
          networkIdle,
          fullyLoaded,
          vitals,
          memory,
          domNodes,
          grade: gradePageLoad(fullyLoaded),
        };

        results.push(result);

        // Soft assertion: page should load within FAIL threshold
        // Using expect.soft so one slow page doesn't block all others
        expect.soft(
          fullyLoaded,
          `Page ${url} loaded in ${fullyLoaded}ms (max ${PERF_THRESHOLDS.pageLoad.fail}ms)`,
        ).toBeLessThan(PERF_THRESHOLDS.pageLoad.fail);

        // DOM nodes warning
        if (domNodes > PERF_THRESHOLDS.domNodesMax) {
          test.info().annotations.push({
            type: 'warning',
            description: `${url}: ${domNodes} DOM nodes (threshold: ${PERF_THRESHOLDS.domNodesMax})`,
          });
        }
      }
    });
  }

  // ── Generate report after all batches ─────────────────────────────────────

  test('Generate page load report', async () => {
    // Save raw results
    saveResults('page-load-results.json', results);

    // Compute summary
    const grades: Record<Grade, number> = { A: 0, B: 0, C: 0, F: 0 };
    const failed: PageLoadResult[] = [];
    let totalLoad = 0;
    let totalDom = 0;
    let maxLoad = 0;
    let maxMemory = 0;

    for (const r of results) {
      grades[r.grade]++;
      if (r.fullyLoaded > 0) totalLoad += r.fullyLoaded;
      totalDom += r.domNodes;
      if (r.fullyLoaded > maxLoad) maxLoad = r.fullyLoaded;
      if (r.memory && r.memory.usedJSHeapSize > maxMemory) {
        maxMemory = r.memory.usedJSHeapSize;
      }
      if (r.grade === 'F') failed.push(r);
    }

    const avgLoad = results.length > 0 ? Math.round(totalLoad / results.length) : 0;
    const avgDom = results.length > 0 ? Math.round(totalDom / results.length) : 0;

    // Sort by load time descending for slowest pages
    const sorted = [...results].sort((a, b) => b.fullyLoaded - a.fullyLoaded);
    const top10Slowest = sorted.slice(0, 10);

    // Generate markdown report
    const total = results.length;
    const report = `## Page Load Benchmarks (${total} pages)

### Grade Distribution
| Grade | Count | Percentage | Threshold |
|-------|-------|------------|-----------|
| A (Excellent) | ${grades.A} | ${((grades.A / total) * 100).toFixed(1)}% | <1s |
| B (Good) | ${grades.B} | ${((grades.B / total) * 100).toFixed(1)}% | <2s |
| C (Acceptable) | ${grades.C} | ${((grades.C / total) * 100).toFixed(1)}% | <3s |
| F (FAIL) | ${grades.F} | ${((grades.F / total) * 100).toFixed(1)}% | >5s [CRITICAL] |

### Summary
- **Average load time**: ${avgLoad}ms
- **Max load time**: ${maxLoad}ms
- **Average DOM nodes**: ${avgDom}
- **Peak memory**: ${maxMemory.toFixed(1)} MB

### Slowest Pages (Top 10)
| # | Page | Load Time | DOM Nodes | Memory MB | Grade |
|---|------|-----------|-----------|-----------|-------|
${top10Slowest.map((r, i) => `| ${i + 1} | ${r.url} | ${r.fullyLoaded}ms | ${r.domNodes} | ${r.memory ? r.memory.usedJSHeapSize.toFixed(1) : 'N/A'} | ${r.grade} |`).join('\n')}

${failed.length > 0 ? `### FAILED Pages (>${PERF_THRESHOLDS.pageLoad.fail}ms) [CRITICAL]
${failed.map((r) => `- **${r.url}**: ${r.fullyLoaded}ms (${r.domNodes} DOM nodes)`).join('\n')}
` : '### All pages passed load time threshold.'}
`;

    writeReport('performance-page-load.md', report);

    // Hard assertion: no more than 5% of pages should fail
    const failPct = (grades.F / total) * 100;
    expect(failPct, `${grades.F}/${total} pages failed (${failPct.toFixed(1)}%)`).toBeLessThan(5);
  });
});
