import { expect, type Page } from '@playwright/test';

/**
 * Shared smoke-test utilities for PRIVOD platform.
 * Verifies pages load correctly, render content, and have no crashes.
 */

const IGNORED_CONSOLE =
  /favicon|ResizeObserver|net::ERR_|React DevTools|Warning:|ChunkLoad|Hydration|websocket|HMR|Failed to load resource/;

export interface SmokeResult {
  ms: number;
  body: string;
  errors: string[];
}

/**
 * Core smoke check: navigate to URL and verify it loads correctly.
 * Asserts: load <5s, body >50 chars, no crash messages.
 */
export async function smokeCheck(
  page: Page,
  url: string,
): Promise<SmokeResult> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !IGNORED_CONSOLE.test(msg.text()))
      errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`PAGE_ERROR: ${err.message}`));

  const start = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  const ms = Date.now() - start;

  const body = (await page.textContent('body')) ?? '';

  expect(ms, `${url} should load in <5s`).toBeLessThan(5000);
  expect(body.length, `${url} should render content`).toBeGreaterThan(50);
  expect(body).not.toContain('Something went wrong');
  expect(body).not.toContain('Cannot read properties');

  if (errors.length > 0) {
    console.warn(`[console errors] ${url}: ${errors.join(' | ')}`);
  }

  return { ms, body, errors };
}

/** Verify a page renders a data table with headers and rows or empty state. */
export async function expectTable(page: Page): Promise<void> {
  const headers = page.locator('th, [role="columnheader"]');
  await expect(headers.first()).toBeVisible({ timeout: 10_000 });
  expect(await headers.count()).toBeGreaterThan(0);

  const rows = page.locator('tbody tr, [role="row"]');
  const rowCount = await rows.count();
  const emptyState = page.locator(
    'text=/нет данных|пусто|no data|ничего не найдено|нет записей/i',
  );
  const hasEmpty = await emptyState.first().isVisible().catch(() => false);
  expect(
    rowCount > 0 || hasEmpty,
    'Table should have rows or show empty state',
  ).toBe(true);
}

/** Verify a dashboard page has KPI cards, charts, or content sections. */
export async function expectDashboard(page: Page): Promise<void> {
  const indicators = page.locator(
    [
      '[class*="card"]',
      '[class*="stat"]',
      '[class*="kpi"]',
      '[class*="metric"]',
      'canvas',
      'svg.recharts-surface',
      '[class*="chart"]',
    ].join(', '),
  );
  await page.waitForTimeout(1000);
  const count = await indicators.count();
  const sections = await page.locator('h2, h3, section').count();
  expect(
    count > 0 || sections > 0,
    'Dashboard should have cards, charts, or content sections',
  ).toBe(true);
}

/** Verify dark mode: no white backgrounds in main content area. */
export async function checkDarkMode(
  page: Page,
  url: string,
): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.waitForTimeout(500);

  const bgColor = await page.evaluate(() => {
    const el =
      document.querySelector('main, [role="main"], .content') ||
      document.body;
    return getComputedStyle(el).backgroundColor;
  });
  expect(bgColor, 'Dark mode should not have white background').not.toBe(
    'rgb(255, 255, 255)',
  );
}
