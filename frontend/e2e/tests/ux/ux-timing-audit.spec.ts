import { test, expect } from '@playwright/test';

/**
 * UX Workflow Timing Audit
 *
 * Measures critical user-flow durations against defined SLAs.
 * Uses soft assertions so all timings are collected even when some exceed budget.
 *
 * SLA targets (aligned with Google RAIL model + construction-ERP research):
 *   - Module navigation  : < 3 000 ms per page, < 15 000 ms for 5 pages
 *   - Dashboard load     : < 10 000 ms
 *   - Project list load  : < 10 000 ms
 *   - Search response    : < 2 000 ms
 *   - Form open          : < 2 000 ms
 *   - Table sort         : < 1 000 ms
 *   - Tab switch         : <   500 ms
 *   - Foreman morning    : < 15 000 ms total
 *   - CEO financial      : < 15 000 ms total
 *   - Procurement check  : < 15 000 ms total
 */

const BASE_URL = 'http://localhost:4000';

/** Navigate to a URL and return the elapsed milliseconds to domcontentloaded. */
async function timeGoto(
  page: Parameters<typeof test.fn>[0]['page'],
  url: string,
  waitSelector?: string,
): Promise<number> {
  const start = Date.now();
  await page.goto(`${BASE_URL}${url}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  await page.waitForLoadState('networkidle').catch(() => {
    // networkidle can time-out for pages with long-polling — treat as acceptable
  });
  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: 10_000 }).catch(() => {});
  }
  return Date.now() - start;
}

/** Push a timing annotation to the current test. */
function annotate(
  info: ReturnType<typeof test.info>,
  label: string,
  elapsed: number,
  budget: number,
) {
  const status = elapsed <= budget ? 'PASS' : 'SLOW';
  info.annotations.push({
    type: 'timing',
    description: `[${status}] ${label}: ${elapsed}ms (budget: ${budget}ms)`,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

test.describe('UX Workflow Timing', () => {
  // ─── 1. Module switching speed ───────────────────────────────────────────

  test('module switching: 5 pages in < 15s, each page < 3s', async ({ page }) => {
    const modules: { url: string; label: string }[] = [
      { url: '/', label: 'Dashboard' },
      { url: '/projects', label: 'Projects' },
      { url: '/invoices', label: 'Invoices' },
      { url: '/employees', label: 'Employees' },
      { url: '/tasks', label: 'Tasks' },
    ];

    const timings: { label: string; elapsed: number }[] = [];
    const overallStart = Date.now();

    for (const mod of modules) {
      const elapsed = await timeGoto(page, mod.url);
      timings.push({ label: mod.label, elapsed });
      annotate(test.info(), `Nav to ${mod.label}`, elapsed, 3_000);
      expect.soft(elapsed, `${mod.label} should load in < 3s`).toBeLessThan(3_000);
    }

    const total = Date.now() - overallStart;
    annotate(test.info(), 'Total module switching (5 pages)', total, 15_000);

    const summary = timings
      .map((t) => `${t.label}: ${t.elapsed}ms`)
      .join(' | ');
    test.info().annotations.push({ type: 'timing-summary', description: summary });

    expect.soft(total, 'Module switching total should be < 15s').toBeLessThan(15_000);
  });

  // ─── 2. Dashboard load time ──────────────────────────────────────────────

  test('dashboard load: time to content visible < 10s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Wait for any KPI card, metric card, or chart container
    await Promise.race([
      page.waitForSelector('[data-testid="kpi-card"]', { timeout: 10_000 }),
      page.waitForSelector('.recharts-wrapper', { timeout: 10_000 }),
      page.waitForSelector('[class*="card"]', { timeout: 10_000 }),
      page.waitForSelector('main', { timeout: 10_000 }),
    ]).catch(() => {});

    const elapsed = Date.now() - start;
    annotate(test.info(), 'Dashboard content visible', elapsed, 10_000);
    test.info().annotations.push({
      type: 'timing-summary',
      description: `Dashboard load: ${elapsed}ms`,
    });
    expect.soft(elapsed, 'Dashboard should show content in < 10s').toBeLessThan(10_000);
  });

  // ─── 3. Project list load ────────────────────────────────────────────────

  test('project list load: table visible < 10s', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    await Promise.race([
      page.waitForSelector('table', { timeout: 10_000 }),
      page.waitForSelector('[data-testid="project-card"]', { timeout: 10_000 }),
      page.waitForSelector('[class*="DataTable"]', { timeout: 10_000 }),
      page.waitForSelector('main', { timeout: 10_000 }),
    ]).catch(() => {});

    const elapsed = Date.now() - start;
    annotate(test.info(), 'Project list table visible', elapsed, 10_000);
    test.info().annotations.push({
      type: 'timing-summary',
      description: `Project list load: ${elapsed}ms`,
    });
    expect.soft(elapsed, 'Project list should be visible in < 10s').toBeLessThan(10_000);
  });

  // ─── 4. Search responsiveness ────────────────────────────────────────────

  test('search responsiveness: results appear < 2s after typing', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Locate the first search / filter input on the page
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Поиск"], input[placeholder*="Search"], input[placeholder*="поиск"], input[placeholder*="Фильтр"]',
    ).first();

    const inputCount = await searchInput.count();
    if (inputCount === 0) {
      test.info().annotations.push({
        type: 'timing',
        description: '[SKIP] Search input not found on /projects',
      });
      return;
    }

    await searchInput.click();
    const start = Date.now();
    await searchInput.fill('тест');

    // Wait for any visual change: row count change, spinner disappearing, or results list
    await Promise.race([
      page.waitForSelector('[data-testid="search-results"]', { timeout: 2_000 }),
      page.waitForSelector('tbody tr', { timeout: 2_000 }),
      page.waitForFunction(
        () => document.querySelectorAll('tbody tr').length > 0,
        { timeout: 2_000 },
      ),
    ]).catch(() => {});

    const elapsed = Date.now() - start;
    annotate(test.info(), 'Search results appear', elapsed, 2_000);
    test.info().annotations.push({
      type: 'timing-summary',
      description: `Search responsiveness: ${elapsed}ms`,
    });
    expect.soft(elapsed, 'Search results should appear in < 2s').toBeLessThan(2_000);
  });

  // ─── 5. Form open speed ──────────────────────────────────────────────────

  test('form open speed: "create" button to form visible < 2s', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Locate the primary "create" / "add" button
    const createBtn = page.locator(
      'button:has-text("Создать"), button:has-text("Добавить"), button:has-text("+ Объект"), button:has-text("Create"), button[data-testid="create-btn"]',
    ).first();

    const btnCount = await createBtn.count();
    if (btnCount === 0) {
      test.info().annotations.push({
        type: 'timing',
        description: '[SKIP] Create button not found on /projects',
      });
      return;
    }

    const start = Date.now();
    await createBtn.click();

    // Wait for a modal or form to appear
    await Promise.race([
      page.waitForSelector('form', { timeout: 2_000 }),
      page.waitForSelector('[role="dialog"]', { timeout: 2_000 }),
      page.waitForSelector('[data-testid="modal"]', { timeout: 2_000 }),
      page.waitForSelector('input[name]', { timeout: 2_000 }),
    ]).catch(() => {});

    const elapsed = Date.now() - start;
    annotate(test.info(), 'Form open after create click', elapsed, 2_000);
    test.info().annotations.push({
      type: 'timing-summary',
      description: `Form open speed: ${elapsed}ms`,
    });
    expect.soft(elapsed, 'Form should open in < 2s').toBeLessThan(2_000);
  });

  // ─── 6. Table sort speed ─────────────────────────────────────────────────

  test('table sort speed: column header click re-renders < 1s', async ({ page }) => {
    await page.goto(`${BASE_URL}/employees`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Find any sortable column header (th with button or cursor-pointer)
    const sortableHeader = page.locator(
      'th button, th[class*="cursor-pointer"], th[class*="sortable"]',
    ).first();

    const headerCount = await sortableHeader.count();
    if (headerCount === 0) {
      test.info().annotations.push({
        type: 'timing',
        description: '[SKIP] No sortable column headers found on /employees',
      });
      return;
    }

    await sortableHeader.waitFor({ state: 'visible', timeout: 3_000 });
    const start = Date.now();
    await sortableHeader.click();

    // Wait for any sort indicator (aria-sort, chevron icon) or row refresh
    await Promise.race([
      page.waitForSelector('[aria-sort]', { timeout: 1_000 }),
      page.waitForSelector('th [class*="sort"]', { timeout: 1_000 }),
      page.waitForLoadState('networkidle', { timeout: 1_000 }),
    ]).catch(() => {});

    const elapsed = Date.now() - start;
    annotate(test.info(), 'Table sort re-render', elapsed, 1_000);
    test.info().annotations.push({
      type: 'timing-summary',
      description: `Table sort speed: ${elapsed}ms`,
    });
    expect.soft(elapsed, 'Table sort should complete in < 1s').toBeLessThan(1_000);
  });

  // ─── 7. Tab switching ────────────────────────────────────────────────────

  test('tab switching: switch tabs on detail page < 500ms', async ({ page }) => {
    // Use a detail-style page that has tabs — try financial-models or specifications
    await page.goto(`${BASE_URL}/financial-models`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Try to enter a record detail page (click first row or card link)
    const firstLink = page.locator('table tbody tr td a, [data-testid="row-link"]').first();
    if ((await firstLink.count()) > 0) {
      await firstLink.click().catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 10_000 });
    }

    // Find tab buttons
    const tabs = page.locator('[role="tab"], button[class*="tab"], div[class*="tab"] button');
    const tabCount = await tabs.count();

    if (tabCount < 2) {
      // Fall back to /procurement which has tabs
      await page.goto(`${BASE_URL}/procurement`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    const refreshedTabs = page.locator('[role="tab"]');
    const refreshedCount = await refreshedTabs.count();

    if (refreshedCount < 2) {
      test.info().annotations.push({
        type: 'timing',
        description: '[SKIP] No tabs found on target pages',
      });
      return;
    }

    // Click second tab and measure
    const start = Date.now();
    await refreshedTabs.nth(1).click();

    // Wait for tab panel to update
    await Promise.race([
      page.waitForSelector('[role="tabpanel"]', { timeout: 500 }),
      page.waitForFunction(() => {
        const panel = document.querySelector('[role="tabpanel"]');
        return panel !== null;
      }, { timeout: 500 }),
    ]).catch(() => {});

    const elapsed = Date.now() - start;
    annotate(test.info(), 'Tab switch render', elapsed, 500);
    test.info().annotations.push({
      type: 'timing-summary',
      description: `Tab switching: ${elapsed}ms`,
    });
    expect.soft(elapsed, 'Tab switch should complete in < 500ms').toBeLessThan(500);
  });

  // ─── 8. Morning routine (foreman) ────────────────────────────────────────

  test('foreman morning routine: dashboard → work-orders → daily-log < 15s', async ({ page }) => {
    const steps: { label: string; url: string; elapsed: number }[] = [];
    const routineStart = Date.now();

    // Step 1: Dashboard
    let stepStart = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    steps.push({ label: 'Dashboard', url: '/', elapsed: Date.now() - stepStart });

    // Step 2: Work orders
    stepStart = Date.now();
    await page.goto(`${BASE_URL}/operations/work-orders`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    steps.push({ label: 'Work orders', url: '/operations/work-orders', elapsed: Date.now() - stepStart });

    // Step 3: Daily log
    stepStart = Date.now();
    await page.goto(`${BASE_URL}/operations/daily-logs`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    steps.push({ label: 'Daily log', url: '/operations/daily-logs', elapsed: Date.now() - stepStart });

    const total = Date.now() - routineStart;
    const summary = steps.map((s) => `${s.label}: ${s.elapsed}ms`).join(' | ');
    annotate(test.info(), 'Foreman morning routine total', total, 15_000);
    test.info().annotations.push({ type: 'timing-summary', description: summary });

    for (const step of steps) {
      annotate(test.info(), `Foreman: ${step.label}`, step.elapsed, 10_000);
      expect.soft(step.elapsed, `${step.label} should load in < 10s`).toBeLessThan(10_000);
    }
    expect.soft(total, 'Foreman morning routine should complete in < 15s').toBeLessThan(15_000);
  });

  // ─── 9. Financial overview (CEO) ─────────────────────────────────────────

  test('CEO financial overview: dashboard → portfolio/health → cash-flow < 15s', async ({
    page,
  }) => {
    const steps: { label: string; elapsed: number }[] = [];
    const routineStart = Date.now();

    // Step 1: Dashboard
    let stepStart = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    steps.push({ label: 'Dashboard', elapsed: Date.now() - stepStart });

    // Step 2: Portfolio health — RAG matrix
    stepStart = Date.now();
    await page.goto(`${BASE_URL}/portfolio/health`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    steps.push({ label: 'Portfolio health', elapsed: Date.now() - stepStart });

    // Step 3: Cash flow
    stepStart = Date.now();
    await page.goto(`${BASE_URL}/cash-flow`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    steps.push({ label: 'Cash flow', elapsed: Date.now() - stepStart });

    const total = Date.now() - routineStart;
    const summary = steps.map((s) => `${s.label}: ${s.elapsed}ms`).join(' | ');
    annotate(test.info(), 'CEO financial overview total', total, 15_000);
    test.info().annotations.push({ type: 'timing-summary', description: summary });

    for (const step of steps) {
      annotate(test.info(), `CEO: ${step.label}`, step.elapsed, 10_000);
      expect.soft(step.elapsed, `${step.label} should load in < 10s`).toBeLessThan(10_000);
    }
    expect.soft(total, 'CEO financial overview should complete in < 15s').toBeLessThan(15_000);
  });

  // ─── 10. Procurement check ───────────────────────────────────────────────

  test('procurement check: specifications → competitive-registry → procurement < 15s', async ({
    page,
  }) => {
    const steps: { label: string; elapsed: number }[] = [];
    const routineStart = Date.now();

    // Step 1: Specifications
    let stepStart = Date.now();
    await page.goto(`${BASE_URL}/specifications`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    steps.push({ label: 'Specifications', elapsed: Date.now() - stepStart });

    // Step 2: Competitive registry (КЛ)
    stepStart = Date.now();
    await page.goto(`${BASE_URL}/specifications/competitive-registry`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    steps.push({ label: 'Competitive registry', elapsed: Date.now() - stepStart });

    // Step 3: Procurement
    stepStart = Date.now();
    await page.goto(`${BASE_URL}/procurement`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    steps.push({ label: 'Procurement', elapsed: Date.now() - stepStart });

    const total = Date.now() - routineStart;
    const summary = steps.map((s) => `${s.label}: ${s.elapsed}ms`).join(' | ');
    annotate(test.info(), 'Procurement check total', total, 15_000);
    test.info().annotations.push({ type: 'timing-summary', description: summary });

    for (const step of steps) {
      annotate(test.info(), `Procurement: ${step.label}`, step.elapsed, 10_000);
      expect.soft(step.elapsed, `${step.label} should load in < 10s`).toBeLessThan(10_000);
    }
    expect.soft(total, 'Procurement check should complete in < 15s').toBeLessThan(15_000);
  });
});
