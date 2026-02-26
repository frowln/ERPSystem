import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type Summary = {
  project: { id: string };
  budget: { id: string };
  estimate: { id: string };
  specification: { id: string };
  commercialProposal: { id: string };
  competitiveList: { id: string };
  contracts: { ids: string[]; customerContractId: string };
  invoices: { ids: string[] };
  payments?: { ids?: string[] };
};

const NOT_FOUND_PATTERN = /page not found|страница не найдена/i;
const INVALID_ID_PATTERN = /invalid uuid|некорректный формат id/i;

async function readSummary(): Promise<Summary> {
  const summaryPath = process.env.FINANCE_SUMMARY_FILE
    ?? path.resolve(process.cwd(), '..', 'scripts', 'seed_full_finmodel_demo_summary.json');
  const raw = await fs.readFile(summaryPath, 'utf8');
  return JSON.parse(raw) as Summary;
}

async function expectNotFoundIsAbsent(route: string, bodyText: string) {
  expect(bodyText, `Detected 404 fallback on route ${route}`).not.toMatch(NOT_FOUND_PATTERN);
}

async function expectInvalidIdToastIsAbsent(route: string, pageText: string) {
  expect(pageText, `Detected invalid-id error toast on route ${route}`).not.toMatch(INVALID_ID_PATTERN);
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

test.describe('Finance UI interactions', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });
  test.describe.configure({ mode: 'serial' });

  test('budget detail tabs, edit action, and FM tabs are interactive', async ({ page }) => {
    const summary = await readSummary();
    const route = `/budgets/${summary.budget.id}`;

    await gotoStable(page, route);
    await expect(page.locator('body')).toBeVisible();
    await expectNotFoundIsAbsent(route, await page.locator('body').innerText());

    const itemsTab = page.getByRole('tab', { name: /items|позиц/i }).first();
    if (await itemsTab.count()) {
      await itemsTab.click();
      await expect(page.locator('body')).toContainText(/planned|actual|committed|остат|заплан|факт/i);
    }

    const chartTab = page.getByRole('tab', { name: /chart|граф/i }).first();
    if (await chartTab.count()) {
      await chartTab.click();
      await expect(page.locator('body')).toContainText(/chart|план|факт|committed/i);
    }

    const editButton = page.getByRole('button', { name: /edit|редакт/i }).first();
    await expect(editButton).toBeVisible();
    await editButton.click();
    await expect(page).toHaveURL(new RegExp(`/budgets/${summary.budget.id}/edit$`));
    await expect(page.locator('form')).toBeVisible();

    const fmRoute = `/budgets/${summary.budget.id}/fm`;
    await gotoStable(page, fmRoute);
    await expect(page.locator('body')).toBeVisible();
    await expectNotFoundIsAbsent(fmRoute, await page.locator('body').innerText());

    const materialsTab = page.getByRole('button', { name: /materials|материалы/i }).first();
    if (await materialsTab.count()) {
      await materialsTab.click();
      await expect(page.locator('body')).toContainText(/materials|материалы/i);
    }

    const worksTab = page.getByRole('button', { name: /works|работы/i }).first();
    if (await worksTab.count()) {
      await worksTab.click();
      await expect(page.locator('body')).toContainText(/works|работы/i);
    }
  });

  test('contract tabs open and show linked finance context', async ({ page }) => {
    const summary = await readSummary();
    const route = `/contracts/${summary.contracts.ids[0]}`;

    await gotoStable(page, route);
    await expect(page.locator('body')).toBeVisible();
    await expectNotFoundIsAbsent(route, await page.locator('body').innerText());

    const fmTab = page.getByRole('tab', { name: /fm items|financial model|финансов/i }).first();
    if (await fmTab.count()) {
      await fmTab.click();
      await expect(page.locator('body')).toContainText(/financial model items|fm item|linked items|привяз|финансов/i);
    }

    const financeTab = page.getByRole('tab', { name: /finance|финанс/i }).first();
    if (await financeTab.count()) {
      await financeTab.click();
      await expect(page.locator('body')).toContainText(/invoic|paid|balance|опла|сальдо|amount|сумм/i);
    }
  });

  test('commercial proposal and competitive list interactions work', async ({ page }) => {
    const summary = await readSummary();
    const cpRoute = `/commercial-proposals/${summary.commercialProposal.id}`;

    await gotoStable(page, cpRoute);
    await expect(page.locator('body')).toBeVisible();
    await expectNotFoundIsAbsent(cpRoute, await page.locator('body').innerText());

    const worksTab = page.getByRole('tab', { name: /works|работы/i }).first();
    if (await worksTab.count()) {
      await worksTab.click();
      await expect(page.locator('body')).toContainText(/planned price|coefficient|коэффициент|плановая/i);
    }

    const clRoute = `/specifications/${summary.specification.id}/competitive-list/${summary.competitiveList.id}`;
    await gotoStable(page, clRoute);
    await expect(page.locator('body')).toBeVisible();
    await expectNotFoundIsAbsent(clRoute, await page.locator('body').innerText());

    const positionCard = page.locator('div').filter({ hasText: /best price|лучшая цена/i }).first();
    if (await positionCard.count()) {
      await positionCard.click();
      await page.waitForTimeout(400);
    }

    await expect(page.locator('body')).toContainText(/vendor proposals|поставщик|предложен|best price/i);
  });

  test('critical finance routes do not fall into 404 page', async ({ page }) => {
    const summary = await readSummary();
    const routes = [
      '/',
      '/budgets',
      `/budgets/${summary.budget.id}`,
      `/budgets/${summary.budget.id}/fm`,
      '/contracts',
      `/contracts/${summary.contracts.ids[0]}`,
      `/contracts/${summary.contracts.customerContractId}`,
      '/commercial-proposals',
      `/commercial-proposals/${summary.commercialProposal.id}`,
      '/invoices',
      `/invoices/${summary.invoices.ids[0]}`,
      '/estimates',
      `/estimates/${summary.estimate.id}`,
      '/specifications',
      `/specifications/${summary.specification.id}`,
      `/specifications/${summary.specification.id}/competitive-list/${summary.competitiveList.id}`,
      '/specifications/analogs',
      '/specifications/analog-requests',
      '/payments',
      ...(summary.payments?.ids?.[0] ? [`/payments/${summary.payments.ids[0]}`] : []),
      '/contracts/new',
      '/commercial-proposals/new',
      '/invoices/new',
      '/estimates/new',
      '/specifications/new',
      '/payments/new',
      // Legacy deep-links kept for backward compatibility.
      '/finance/budgets',
      `/finance/budgets/${summary.budget.id}`,
      `/finance/budgets/${summary.budget.id}/fm`,
      '/finance/commercial-proposals',
      `/finance/commercial-proposals/${summary.commercialProposal.id}`,
      '/finance/commercial-proposals/new',
      '/finance/invoices',
      `/finance/invoices/${summary.invoices.ids[0]}`,
      '/finance/invoices/new',
      '/finance/payments',
      ...(summary.payments?.ids?.[0] ? [`/finance/payments/${summary.payments.ids[0]}`] : []),
      '/finance/payments/new',
      '/finance/contracts',
      '/finance/estimates',
      '/finance/specifications',
    ];

    for (const route of routes) {
      await gotoStable(page, route);
      await expect(page.locator('body')).toBeVisible();
      const bodyText = await page.locator('body').innerText();
      await expectNotFoundIsAbsent(route, bodyText);
      await expectInvalidIdToastIsAbsent(route, bodyText);
    }
  });
});
