/**
 * DEEP PRE-CONSTRUCTION AUDIT — single test, sequential navigation.
 * Uses the real project PRJ-00062 (ЖК Приморский) that has actual data.
 */
import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIR = path.resolve(__dirname, '../audit-screenshots');

test.use({ storageState: 'e2e/.auth/user.json' });

test('Deep audit of all pre-construction pages', async ({ page }) => {
  test.setTimeout(300_000);

  const shot = async (name: string) => {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: true });
  };

  const go = async (url: string) => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
  };

  // ─── 0. DASHBOARD ───
  await go('/');
  await shot('00-dashboard');

  // ─── 1. CRM ───
  await go('/crm/dashboard');
  await shot('01a-crm-dashboard');

  await go('/crm/leads');
  await shot('01b-crm-leads-kanban');

  // Switch to list view
  const listBtn = page.locator('button:has-text("Список")');
  if (await listBtn.isVisible()) {
    await listBtn.click();
    await page.waitForTimeout(800);
    await shot('01c-crm-leads-list');
  }

  // Click first lead for detail
  const leadRow = page.locator('table tbody tr').first();
  if (await leadRow.isVisible()) {
    await leadRow.click();
    await page.waitForTimeout(1500);
    await shot('01d-crm-lead-detail');
  }

  await go('/portfolio/opportunities');
  await shot('01e-opportunities');

  // ─── 2. SITE ASSESSMENTS ───
  await go('/site-assessments');
  await shot('02-site-assessments');

  // ─── 3. COUNTERPARTIES ───
  await go('/counterparties');
  await shot('03-counterparties');

  // ─── 4. PROJECTS ───
  await go('/projects');
  await shot('04a-projects-list');

  // Get real project ID (PRJ-00062 = ЖК Приморский)
  // Find it by clicking the row or reading the API
  let projectId = '';
  const projRows = page.locator('table tbody tr');
  const rowCount = await projRows.count();
  for (let i = 0; i < rowCount; i++) {
    const text = await projRows.nth(i).innerText();
    if (text.includes('Приморский') || text.includes('PRJ-00062')) {
      await projRows.nth(i).click();
      await page.waitForURL(/\/projects\//);
      await page.waitForTimeout(1500);
      projectId = page.url().match(/\/projects\/([^/?#]+)/)?.[1] || '';
      break;
    }
  }

  // If couldn't find PRJ-00062, use first project with data
  if (!projectId) {
    await projRows.first().click();
    await page.waitForURL(/\/projects\//);
    await page.waitForTimeout(1500);
    projectId = page.url().match(/\/projects\/([^/?#]+)/)?.[1] || '';
  }

  await shot('04b-project-overview');

  // Project tabs
  const tabs = ['Команда', 'Документы', 'Финансы', 'Предстроительный этап'];
  const tabFiles = ['04c-project-team', '04d-project-docs', '04e-project-finance', '04f-project-preconstruction'];
  for (let i = 0; i < tabs.length; i++) {
    const tab = page.locator(`button:has-text("${tabs[i]}")`).first();
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(1500);
      await shot(tabFiles[i]);
    }
  }

  // Scroll down on preconstruction tab to see all panels
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await shot('04g-project-preconstruction-bottom');

  // ─── 5. RISK REGISTER ───
  if (projectId) {
    await go(`/projects/${projectId}/risks`);
    await shot('05a-risk-register');
    // Scroll to see table
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);
    await shot('05b-risk-register-table');
  }

  // ─── 6. PRE-CONSTRUCTION MEETING ───
  if (projectId) {
    await go(`/projects/${projectId}/meeting`);
    await shot('06a-meeting-top');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot('06b-meeting-bottom');
  }

  // ─── 7. SPECIFICATIONS ───
  await go('/specifications');
  await shot('07a-specs-list');

  // Click first spec to see detail
  const specRow = page.locator('table tbody tr').first();
  if (await specRow.isVisible()) {
    await specRow.click();
    await page.waitForTimeout(2000);
    await shot('07b-spec-detail');
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot('07c-spec-detail-bottom');
  }

  await go('/specifications/new');
  await shot('07d-spec-form');

  // ─── 8. ESTIMATES ───
  await go('/estimates');
  await shot('08a-estimates-list');

  const estRow = page.locator('table tbody tr').first();
  if (await estRow.isVisible()) {
    await estRow.click();
    await page.waitForTimeout(2000);
    await shot('08b-estimate-detail');
  }

  await go('/estimates/pricing/databases');
  await shot('08c-pricing-databases');

  await go('/estimates/pricing/rates');
  await shot('08d-pricing-rates');

  await go('/estimates/pricing/calculate');
  await shot('08e-pricing-calculator');

  // ─── 9. BUDGETS & FINANCIAL MODEL ───
  await go('/budgets');
  await shot('09a-budgets-list');

  // Click first budget
  const budgetRow = page.locator('table tbody tr').first();
  let budgetId = '';
  if (await budgetRow.isVisible()) {
    await budgetRow.click();
    await page.waitForTimeout(2000);
    budgetId = page.url().match(/\/budgets\/([^/?#]+)/)?.[1] || '';
    await shot('09b-budget-detail');
  }

  // FM page
  if (budgetId) {
    await go(`/budgets/${budgetId}/fm`);
    await shot('09c-fm-all');

    // Scroll to see items
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await shot('09d-fm-all-items');

    // Tab: Works
    const worksTab = page.locator('button:has-text("Работы")');
    if (await worksTab.isVisible()) {
      await worksTab.click();
      await page.waitForTimeout(1000);
      await shot('09e-fm-works');
    }

    // Tab: Materials
    const matsTab = page.locator('button:has-text("Материалы")');
    if (await matsTab.isVisible()) {
      await matsTab.click();
      await page.waitForTimeout(1000);
      await shot('09f-fm-materials');
    }

    // Tab: CVR (СВР)
    const cvrTab = page.locator('button:has-text("СВР")');
    if (await cvrTab.isVisible()) {
      await cvrTab.click();
      await page.waitForTimeout(1000);
      await shot('09g-fm-cvr');
    }

    // Tab: Snapshots
    const snapTab = page.locator('button:has-text("Снимки")');
    if (await snapTab.isVisible()) {
      await snapTab.click();
      await page.waitForTimeout(1000);
      await shot('09h-fm-snapshots');
    }

    // Tab: VE
    const veTab = page.locator('button:has-text("Оптимизация"), button:has-text("VE")');
    if (await veTab.isVisible()) {
      await veTab.click();
      await page.waitForTimeout(1000);
      await shot('09i-fm-ve');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await shot('09j-fm-ve-table');
    }
  }

  // ─── 10. COMMERCIAL PROPOSALS ───
  await go('/commercial-proposals');
  await shot('10a-cp-list');

  const cpRow = page.locator('table tbody tr').first();
  if (await cpRow.isVisible()) {
    await cpRow.click();
    await page.waitForTimeout(2000);
    await shot('10b-cp-detail');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot('10c-cp-detail-bottom');
  }

  // ─── 11. BID COMPARISON / COMPETITIVE LISTS ───
  await go('/portfolio/bid-comparison');
  await shot('11-bid-comparison');

  // ─── 12. CONTRACTS ───
  await go('/contracts');
  await shot('12a-contracts-list');

  const contractRow = page.locator('table tbody tr').first();
  if (await contractRow.isVisible()) {
    await contractRow.click();
    await page.waitForTimeout(2000);
    await shot('12b-contract-detail');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot('12c-contract-detail-bottom');
  }

  await go('/contracts/new');
  await page.waitForTimeout(1000);
  await shot('12d-contract-form-top');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await shot('12e-contract-form-bottom');

  // ─── 13. PROCUREMENT ───
  await go('/procurement');
  await shot('13a-procurement-list');

  const prRow = page.locator('table tbody tr').first();
  if (await prRow.isVisible()) {
    await prRow.click();
    await page.waitForTimeout(2000);
    await shot('13b-purchase-request-detail');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot('13c-purchase-request-bottom');
  }

  // ─── 14. VENDOR PREQUALIFICATION ───
  await go('/procurement/prequalification');
  await shot('14-prequalification');

  // ─── 15. TENDERS ───
  await go('/portfolio/tenders');
  await shot('15-tenders');

  // ─── 16. EVM ───
  await go('/planning/evm');
  await shot('16-evm');

  // ─── 17. FINANCIAL MODELS LIST ───
  await go('/financial-models');
  await shot('17-financial-models');

  // ─── 18. PROJECT FORM (new) ───
  await go('/projects/new');
  await page.waitForTimeout(1000);
  await shot('18a-project-form-top');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await shot('18b-project-form-bottom');
});
