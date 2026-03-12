/**
 * Phase 5: Bundle Analysis.
 *
 * Measures:
 * - Total JS bundle size on initial load
 * - Number of chunks (code splitting effectiveness)
 * - Largest chunk size
 * - CSS bundle size
 * - Image/font assets loaded
 * - Unused JS estimation (coverage)
 *
 * SLA: Total JS < 2MB for initial load. Largest chunk < 500KB.
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  PERF_THRESHOLDS,
  saveResults,
  writeReport,
  type BundleChunkInfo,
} from './perf-config';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BundleResult {
  totalJSKB: number;
  totalCSSKB: number;
  totalFontKB: number;
  totalImageKB: number;
  chunks: BundleChunkInfo[];
  largestChunkKB: number;
  chunkCount: number;
  initialLoadResources: number;
  transferSizeKB: number;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Phase 5: Bundle Analysis', () => {
  test.describe.configure({ mode: 'serial' });

  test('Bundle size check — initial load', async ({ page }) => {
    // Navigate to home page and collect all resources
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30_000 });

    // Collect all loaded resources via Performance API
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return entries.map((r) => ({
        name: r.name.split('/').pop() || r.name,
        fullUrl: r.name,
        type: r.initiatorType,
        size: r.transferSize,
        decodedSize: r.decodedBodySize,
        duration: r.duration,
      }));
    });

    // Classify resources
    const jsResources = resources.filter(
      (r) => r.type === 'script' || r.fullUrl.match(/\.js(\?|$)/),
    );
    const cssResources = resources.filter(
      (r) => r.type === 'link' || r.fullUrl.match(/\.css(\?|$)/),
    );
    const fontResources = resources.filter((r) =>
      r.fullUrl.match(/\.(woff2?|ttf|eot|otf)(\?|$)/),
    );
    const imageResources = resources.filter((r) =>
      r.fullUrl.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)(\?|$)/),
    );

    const totalJSKB = jsResources.reduce((sum, r) => sum + r.size, 0) / 1024;
    const totalCSSKB = cssResources.reduce((sum, r) => sum + r.size, 0) / 1024;
    const totalFontKB = fontResources.reduce((sum, r) => sum + r.size, 0) / 1024;
    const totalImageKB = imageResources.reduce((sum, r) => sum + r.size, 0) / 1024;

    const chunks: BundleChunkInfo[] = jsResources.map((r) => ({
      name: r.name,
      size: r.size,
      duration: r.duration,
    }));

    const largestChunkKB = chunks.length > 0
      ? Math.max(...chunks.map((c) => c.size)) / 1024
      : 0;

    const transferSizeKB = resources.reduce((sum, r) => sum + r.size, 0) / 1024;

    const result: BundleResult = {
      totalJSKB,
      totalCSSKB,
      totalFontKB,
      totalImageKB,
      chunks,
      largestChunkKB,
      chunkCount: chunks.length,
      initialLoadResources: resources.length,
      transferSizeKB,
    };

    saveResults('bundle-analysis-results.json', result);

    // Top JS chunks by size
    const sortedChunks = [...chunks].sort((a, b) => b.size - a.size);
    const top10Chunks = sortedChunks.slice(0, 10);

    const report = `## Bundle Analysis

### Overview
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total JS | ${totalJSKB.toFixed(0)} KB | <${PERF_THRESHOLDS.bundleSizeMax} KB | ${totalJSKB < PERF_THRESHOLDS.bundleSizeMax ? 'PASS' : 'FAIL [CRITICAL]'} |
| Total CSS | ${totalCSSKB.toFixed(0)} KB | — | — |
| Total Fonts | ${totalFontKB.toFixed(0)} KB | — | — |
| Total Images | ${totalImageKB.toFixed(0)} KB | — | — |
| **Total Transfer** | **${transferSizeKB.toFixed(0)} KB** | — | — |

### Code Splitting
- **JS chunks**: ${chunks.length}
- **Largest chunk**: ${largestChunkKB.toFixed(0)} KB ${largestChunkKB > 500 ? '[MAJOR]' : ''}
- **Total resources on initial load**: ${resources.length}

### Top 10 JS Chunks (by size)
| # | Chunk | Size KB | Load Time ms |
|---|-------|---------|-------------|
${top10Chunks.map((c, i) => `| ${i + 1} | ${c.name.slice(0, 50)} | ${(c.size / 1024).toFixed(0)} | ${c.duration.toFixed(0)} |`).join('\n')}

### Resource Breakdown
| Type | Count | Total KB |
|------|-------|----------|
| JavaScript | ${jsResources.length} | ${totalJSKB.toFixed(0)} |
| CSS | ${cssResources.length} | ${totalCSSKB.toFixed(0)} |
| Fonts | ${fontResources.length} | ${totalFontKB.toFixed(0)} |
| Images | ${imageResources.length} | ${totalImageKB.toFixed(0)} |
| Other | ${resources.length - jsResources.length - cssResources.length - fontResources.length - imageResources.length} | ${((transferSizeKB - totalJSKB - totalCSSKB - totalFontKB - totalImageKB)).toFixed(0)} |

${totalJSKB > PERF_THRESHOLDS.bundleSizeMax ? `### BUNDLE TOO LARGE [CRITICAL]
Total JS bundle (${totalJSKB.toFixed(0)} KB) exceeds ${PERF_THRESHOLDS.bundleSizeMax} KB threshold.
Consider:
- Lazy-loading heavy modules (BIM, charts, PDF viewers)
- Tree-shaking unused exports
- Replacing large dependencies with lighter alternatives
` : '### Bundle size within threshold.'}

${largestChunkKB > 500 ? `### LARGE CHUNK WARNING [MAJOR]
Largest chunk (${largestChunkKB.toFixed(0)} KB) exceeds 500 KB.
Split it further with dynamic imports.
` : ''}
`;

    writeReport('performance-bundle.md', report);

    // Assertions
    expect(totalJSKB, `Total JS: ${totalJSKB.toFixed(0)} KB`).toBeLessThan(
      PERF_THRESHOLDS.bundleSizeMax,
    );
  });

  test('Bundle size check — lazy loaded routes', async ({ page }) => {
    // Navigate through several heavy pages and verify lazy chunks load
    const heavyPages = [
      { url: '/financial-models', name: 'Financial Models' },
      { url: '/planning/gantt', name: 'Gantt Chart' },
      { url: '/analytics', name: 'Analytics Dashboard' },
      { url: '/bim/models', name: 'BIM Models' },
      { url: '/portfolio/health', name: 'Portfolio Health' },
    ];

    const lazyResults: { page: string; jsLoadedKB: number; newChunks: number }[] = [];

    // Get baseline resources
    await page.goto('/', { waitUntil: 'networkidle', timeout: 15_000 });
    const baselineResources = await page.evaluate(() =>
      new Set(
        (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
          .filter((r) => r.name.match(/\.js(\?|$)/))
          .map((r) => r.name),
      ),
    );

    for (const hp of heavyPages) {
      // Clear performance entries
      await page.evaluate(() => performance.clearResourceTimings());

      try {
        await page.goto(hp.url, { waitUntil: 'networkidle', timeout: 15_000 });
      } catch {
        lazyResults.push({ page: hp.name, jsLoadedKB: -1, newChunks: 0 });
        continue;
      }

      const newResources = await page.evaluate((baseline: string[]) => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsEntries = entries.filter(
          (r) => r.name.match(/\.js(\?|$)/) && !baseline.includes(r.name),
        );
        return {
          totalKB: jsEntries.reduce((s, r) => s + r.transferSize, 0) / 1024,
          count: jsEntries.length,
        };
      }, [...baselineResources]);

      lazyResults.push({
        page: hp.name,
        jsLoadedKB: newResources.totalKB,
        newChunks: newResources.count,
      });
    }

    saveResults('lazy-load-results.json', lazyResults);

    const report = `### Lazy Loading Analysis
| Page | New JS Loaded | New Chunks | Status |
|------|---------------|------------|--------|
${lazyResults.map((r) => `| ${r.page} | ${r.jsLoadedKB >= 0 ? `${r.jsLoadedKB.toFixed(0)} KB` : 'FAIL'} | ${r.newChunks} | ${r.newChunks > 0 ? 'Lazy-loaded' : r.jsLoadedKB >= 0 ? 'Bundled' : 'FAIL'} |`).join('\n')}

${lazyResults.filter((r) => r.newChunks === 0 && r.jsLoadedKB >= 0).length > 0 ? `
**Not lazy-loaded** (bundled with initial load):
${lazyResults.filter((r) => r.newChunks === 0 && r.jsLoadedKB >= 0).map((r) => `- ${r.page}`).join('\n')}
Consider adding dynamic imports for these routes.
` : ''}
`;

    writeReport('performance-lazy-load.md', report);
  });
});
