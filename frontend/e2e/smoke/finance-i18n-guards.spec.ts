import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type Summary = {
  estimate: { id: string };
  specification: { id: string };
  commercialProposal: { id: string };
  competitiveList: { id: string };
};

const RAW_I18N_KEY_PATTERN = /\b(?:estimates|specifications|competitiveList|commercialProposal|navigation)\.[a-zA-Z0-9_.-]+/g;

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
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      const text = await page.locator('body').innerText();
      await expectNoRawI18nKeys(route, text);
    }
  });
});
