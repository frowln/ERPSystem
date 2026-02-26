import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type Summary = {
  budget: { id: string };
  estimate: { id: string };
  specification: { id: string };
  commercialProposal: { id: string };
  competitiveList: { id: string };
};

const RAW_I18N_KEY_PATTERN = /\b(?:estimates|specifications|competitiveList|commercialProposal|navigation)\.[a-zA-Z0-9_.-]+/g;
const EN_FALLBACK_PHRASES = [
  'Search placeholder',
  'Page not found',
  'Loading...',
] as const;

async function readSummary(): Promise<Summary> {
  const summaryPath = process.env.FINANCE_SUMMARY_FILE
    ?? path.resolve(process.cwd(), '..', 'scripts', 'seed_full_finmodel_demo_summary.json');
  const raw = await fs.readFile(summaryPath, 'utf8');
  return JSON.parse(raw) as Summary;
}

async function expectNoRawI18nKeys(pageUrl: string, pageText: string) {
  const matches = pageText.match(RAW_I18N_KEY_PATTERN) ?? [];
  const unique = [...new Set(matches)];
  expect(
    unique,
    `Detected raw i18n keys on ${pageUrl}: ${unique.join(', ')}`,
  ).toHaveLength(0);
}

async function expectNoFallbackEnglish(pageUrl: string, pageText: string) {
  const found = EN_FALLBACK_PHRASES.filter((phrase) => pageText.includes(phrase));
  expect(
    found,
    `Detected fallback EN phrases on ${pageUrl}: ${found.join(', ')}`,
  ).toHaveLength(0);
}

async function gotoStable(page: import('@playwright/test').Page, route: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(400 * (attempt + 1));
    }
  }
  throw lastError;
}

test.describe('Finance i18n guards', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('critical finance pages do not render raw i18n keys', async ({ page }) => {
    const summary = await readSummary();

    const routes = [
      '/estimates',
      `/estimates/${summary.estimate.id}`,
      '/specifications',
      `/specifications/${summary.specification.id}`,
      `/specifications/${summary.specification.id}/competitive-list/${summary.competitiveList.id}`,
      '/commercial-proposals',
      `/commercial-proposals/${summary.commercialProposal.id}`,
    ];

    for (const route of routes) {
      await gotoStable(page, route);
      await expect(page.locator('body')).toBeVisible();
      const text = await page.locator('body').innerText();
      await expectNoRawI18nKeys(route, text);
      await expectNoFallbackEnglish(route, text);
    }
  });

  test('budget detail renders russian labels when locale is forced to ru', async ({ page }) => {
    const summary = await readSummary();

    await page.addInitScript(() => {
      localStorage.setItem('privod_locale', 'ru');
    });

    await gotoStable(page, `/budgets/${summary.budget.id}`);
    await expect(page.locator('body')).toBeVisible();

    await expect(page.getByText(/План выручка/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Обзор$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Статьи$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Диаграмма$/i })).toBeVisible();

    await expect(page.getByText(/PLANNED REVENUE/i)).toHaveCount(0);
  });
});
