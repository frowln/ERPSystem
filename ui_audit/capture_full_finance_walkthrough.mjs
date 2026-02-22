import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SUMMARY_FILE = process.env.SUMMARY_FILE ?? path.resolve(ROOT, 'scripts/seed_full_finmodel_demo_summary.json');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:13000';
const EMAIL = process.env.PRIVOD_EMAIL ?? 'admin@privod.ru';
const PASSWORD = process.env.PRIVOD_PASSWORD ?? 'admin123';

async function readSummary() {
  const raw = await fs.readFile(SUMMARY_FILE, 'utf8');
  return JSON.parse(raw);
}

async function login(apiRoot) {
  const response = await fetch(`${apiRoot}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Login failed (${response.status}): ${body}`);
  }
  const payload = await response.json();
  const data = payload?.data ?? {};
  if (!data?.accessToken || !data?.user) {
    throw new Error('Login response does not contain accessToken/user');
  }
  return data;
}

function safeName(value) {
  return String(value ?? '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function gotoAndShot(page, outputDir, fileName, route, waitMs = 2500) {
  const url = `${BASE_URL}${route}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(waitMs);
  await page.screenshot({
    path: path.join(outputDir, fileName),
    fullPage: true,
  });
  // eslint-disable-next-line no-console
  console.log(`saved: ${fileName} <- ${route}`);
}

async function clickByTextIfExists(page, patterns, options = {}) {
  const timeout = options.timeout ?? 2000;
  for (const pattern of patterns) {
    const button = page.getByRole('button', { name: pattern });
    if (await button.count()) {
      try {
        await button.first().click({ timeout });
        return true;
      } catch {
        // continue
      }
    }
    const tab = page.getByRole('tab', { name: pattern });
    if (await tab.count()) {
      try {
        await tab.first().click({ timeout });
        return true;
      } catch {
        // continue
      }
    }
    const text = page.getByText(pattern);
    if (await text.count()) {
      try {
        await text.first().click({ timeout });
        return true;
      } catch {
        // continue
      }
    }
  }
  return false;
}

async function selectAlternativeCompetitiveListPosition(page) {
  const positionHeading = page
    .locator('h2')
    .filter({ hasText: /Position|Позици/i })
    .first();

  if (!(await positionHeading.count())) {
    return false;
  }

  const itemButtons = positionHeading.locator(
    'xpath=ancestor::div[contains(@class,"overflow-hidden")]//div[contains(@class,"overflow-y-auto")]//button',
  );
  const count = await itemButtons.count();
  if (!count) {
    return false;
  }

  const targetIndex = count > 1 ? 1 : 0;
  try {
    await itemButtons.nth(targetIndex).click({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const summary = await readSummary();
  const runId = summary?.runId ?? new Date().toISOString().slice(0, 10);
  const outputDir = path.resolve(ROOT, 'ui_audit', `full_walkthrough_${safeName(runId)}`);
  await fs.mkdir(outputDir, { recursive: true });

  const loginData = await login(summary.apiRoot ?? 'http://localhost:18080/api');
  const authState = {
    user: loginData.user,
    token: loginData.accessToken,
    refreshToken: loginData.refreshToken,
    isAuthenticated: true,
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await context.addInitScript((state) => {
    localStorage.setItem('privod-auth', JSON.stringify({ state, version: 0 }));
    localStorage.setItem('privod-locale', 'ru');
    localStorage.setItem('privod-lang', 'ru');
  }, authState);

  const page = await context.newPage();
  page.on('pageerror', (error) => {
    // eslint-disable-next-line no-console
    console.error(`pageerror: ${error.message}`);
  });

  const projectId = summary.project.id;
  const budgetId = summary.budget.id;
  const estimateId = summary.estimate.id;
  const specId = summary.specification.id;
  const cpId = summary.commercialProposal.id;
  const clId = summary.competitiveList.id;
  const firstContractId = summary.contracts.ids[0];
  const customerContractId = summary.contracts.customerContractId;
  const firstInvoiceId = summary.invoices.ids[0];
  const firstPaymentId = summary.payments?.ids?.[0];

  await gotoAndShot(page, outputDir, '01-dashboard.png', '/');
  await gotoAndShot(page, outputDir, '02-projects-list.png', '/projects');
  await gotoAndShot(page, outputDir, '03-project-detail.png', `/projects/${projectId}`);

  await gotoAndShot(page, outputDir, '04-budgets-list.png', '/budgets');
  await gotoAndShot(page, outputDir, '05-budget-detail-all.png', `/budgets/${budgetId}`);

  await clickByTextIfExists(page, [/Items/i, /Позици/i]);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '06-budget-detail-items.png'), fullPage: true });

  await clickByTextIfExists(page, [/Chart/i, /Граф/i]);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '07-budget-detail-chart.png'), fullPage: true });

  await gotoAndShot(page, outputDir, '08-budget-edit-form.png', `/budgets/${budgetId}/edit`, 1400);
  await gotoAndShot(page, outputDir, '08b-budget-fm-all.png', `/budgets/${budgetId}/fm`);

  await gotoAndShot(page, outputDir, '09-contracts-list.png', '/contracts');
  await gotoAndShot(page, outputDir, '10-contract-form-new.png', '/contracts/new');
  await gotoAndShot(page, outputDir, '11-contract-detail-contractor-overview.png', `/contracts/${firstContractId}`);
  await clickByTextIfExists(page, [/FM Items/i, /ФМ/i, /Financial model/i]);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '12-contract-detail-contractor-fm-items.png'), fullPage: true });

  await gotoAndShot(page, outputDir, '13-contract-detail-customer-overview.png', `/contracts/${customerContractId}`);
  await clickByTextIfExists(page, [/FM Items/i, /ФМ/i, /Financial model/i]);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outputDir, '14-contract-detail-customer-fm-items.png'), fullPage: true });

  await gotoAndShot(page, outputDir, '15-commercial-proposals-list.png', '/commercial-proposals');
  await gotoAndShot(page, outputDir, '16-commercial-proposal-detail-materials.png', `/commercial-proposals/${cpId}`);
  await page.waitForTimeout(500);
  await clickByTextIfExists(page, [/Works/i, /Работы/i]);
  try {
    await page.waitForSelector('text=/Coefficient|Коэффициент/i', { timeout: 4000 });
  } catch {
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: path.join(outputDir, '17-commercial-proposal-detail-works.png'), fullPage: true });
  await gotoAndShot(page, outputDir, '18-commercial-proposal-form-new.png', '/commercial-proposals/new');

  await gotoAndShot(page, outputDir, '19-invoices-list.png', '/invoices');
  await gotoAndShot(page, outputDir, '20-invoice-detail.png', `/invoices/${firstInvoiceId}`);
  await gotoAndShot(page, outputDir, '21-invoice-form-new.png', '/invoices/new');

  await gotoAndShot(page, outputDir, '22-estimates-list.png', '/estimates');
  await gotoAndShot(page, outputDir, '23-estimate-detail.png', `/estimates/${estimateId}`);
  await gotoAndShot(page, outputDir, '24-estimate-form-new.png', '/estimates/new');

  await gotoAndShot(page, outputDir, '25-specifications-list.png', '/specifications');
  await gotoAndShot(page, outputDir, '26-specification-detail.png', `/specifications/${specId}`);
  await gotoAndShot(page, outputDir, '27-specification-form-new.png', '/specifications/new');
  await gotoAndShot(page, outputDir, '28-material-analogs.png', '/specifications/analogs');
  await gotoAndShot(page, outputDir, '29-competitive-list-detail.png', `/specifications/${specId}/competitive-list/${clId}`, 3000);
  const switchedPosition = await selectAlternativeCompetitiveListPosition(page);
  if (!switchedPosition) {
    await clickByTextIfExists(page, [/Add Proposal/i, /Добавить предложение/i]);
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outputDir, '30-competitive-list-selected-position.png'), fullPage: true });

  await gotoAndShot(page, outputDir, '31-payments-list.png', '/payments');
  if (firstPaymentId) {
    await gotoAndShot(page, outputDir, '32-payment-detail.png', `/payments/${firstPaymentId}`);
  }
  await gotoAndShot(page, outputDir, '33-payment-form-new.png', '/payments/new');

  await context.close();
  await browser.close();

  // eslint-disable-next-line no-console
  console.log(`screenshots_dir=${outputDir}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
