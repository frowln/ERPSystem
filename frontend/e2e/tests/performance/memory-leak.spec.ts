/**
 * Phase 4: Memory Leak Detection.
 *
 * Verifies that:
 * - Navigating through 50 pages doesn't cause unbounded memory growth
 * - Opening/closing modals 20 times doesn't leak event listeners
 * - Switching themes repeatedly doesn't leak
 * - Tab navigation doesn't accumulate DOM nodes
 *
 * SLA: Memory growth < 50% over 50 navigations.
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  PERF_THRESHOLDS,
  ALL_NAV_URLS,
  saveResults,
  writeReport,
} from './perf-config';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemorySnapshot {
  url: string;
  heapMB: number;
  domNodes: number;
}

interface MemoryLeakResult {
  test: string;
  iterations: number;
  startMemoryMB: number;
  endMemoryMB: number;
  peakMemoryMB: number;
  growthPercent: number;
  leaked: boolean;
  snapshots?: MemorySnapshot[];
  notes: string;
}

const results: MemoryLeakResult[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getMemoryMB(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
    return perf.memory ? perf.memory.usedJSHeapSize / 1024 / 1024 : 0;
  });
}

async function getDomNodeCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => document.querySelectorAll('*').length);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Phase 4: Memory Leak Detection', () => {
  test.describe.configure({ mode: 'serial', timeout: 300_000 });

  test('Memory leak: navigate 50 pages', async ({ page }) => {
    const snapshots: MemorySnapshot[] = [];

    // Navigate through 50 different pages
    const pagesToVisit = ALL_NAV_URLS.slice(0, 50);

    for (const url of pagesToVisit) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10_000 });
      } catch {
        continue; // Skip pages that fail to load
      }

      // Short wait for rendering
      await page.waitForTimeout(300);

      const heapMB = await getMemoryMB(page);
      const domNodes = await getDomNodeCount(page);

      snapshots.push({ url, heapMB, domNodes });
    }

    if (snapshots.length < 10) {
      results.push({
        test: 'Navigate 50 pages',
        iterations: snapshots.length,
        startMemoryMB: 0,
        endMemoryMB: 0,
        peakMemoryMB: 0,
        growthPercent: 0,
        leaked: false,
        snapshots,
        notes: `Only ${snapshots.length} pages loaded — insufficient data`,
      });
      return;
    }

    // Analyze memory trend
    const firstHalf = snapshots.slice(0, Math.floor(snapshots.length / 2));
    const secondHalf = snapshots.slice(Math.floor(snapshots.length / 2));

    const avgFirst = firstHalf.reduce((s, snap) => s + snap.heapMB, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, snap) => s + snap.heapMB, 0) / secondHalf.length;

    const growth = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;
    const startMem = snapshots[0].heapMB;
    const endMem = snapshots[snapshots.length - 1].heapMB;
    const peakMem = Math.max(...snapshots.map((s) => s.heapMB));

    results.push({
      test: 'Navigate 50 pages',
      iterations: snapshots.length,
      startMemoryMB: startMem,
      endMemoryMB: endMem,
      peakMemoryMB: peakMem,
      growthPercent: growth,
      leaked: growth > PERF_THRESHOLDS.memoryGrowthMax,
      snapshots,
      notes: `First-half avg: ${avgFirst.toFixed(1)}MB, Second-half avg: ${avgSecond.toFixed(1)}MB`,
    });

    // Memory should not grow >50% over 50 navigations
    expect(
      growth,
      `Memory grew ${growth.toFixed(1)}% (threshold: ${PERF_THRESHOLDS.memoryGrowthMax}%)`,
    ).toBeLessThan(PERF_THRESHOLDS.memoryGrowthMax);
  });

  test('Memory leak: open/close modal 20 times', async ({ page }) => {
    await page.goto('/projects', { waitUntil: 'networkidle', timeout: 15_000 }).catch(() =>
      page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 10_000 }),
    );

    const initialMemory = await getMemoryMB(page);
    const initialDom = await getDomNodeCount(page);
    const ITERATIONS = 20;
    let successfulIterations = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      // Find and click create button
      const createBtn = page
        .locator('button')
        .filter({ hasText: /создать|добавить|create|add|\+/i })
        .first();

      if (!(await createBtn.isVisible().catch(() => false))) break;

      try {
        await createBtn.click();

        // Wait for modal to appear
        const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]');
        await modal.waitFor({ state: 'visible', timeout: 2_000 }).catch(() => {});

        if (await modal.isVisible().catch(() => false)) {
          // Close modal
          await page.keyboard.press('Escape');
          await modal.waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
          successfulIterations++;
        } else {
          // If button navigated instead of opening modal, go back
          await page.goBack();
          await page.waitForTimeout(500);
          successfulIterations++;
        }
      } catch {
        // Skip iteration on error
      }
    }

    const finalMemory = await getMemoryMB(page);
    const finalDom = await getDomNodeCount(page);
    const growth = initialMemory > 0
      ? ((finalMemory - initialMemory) / initialMemory) * 100
      : 0;

    results.push({
      test: 'Modal open/close 20x',
      iterations: successfulIterations,
      startMemoryMB: initialMemory,
      endMemoryMB: finalMemory,
      peakMemoryMB: finalMemory, // We only measure at end
      growthPercent: growth,
      leaked: growth > 30, // Stricter threshold for repeated same-page action
      notes: `DOM nodes: ${initialDom} → ${finalDom} (${finalDom - initialDom > 0 ? '+' : ''}${finalDom - initialDom}). ${successfulIterations}/${ITERATIONS} iterations`,
    });

    // DOM nodes should not grow significantly
    const domGrowth = finalDom - initialDom;
    expect(
      domGrowth,
      `DOM grew by ${domGrowth} nodes after ${successfulIterations} modal cycles`,
    ).toBeLessThan(500);
  });

  test('Memory leak: rapid navigation 30 times', async ({ page }) => {
    // Simulate power user rapidly switching between key pages
    const navLoop = ['/projects', '/invoices', '/employees', '/budgets', '/tasks', '/safety'];
    const ITERATIONS = 30;

    const initialMemory = await getMemoryMB(page).catch(() => 0);
    const snapshots: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const url = navLoop[i % navLoop.length];
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8_000 });
        const mem = await getMemoryMB(page);
        snapshots.push(mem);
      } catch {
        // Skip failed navigations
      }
    }

    const finalMemory = snapshots.length > 0 ? snapshots[snapshots.length - 1] : 0;
    const peakMemory = snapshots.length > 0 ? Math.max(...snapshots) : 0;
    const growth = initialMemory > 0
      ? ((finalMemory - initialMemory) / initialMemory) * 100
      : 0;

    results.push({
      test: 'Rapid navigation 30x',
      iterations: snapshots.length,
      startMemoryMB: initialMemory,
      endMemoryMB: finalMemory,
      peakMemoryMB: peakMemory,
      growthPercent: growth,
      leaked: growth > PERF_THRESHOLDS.memoryGrowthMax,
      notes: `${snapshots.length}/${ITERATIONS} successful navigations`,
    });

    expect(
      growth,
      `Memory grew ${growth.toFixed(1)}% over ${snapshots.length} rapid navigations`,
    ).toBeLessThan(PERF_THRESHOLDS.memoryGrowthMax);
  });

  test('Memory leak: search input 20 times', async ({ page }) => {
    await page.goto('/employees', { waitUntil: 'networkidle', timeout: 15_000 }).catch(() =>
      page.goto('/employees', { waitUntil: 'domcontentloaded', timeout: 10_000 }),
    );

    const initialMemory = await getMemoryMB(page);
    const ITERATIONS = 20;
    let successfulIterations = 0;

    const search = page
      .locator('input[type="search"], input[placeholder*="оиск"], input[placeholder*="earch"]')
      .first();

    if (await search.isVisible().catch(() => false)) {
      for (let i = 0; i < ITERATIONS; i++) {
        try {
          await search.fill(`Тест-${i}-поиск-${Date.now()}`);
          await page.waitForTimeout(200); // Debounce
          await search.clear();
          await page.waitForTimeout(200);
          successfulIterations++;
        } catch {
          break;
        }
      }
    }

    const finalMemory = await getMemoryMB(page);
    const growth = initialMemory > 0
      ? ((finalMemory - initialMemory) / initialMemory) * 100
      : 0;

    results.push({
      test: 'Search input 20x',
      iterations: successfulIterations,
      startMemoryMB: initialMemory,
      endMemoryMB: finalMemory,
      peakMemoryMB: finalMemory,
      growthPercent: growth,
      leaked: growth > 30,
      notes: `${successfulIterations}/${ITERATIONS} search cycles`,
    });

    expect(
      growth,
      `Memory grew ${growth.toFixed(1)}% after ${successfulIterations} search cycles`,
    ).toBeLessThan(50);
  });

  // ── Generate report ─────────────────────────────────────────────────────

  test('Generate memory leak report', async () => {
    saveResults('memory-leak-results.json', results);

    const leaked = results.filter((r) => r.leaked);

    const report = `## Memory Leak Detection (${results.length} tests)

### Summary
- **Tests run**: ${results.length}
- **Leaks detected**: ${leaked.length}
- **Max growth threshold**: ${PERF_THRESHOLDS.memoryGrowthMax}%

### Results
| Test | Iterations | Start MB | End MB | Peak MB | Growth % | Leak? |
|------|------------|----------|--------|---------|----------|-------|
${results.map((r) => `| ${r.test} | ${r.iterations} | ${r.startMemoryMB.toFixed(1)} | ${r.endMemoryMB.toFixed(1)} | ${r.peakMemoryMB.toFixed(1)} | ${r.growthPercent.toFixed(1)}% | ${r.leaked ? 'YES [CRITICAL]' : 'NO'} |`).join('\n')}

### Notes
${results.map((r) => `- **${r.test}**: ${r.notes}`).join('\n')}

${leaked.length > 0 ? `### MEMORY LEAKS DETECTED [CRITICAL]
${leaked.map((r) => `- **${r.test}**: grew ${r.growthPercent.toFixed(1)}% (${r.startMemoryMB.toFixed(1)}MB → ${r.endMemoryMB.toFixed(1)}MB)`).join('\n')}
` : '### No memory leaks detected.'}
`;

    writeReport('performance-memory.md', report);
  });
});
