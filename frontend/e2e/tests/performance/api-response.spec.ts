/**
 * Phase 6: API Response Time Analysis.
 *
 * Intercepts all /api/ requests across top 30 pages and measures:
 * - Response time per endpoint
 * - Status codes
 * - Slow endpoints (>1s)
 * - Average and P95 response times
 *
 * SLA: No API call > 5s. Average < 300ms.
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  PERF_THRESHOLDS,
  TOP_30_PAGES,
  gradeApi,
  saveResults,
  writeReport,
  type ApiTimingEntry,
} from './perf-config';

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Phase 6: API Response Time Analysis', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test('API response times across top 30 pages', async ({ page }) => {
    const apiTimings: ApiTimingEntry[] = [];
    const errorResponses: { url: string; status: number; method: string }[] = [];

    // Register response listener BEFORE navigating
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        const request = response.request();
        const timing = request.timing();

        // Calculate duration from request timing
        const duration = timing.responseEnd > 0 && timing.requestStart > 0
          ? timing.responseEnd - timing.requestStart
          : 0;

        // Normalize URL: replace UUIDs and numeric IDs with :id
        const normalizedUrl = url
          .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:id')
          .replace(/\/\d+/g, '/:id')
          .replace(/\?.*$/, ''); // Strip query params for grouping

        const entry: ApiTimingEntry = {
          url: normalizedUrl,
          method: request.method(),
          status: response.status(),
          duration,
        };

        apiTimings.push(entry);

        if (response.status() >= 400) {
          errorResponses.push({
            url: normalizedUrl,
            status: response.status(),
            method: request.method(),
          });
        }
      }
    });

    // Navigate through top 30 pages
    for (const url of TOP_30_PAGES) {
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15_000 });
      } catch {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10_000 });
          await page.waitForTimeout(1_000); // Give API calls time to complete
        } catch {
          continue; // Skip pages that fail
        }
      }
    }

    // ── Analysis ──────────────────────────────────────────────────────────

    // Filter out zero-duration entries (timing not available in some cases)
    const validTimings = apiTimings.filter((t) => t.duration > 0);

    // Sort by duration
    const sorted = [...validTimings].sort((a, b) => b.duration - a.duration);

    // Compute stats
    const totalCalls = apiTimings.length;
    const validCalls = validTimings.length;
    const avgTime = validCalls > 0
      ? Math.round(validTimings.reduce((s, t) => s + t.duration, 0) / validCalls)
      : 0;

    // P95
    const p95Index = Math.floor(validCalls * 0.95);
    const p95Time = validCalls > 0 ? sorted[validCalls - 1 - p95Index]?.duration ?? 0 : 0;

    // Slow endpoints
    const slowAPIs = validTimings.filter((t) => t.duration > PERF_THRESHOLDS.apiResponse.slow);
    const failedAPIs = validTimings.filter((t) => t.duration > PERF_THRESHOLDS.apiResponse.fail);

    // Group by endpoint for aggregation
    const endpointStats = new Map<string, { count: number; totalMs: number; maxMs: number; errors: number }>();
    for (const t of apiTimings) {
      const key = `${t.method} ${t.url}`;
      const existing = endpointStats.get(key) || { count: 0, totalMs: 0, maxMs: 0, errors: 0 };
      existing.count++;
      existing.totalMs += t.duration;
      existing.maxMs = Math.max(existing.maxMs, t.duration);
      if (t.status >= 400) existing.errors++;
      endpointStats.set(key, existing);
    }

    // Top 10 most-called endpoints
    const topEndpoints = [...endpointStats.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    // Top 10 slowest endpoints
    const slowestEndpoints = [...endpointStats.entries()]
      .sort((a, b) => b[1].maxMs - a[1].maxMs)
      .slice(0, 10);

    // Grade distribution
    const grades = { A: 0, B: 0, C: 0, F: 0 };
    for (const t of validTimings) {
      grades[gradeApi(t.duration)]++;
    }

    // ── Save results ──────────────────────────────────────────────────────

    saveResults('api-response-results.json', {
      totalCalls,
      validCalls,
      avgTime,
      p95Time,
      slowAPIs: slowAPIs.length,
      failedAPIs: failedAPIs.length,
      errors: errorResponses.length,
      grades,
      slowestEndpoints: sorted.slice(0, 20).map((t) => ({
        url: t.url,
        method: t.method,
        status: t.status,
        duration: t.duration,
      })),
    });

    // ── Generate report ───────────────────────────────────────────────────

    const report = `## API Response Time Analysis

### Overview
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total API calls | ${totalCalls} | — | — |
| Valid (with timing) | ${validCalls} | — | — |
| Average response | ${avgTime}ms | <${PERF_THRESHOLDS.apiResponse.ok}ms | ${avgTime < PERF_THRESHOLDS.apiResponse.ok ? 'PASS' : 'WARN'} |
| P95 response | ${Math.round(p95Time)}ms | <${PERF_THRESHOLDS.apiResponse.slow}ms | ${p95Time < PERF_THRESHOLDS.apiResponse.slow ? 'PASS' : 'WARN'} |
| Slow (>1s) | ${slowAPIs.length} | 0 | ${slowAPIs.length === 0 ? 'PASS' : 'WARN [MAJOR]'} |
| Failed (>5s) | ${failedAPIs.length} | 0 | ${failedAPIs.length === 0 ? 'PASS' : 'FAIL [CRITICAL]'} |
| HTTP errors (4xx/5xx) | ${errorResponses.length} | — | ${errorResponses.length === 0 ? 'PASS' : 'WARN'} |

### Response Time Grade Distribution
| Grade | Count | Percentage |
|-------|-------|------------|
| A (<100ms) | ${grades.A} | ${validCalls > 0 ? ((grades.A / validCalls) * 100).toFixed(1) : 0}% |
| B (<300ms) | ${grades.B} | ${validCalls > 0 ? ((grades.B / validCalls) * 100).toFixed(1) : 0}% |
| C (<1s) | ${grades.C} | ${validCalls > 0 ? ((grades.C / validCalls) * 100).toFixed(1) : 0}% |
| F (>5s) | ${grades.F} | ${validCalls > 0 ? ((grades.F / validCalls) * 100).toFixed(1) : 0}% |

### Top 10 Most-Called Endpoints
| Endpoint | Calls | Avg ms | Max ms | Errors |
|----------|-------|--------|--------|--------|
${topEndpoints.map(([key, stats]) => `| ${key} | ${stats.count} | ${Math.round(stats.totalMs / stats.count)} | ${Math.round(stats.maxMs)} | ${stats.errors} |`).join('\n')}

### Top 10 Slowest Endpoints
| Endpoint | Max ms | Calls | Avg ms | Grade |
|----------|--------|-------|--------|-------|
${slowestEndpoints.map(([key, stats]) => `| ${key} | ${Math.round(stats.maxMs)} | ${stats.count} | ${Math.round(stats.totalMs / stats.count)} | ${gradeApi(stats.maxMs)} |`).join('\n')}

${errorResponses.length > 0 ? `### HTTP Errors
| Method | URL | Status |
|--------|-----|--------|
${[...new Set(errorResponses.map((e) => `| ${e.method} | ${e.url} | ${e.status} |`))].slice(0, 20).join('\n')}
` : ''}

${failedAPIs.length > 0 ? `### FAILED API Calls (>5s) [CRITICAL]
${failedAPIs.slice(0, 10).map((t) => `- **${t.method} ${t.url}**: ${Math.round(t.duration)}ms (status: ${t.status})`).join('\n')}
` : '### All API calls within threshold.'}
`;

    writeReport('performance-api.md', report);

    // Assertions
    expect(failedAPIs.length, `${failedAPIs.length} API calls exceeded 5s`).toBe(0);
  });
});
