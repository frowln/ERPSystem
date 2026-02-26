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
};

async function readSummary(): Promise<Summary> {
  const summaryPath = process.env.FINANCE_SUMMARY_FILE
    ?? path.resolve(process.cwd(), '..', 'scripts', 'seed_full_finmodel_demo_summary.json');
  const raw = await fs.readFile(summaryPath, 'utf8');
  return JSON.parse(raw) as Summary;
}

function isCriticalConsoleError(text: string): boolean {
  const ignored = [
    'favicon.ico',
    'ResizeObserver loop limit exceeded',
    'Failed to load resource: the server responded with a status of 404',
    'Failed to load resource: net::ERR_CONNECTION_RESET',
  ];
  return !ignored.some((pattern) => text.includes(pattern));
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

test.describe('Finance critical flow smoke', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('seeded finance chain pages are navigable end-to-end', async ({ page }) => {
    test.setTimeout(120000);
    const summary = await readSummary();
    const errors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && isCriticalConsoleError(msg.text())) {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await gotoStable(page, `/projects/${summary.project.id}`);
    await expect(page).toHaveURL(new RegExp(`/projects/${summary.project.id}$`));
    await expect(page.locator('body')).toBeVisible();

    await gotoStable(page, `/budgets/${summary.budget.id}`);
    await expect(page).toHaveURL(new RegExp(`/budgets/${summary.budget.id}$`));
    const budgetTable = page.locator('table').first();
    const hasVisibleBudgetTable = await budgetTable.isVisible({ timeout: 8_000 }).catch(() => false);
    if (hasVisibleBudgetTable) {
      await expect(budgetTable).toBeVisible();
    } else {
      await expect(page.locator('body')).toContainText(
        /нет статей|добавьте статьи бюджета|no items|add budget items|категория|наименование|план/i,
      );
    }

    const materialsTab = page.getByRole('tab', { name: /materials|материалы/i });
    if (await materialsTab.count()) {
      await materialsTab.first().click();
      await expect(page.locator('table').first()).toBeVisible();
    }
    const worksTab = page.getByRole('tab', { name: /works|работы/i });
    if (await worksTab.count()) {
      await worksTab.first().click();
      await expect(page.locator('table').first()).toBeVisible();
    }

    const contractorContractId = summary.contracts.ids[0];
    await gotoStable(page, `/contracts/${contractorContractId}`);
    await expect(page).toHaveURL(new RegExp(`/contracts/${contractorContractId}$`));
    await expect(page.locator('body')).toBeVisible();
    const fmTab = page.getByRole('tab', { name: /fm items|financial model|фм/i });
    if (await fmTab.count()) {
      await fmTab.first().click();
      await expect(page.locator('body')).toContainText(/financial model|фм|link/i);
    }

    await gotoStable(page, `/contracts/${summary.contracts.customerContractId}`);
    await expect(page).toHaveURL(new RegExp(`/contracts/${summary.contracts.customerContractId}$`));
    await expect(page.locator('body')).toBeVisible();

    await gotoStable(page, `/commercial-proposals/${summary.commercialProposal.id}`);
    await expect(page).toHaveURL(new RegExp(`/commercial-proposals/${summary.commercialProposal.id}$`));
    await expect(page.locator('table').first()).toBeVisible();
    if (await worksTab.count()) {
      await worksTab.first().click();
      await expect(page.locator('table').first()).toBeVisible();
    }

    const firstInvoiceId = summary.invoices.ids[0];
    await gotoStable(page, `/invoices/${firstInvoiceId}`);
    await expect(page).toHaveURL(new RegExp(`/invoices/${firstInvoiceId}$`));
    await expect(page.locator('body')).toBeVisible();

    await gotoStable(page, `/estimates/${summary.estimate.id}`);
    await expect(page).toHaveURL(new RegExp(`/estimates/${summary.estimate.id}$`));
    await expect(page.locator('table').first()).toBeVisible();

    await gotoStable(page, `/specifications/${summary.specification.id}`);
    await expect(page).toHaveURL(new RegExp(`/specifications/${summary.specification.id}$`));
    await expect(page.locator('table').first()).toBeVisible();

    await gotoStable(page, `/specifications/${summary.specification.id}/competitive-list/${summary.competitiveList.id}`);
    await expect(page).toHaveURL(
      new RegExp(`/specifications/${summary.specification.id}/competitive-list/${summary.competitiveList.id}$`),
    );
    await expect
      .poll(
        async () => page.locator('body').innerText(),
        { timeout: 60000, intervals: [500, 1000, 2000] },
      )
      .toMatch(/vendor|proposal|пози|поставщик|предложени/i);

    expect(errors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });
});
