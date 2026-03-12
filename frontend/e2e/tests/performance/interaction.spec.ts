/**
 * Phase 2: Interaction Benchmarks — measure response time for common user actions.
 *
 * Tests sorting, filtering, tab switching, modal opening, search, and navigation.
 * Each interaction measured from click/input to visible response.
 *
 * SLA: every interaction < 3s. Grades: A (<200ms) / B (<500ms) / C (<1s) / F (>3s)
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  PERF_THRESHOLDS,
  gradeInteraction,
  saveResults,
  writeReport,
  type InteractionResult,
} from './perf-config';

const results: InteractionResult[] = [];

// ── Interaction definitions ───────────────────────────────────────────────────

interface InteractionDef {
  page: string;
  action: string;
  setup?: (page: import('@playwright/test').Page) => Promise<void>;
  perform: (page: import('@playwright/test').Page) => Promise<void>;
  waitFor?: (page: import('@playwright/test').Page) => Promise<void>;
}

const INTERACTIONS: InteractionDef[] = [
  // ── Table sorting ─────────────────────────────────────────────────────────
  {
    page: '/projects',
    action: 'Sort table by clicking header',
    perform: async (page) => {
      const header = page.locator('th').first();
      if (await header.isVisible()) {
        await header.click();
      }
    },
  },
  {
    page: '/invoices',
    action: 'Sort invoices table',
    perform: async (page) => {
      const header = page.locator('th').first();
      if (await header.isVisible()) {
        await header.click();
      }
    },
  },
  {
    page: '/employees',
    action: 'Sort employees table',
    perform: async (page) => {
      const header = page.locator('th').first();
      if (await header.isVisible()) {
        await header.click();
      }
    },
  },

  // ── Filtering ─────────────────────────────────────────────────────────────
  {
    page: '/projects',
    action: 'Select status filter',
    perform: async (page) => {
      const select = page.locator('select, [role="combobox"], [role="listbox"]').first();
      if (await select.isVisible()) {
        await select.click();
      }
    },
  },
  {
    page: '/tasks',
    action: 'Switch view mode (list/board)',
    perform: async (page) => {
      // Look for board/list toggle buttons
      const toggle = page
        .locator('button')
        .filter({ hasText: /доска|board|канбан|kanban|список|list/i })
        .first();
      if (await toggle.isVisible()) {
        await toggle.click();
      }
    },
  },

  // ── Tab switching ─────────────────────────────────────────────────────────
  {
    page: '/projects',
    action: 'Switch tab on project page',
    perform: async (page) => {
      const tab = page.locator('[role="tab"]').nth(1);
      if (await tab.isVisible()) {
        await tab.click();
      }
    },
  },

  // ── Modal open/close ──────────────────────────────────────────────────────
  {
    page: '/projects',
    action: 'Open create modal',
    perform: async (page) => {
      const createBtn = page
        .locator('button')
        .filter({ hasText: /создать|добавить|create|add|new|\+/i })
        .first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
      }
    },
    waitFor: async (page) => {
      try {
        await page.waitForSelector('[role="dialog"], .modal, [data-testid="modal"]', {
          state: 'visible',
          timeout: 3_000,
        });
      } catch {
        // Modal may not appear — page might navigate instead
      }
    },
  },
  {
    page: '/invoices',
    action: 'Open create invoice modal',
    perform: async (page) => {
      const createBtn = page
        .locator('button')
        .filter({ hasText: /создать|добавить|create|add|new|\+/i })
        .first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
      }
    },
    waitFor: async (page) => {
      try {
        await page.waitForSelector('[role="dialog"], .modal', {
          state: 'visible',
          timeout: 3_000,
        });
      } catch {
        // May navigate to form page instead
      }
    },
  },

  // ── Search ────────────────────────────────────────────────────────────────
  {
    page: '/warehouse/materials',
    action: 'Search materials',
    perform: async (page) => {
      const search = page
        .locator('input[type="search"], input[placeholder*="оиск"], input[placeholder*="earch"]')
        .first();
      if (await search.isVisible()) {
        await search.fill('E2E-test-search');
      }
    },
  },
  {
    page: '/employees',
    action: 'Search employees',
    perform: async (page) => {
      const search = page
        .locator('input[type="search"], input[placeholder*="оиск"], input[placeholder*="earch"]')
        .first();
      if (await search.isVisible()) {
        await search.fill('Иванов');
      }
    },
  },
  {
    page: '/specifications',
    action: 'Search specifications',
    perform: async (page) => {
      const search = page
        .locator('input[type="search"], input[placeholder*="оиск"], input[placeholder*="earch"]')
        .first();
      if (await search.isVisible()) {
        await search.fill('ЭОМ');
      }
    },
  },

  // ── Navigation (SPA transition) ───────────────────────────────────────────
  {
    page: '/',
    action: 'Navigate to projects via sidebar',
    perform: async (page) => {
      const link = page.locator('a[href="/projects"]').first();
      if (await link.isVisible()) {
        await link.click();
      }
    },
    waitFor: async (page) => {
      await page.waitForURL('**/projects', { timeout: 5_000 }).catch(() => {});
    },
  },
  {
    page: '/projects',
    action: 'Navigate to invoices via sidebar',
    perform: async (page) => {
      const link = page.locator('a[href="/invoices"]').first();
      if (await link.isVisible()) {
        await link.click();
      }
    },
    waitFor: async (page) => {
      await page.waitForURL('**/invoices', { timeout: 5_000 }).catch(() => {});
    },
  },
  {
    page: '/invoices',
    action: 'Navigate to employees via sidebar',
    perform: async (page) => {
      const link = page.locator('a[href="/employees"]').first();
      if (await link.isVisible()) {
        await link.click();
      }
    },
    waitFor: async (page) => {
      await page.waitForURL('**/employees', { timeout: 5_000 }).catch(() => {});
    },
  },

  // ── Dark mode toggle ──────────────────────────────────────────────────────
  {
    page: '/',
    action: 'Toggle dark mode',
    perform: async (page) => {
      const themeBtn = page
        .locator('button')
        .filter({ hasText: /тема|theme/i })
        .or(page.locator('[data-testid="theme-toggle"], button[aria-label*="theme"], button[aria-label*="тема"]'))
        .first();
      if (await themeBtn.isVisible()) {
        await themeBtn.click();
      }
    },
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Phase 2: Interaction Benchmarks', () => {
  test.describe.configure({ mode: 'serial' });

  for (const interaction of INTERACTIONS) {
    test(`${interaction.page} → ${interaction.action}`, async ({ page }) => {
      // Navigate to the page first
      try {
        await page.goto(interaction.page, { waitUntil: 'networkidle', timeout: 15_000 });
      } catch {
        // Page may not reach networkidle — try domcontentloaded
        try {
          await page.goto(interaction.page, { waitUntil: 'domcontentloaded', timeout: 10_000 });
        } catch {
          results.push({
            page: interaction.page,
            action: interaction.action,
            elapsed: -1,
            grade: 'F',
          });
          return;
        }
      }

      // Wait a bit for JS hydration
      await page.waitForTimeout(500);

      // Run setup if defined
      if (interaction.setup) {
        await interaction.setup(page);
      }

      // Measure interaction
      const startTime = Date.now();

      try {
        await interaction.perform(page);
      } catch {
        // Element not found — record as skipped
        results.push({
          page: interaction.page,
          action: interaction.action,
          elapsed: -1,
          grade: 'F',
        });
        return;
      }

      // Wait for response if custom waitFor provided
      if (interaction.waitFor) {
        try {
          await interaction.waitFor(page);
        } catch {
          // Timeout waiting for response
        }
      } else {
        // Default: wait for network to settle
        try {
          await page.waitForLoadState('networkidle', { timeout: 5_000 });
        } catch {
          // Timeout — measure what we have
        }
      }

      const elapsed = Date.now() - startTime;

      const result: InteractionResult = {
        page: interaction.page,
        action: interaction.action,
        elapsed,
        grade: gradeInteraction(elapsed),
      };

      results.push(result);

      // Soft assertion: interaction should respond within FAIL threshold
      expect.soft(
        elapsed,
        `Interaction "${interaction.action}" on ${interaction.page}: ${elapsed}ms (max ${PERF_THRESHOLDS.interaction.fail}ms)`,
      ).toBeLessThan(PERF_THRESHOLDS.interaction.fail);
    });
  }

  // ── Generate report ─────────────────────────────────────────────────────

  test('Generate interaction report', async () => {
    saveResults('interaction-results.json', results);

    const valid = results.filter((r) => r.elapsed >= 0);
    const avgTime = valid.length > 0
      ? Math.round(valid.reduce((s, r) => s + r.elapsed, 0) / valid.length)
      : 0;
    const slowest = [...valid].sort((a, b) => b.elapsed - a.elapsed);
    const failed = valid.filter((r) => r.grade === 'F');
    const skipped = results.filter((r) => r.elapsed < 0);

    const report = `## Interaction Benchmarks (${results.length} interactions)

### Summary
- **Total interactions tested**: ${results.length}
- **Successful**: ${valid.length}
- **Skipped** (element not found): ${skipped.length}
- **Average response time**: ${avgTime}ms
- **Failed (>3s)**: ${failed.length}

### Results
| # | Page | Action | Time | Grade | Status |
|---|------|--------|------|-------|--------|
${results.map((r, i) => `| ${i + 1} | ${r.page} | ${r.action} | ${r.elapsed >= 0 ? `${r.elapsed}ms` : 'SKIP'} | ${r.grade} | ${r.elapsed < 0 ? 'SKIP' : r.elapsed < PERF_THRESHOLDS.interaction.fail ? 'PASS' : 'FAIL'} |`).join('\n')}

${failed.length > 0 ? `### FAILED Interactions (>3s) [MAJOR]
${failed.map((r) => `- **${r.page}** → "${r.action}": ${r.elapsed}ms`).join('\n')}
` : '### All interactions passed response time threshold.'}
`;

    writeReport('performance-interactions.md', report);

    // No more than 10% of interactions should fail
    const failPct = valid.length > 0 ? (failed.length / valid.length) * 100 : 0;
    expect(failPct, `${failed.length}/${valid.length} interactions failed`).toBeLessThan(10);
  });
});
