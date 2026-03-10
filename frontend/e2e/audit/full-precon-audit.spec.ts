/**
 * FULL PRE-CONSTRUCTION AUDIT
 * Navigate every page in pre-construction flow, take full-page screenshots,
 * log all text content for analysis.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../audit-screenshots');

async function shot(page: import('@playwright/test').Page, name: string) {
  await page.waitForTimeout(1500); // let data load
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${name}.png`,
    fullPage: true,
  });
}

async function go(page: import('@playwright/test').Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
}

// Shared state for IDs discovered during navigation
let projectId = '';
let budgetId = '';
let specId = '';
let estimateId = '';
let cpId = '';
let contractId = '';
let prId = '';

test.describe.serial('Pre-Construction Full Audit', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  // ============================================================================
  // PHASE 0: MAIN DASHBOARD
  // ============================================================================
  test('Phase 0: Main Dashboard', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/');
    await shot(page, '00-dashboard');
  });

  // ============================================================================
  // PHASE 1: CRM — Leads & Opportunities
  // ============================================================================
  test('Phase 1a: CRM Dashboard', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/crm/dashboard');
    await shot(page, '01a-crm-dashboard');
  });

  test('Phase 1b: CRM Leads List', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/crm/leads');
    await shot(page, '01b-crm-leads');
  });

  test('Phase 1c: CRM Lead Detail (first lead)', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/crm/leads');
    // Click first lead row
    const firstRow = page.locator('table tbody tr, [data-testid*="lead"]').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(1500);
      await shot(page, '01c-crm-lead-detail');
    } else {
      await shot(page, '01c-crm-leads-empty');
    }
  });

  test('Phase 1d: Opportunities / Portfolio', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/portfolio/opportunities');
    await shot(page, '01d-opportunities');
  });

  // ============================================================================
  // PHASE 2: Site Assessment
  // ============================================================================
  test('Phase 2: Site Assessments', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/site-assessments');
    await shot(page, '02-site-assessments');
  });

  // ============================================================================
  // PHASE 3: Projects — List & Creation
  // ============================================================================
  test('Phase 3a: Projects List', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/projects');
    await shot(page, '03a-projects-list');

    // Find first project ID from URL
    const rows = page.locator('table tbody tr a, [href*="/projects/"]');
    const count = await rows.count();
    if (count > 0) {
      const href = await rows.first().getAttribute('href');
      if (href) {
        const match = href.match(/\/projects\/([^/]+)/);
        if (match) projectId = match[1];
      }
    }
  });

  test('Phase 3b: Project Creation Form', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/projects/new');
    await shot(page, '03b-project-form');
  });

  test('Phase 3c: Project Detail — Overview tab', async ({ page }) => {
    test.setTimeout(30_000);
    if (!projectId) {
      // Find a project
      await go(page, '/projects');
      const link = page.locator('a[href*="/projects/"]').first();
      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        projectId = href?.match(/\/projects\/([^/]+)/)?.[1] || '';
        await link.click();
        await page.waitForTimeout(2000);
      }
    } else {
      await go(page, `/projects/${projectId}`);
    }
    await shot(page, '03c-project-detail-overview');
  });

  test('Phase 3d: Project Detail — Team tab', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, `/projects/${projectId}`);
    const teamTab = page.getByRole('tab', { name: /команд/i }).or(page.locator('button:has-text("Команда")'));
    if (await teamTab.isVisible()) {
      await teamTab.click();
      await page.waitForTimeout(1000);
    }
    await shot(page, '03d-project-team');
  });

  test('Phase 3e: Project Detail — Documents tab', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, `/projects/${projectId}`);
    const docsTab = page.getByRole('tab', { name: /документ/i }).or(page.locator('button:has-text("Документы")'));
    if (await docsTab.isVisible()) {
      await docsTab.click();
      await page.waitForTimeout(1000);
    }
    await shot(page, '03e-project-documents');
  });

  test('Phase 3f: Project Detail — Finance tab', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, `/projects/${projectId}`);
    const finTab = page.getByRole('tab', { name: /финанс/i }).or(page.locator('button:has-text("Финансы")'));
    if (await finTab.isVisible()) {
      await finTab.click();
      await page.waitForTimeout(1000);
    }
    await shot(page, '03f-project-finance');
  });

  test('Phase 3g: Project Detail — Pre-Construction tab', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, `/projects/${projectId}`);
    const preconTab = page.getByRole('tab', { name: /предстроительн/i }).or(page.locator('button:has-text("Предстроительный")'));
    if (await preconTab.isVisible()) {
      await preconTab.click();
      await page.waitForTimeout(1500);
    }
    await shot(page, '03g-project-preconstruction');
  });

  // ============================================================================
  // PHASE 4: Risk Register
  // ============================================================================
  test('Phase 4: Risk Register', async ({ page }) => {
    test.setTimeout(30_000);
    if (projectId) {
      await go(page, `/projects/${projectId}/risks`);
    } else {
      await go(page, '/projects');
      // Try to navigate to any project's risks
    }
    await shot(page, '04-risk-register');
  });

  // ============================================================================
  // PHASE 5: Pre-Construction Meeting
  // ============================================================================
  test('Phase 5: Pre-Construction Meeting', async ({ page }) => {
    test.setTimeout(30_000);
    if (projectId) {
      await go(page, `/projects/${projectId}/meeting`);
    }
    await shot(page, '05-meeting');
  });

  // ============================================================================
  // PHASE 6: Specifications
  // ============================================================================
  test('Phase 6a: Specifications List', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/specifications');
    await shot(page, '06a-specifications-list');

    // Find first spec
    const link = page.locator('a[href*="/specifications/"]').first();
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      specId = href?.match(/\/specifications\/([^/]+)/)?.[1] || '';
    }
  });

  test('Phase 6b: Specification Detail', async ({ page }) => {
    test.setTimeout(30_000);
    if (specId) {
      await go(page, `/specifications/${specId}`);
    } else {
      await go(page, '/specifications');
      const link = page.locator('a[href*="/specifications/"]').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
      }
    }
    await shot(page, '06b-specification-detail');
  });

  test('Phase 6c: Specification Creation Form', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/specifications/new');
    await shot(page, '06c-specification-form');
  });

  // ============================================================================
  // PHASE 7: Estimates
  // ============================================================================
  test('Phase 7a: Estimates List', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/estimates');
    await shot(page, '07a-estimates-list');

    const link = page.locator('a[href*="/estimates/"]').first();
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      estimateId = href?.match(/\/estimates\/([^/]+)/)?.[1] || '';
    }
  });

  test('Phase 7b: Estimate Detail', async ({ page }) => {
    test.setTimeout(30_000);
    if (estimateId) {
      await go(page, `/estimates/${estimateId}`);
    } else {
      await go(page, '/estimates');
      const link = page.locator('a[href*="/estimates/"]').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
      }
    }
    await shot(page, '07b-estimate-detail');
  });

  test('Phase 7c: Pricing Databases (ГЭСН/ФЕР/ТЕР)', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/estimates/pricing/databases');
    await shot(page, '07c-pricing-databases');
  });

  test('Phase 7d: Pricing Rates', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/estimates/pricing/rates');
    await shot(page, '07d-pricing-rates');
  });

  test('Phase 7e: Pricing Calculator', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/estimates/pricing/calculate');
    await shot(page, '07e-pricing-calculator');
  });

  // ============================================================================
  // PHASE 8: Financial Model (FM)
  // ============================================================================
  test('Phase 8a: Budgets List', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/budgets');
    await shot(page, '08a-budgets-list');

    // Find first budget
    const link = page.locator('a[href*="/budgets/"]').first();
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      budgetId = href?.match(/\/budgets\/([^/]+)/)?.[1] || '';
    }
  });

  test('Phase 8b: Budget Detail', async ({ page }) => {
    test.setTimeout(30_000);
    if (budgetId) {
      await go(page, `/budgets/${budgetId}`);
    } else {
      await go(page, '/budgets');
      const link = page.locator('a[href*="/budgets/"]').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
        budgetId = page.url().match(/\/budgets\/([^/]+)/)?.[1] || '';
      }
    }
    await shot(page, '08b-budget-detail');
  });

  test('Phase 8c: Financial Model — ALL tab', async ({ page }) => {
    test.setTimeout(30_000);
    if (budgetId) {
      await go(page, `/budgets/${budgetId}/fm`);
    }
    await shot(page, '08c-fm-all');
  });

  test('Phase 8d: Financial Model — WORKS tab', async ({ page }) => {
    test.setTimeout(30_000);
    if (budgetId) {
      await go(page, `/budgets/${budgetId}/fm`);
      const worksTab = page.locator('button:has-text("Работы")');
      if (await worksTab.isVisible()) {
        await worksTab.click();
        await page.waitForTimeout(1000);
      }
    }
    await shot(page, '08d-fm-works');
  });

  test('Phase 8e: Financial Model — MATERIALS tab', async ({ page }) => {
    test.setTimeout(30_000);
    if (budgetId) {
      await go(page, `/budgets/${budgetId}/fm`);
      const matsTab = page.locator('button:has-text("Материалы")');
      if (await matsTab.isVisible()) {
        await matsTab.click();
        await page.waitForTimeout(1000);
      }
    }
    await shot(page, '08e-fm-materials');
  });

  test('Phase 8f: Financial Model — CVR tab', async ({ page }) => {
    test.setTimeout(30_000);
    if (budgetId) {
      await go(page, `/budgets/${budgetId}/fm`);
      const cvrTab = page.locator('button:has-text("СВР")');
      if (await cvrTab.isVisible()) {
        await cvrTab.click();
        await page.waitForTimeout(1000);
      }
    }
    await shot(page, '08f-fm-cvr');
  });

  test('Phase 8g: Financial Model — Snapshots tab', async ({ page }) => {
    test.setTimeout(30_000);
    if (budgetId) {
      await go(page, `/budgets/${budgetId}/fm`);
      const snapTab = page.locator('button:has-text("Снимки")');
      if (await snapTab.isVisible()) {
        await snapTab.click();
        await page.waitForTimeout(1000);
      }
    }
    await shot(page, '08g-fm-snapshots');
  });

  test('Phase 8h: Financial Model — Value Engineering tab', async ({ page }) => {
    test.setTimeout(30_000);
    if (budgetId) {
      await go(page, `/budgets/${budgetId}/fm`);
      const veTab = page.locator('button:has-text("Оптимизация"), button:has-text("VE"), button:has-text("Value")');
      if (await veTab.isVisible()) {
        await veTab.click();
        await page.waitForTimeout(1000);
      }
    }
    await shot(page, '08h-fm-ve');
  });

  // ============================================================================
  // PHASE 9: Commercial Proposals (КП)
  // ============================================================================
  test('Phase 9a: Commercial Proposals List', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/commercial-proposals');
    await shot(page, '09a-cp-list');

    const link = page.locator('a[href*="/commercial-proposals/"]').first();
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      cpId = href?.match(/\/commercial-proposals\/([^/]+)/)?.[1] || '';
    }
  });

  test('Phase 9b: Commercial Proposal Detail', async ({ page }) => {
    test.setTimeout(30_000);
    if (cpId) {
      await go(page, `/commercial-proposals/${cpId}`);
    } else {
      await go(page, '/commercial-proposals');
      const link = page.locator('a[href*="/commercial-proposals/"]').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
      }
    }
    await shot(page, '09b-cp-detail');
  });

  // ============================================================================
  // PHASE 10: Competitive Lists
  // ============================================================================
  test('Phase 10: Competitive Lists / Bid Comparison', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/portfolio/bid-comparison');
    await shot(page, '10-bid-comparison');
  });

  // ============================================================================
  // PHASE 11: Contracts
  // ============================================================================
  test('Phase 11a: Contracts List', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/contracts');
    await shot(page, '11a-contracts-list');

    const link = page.locator('a[href*="/contracts/"]').first();
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      contractId = href?.match(/\/contracts\/([^/]+)/)?.[1] || '';
    }
  });

  test('Phase 11b: Contract Detail', async ({ page }) => {
    test.setTimeout(30_000);
    if (contractId) {
      await go(page, `/contracts/${contractId}`);
    } else {
      await go(page, '/contracts');
      const link = page.locator('a[href*="/contracts/"]').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
      }
    }
    await shot(page, '11b-contract-detail');
  });

  test('Phase 11c: Contract Creation Form', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/contracts/new');
    // Scroll to see insurance section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot(page, '11c-contract-form-full');
  });

  // ============================================================================
  // PHASE 12: Procurement
  // ============================================================================
  test('Phase 12a: Procurement List', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/procurement');
    await shot(page, '12a-procurement-list');

    const link = page.locator('a[href*="/procurement/"]').first();
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      prId = href?.match(/\/procurement\/([^/]+)/)?.[1] || '';
    }
  });

  test('Phase 12b: Purchase Request Detail', async ({ page }) => {
    test.setTimeout(30_000);
    if (prId) {
      await go(page, `/procurement/${prId}`);
    } else {
      await go(page, '/procurement');
      const link = page.locator('a[href*="/procurement/"]').first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
      }
    }
    await shot(page, '12b-purchase-request-detail');
  });

  // ============================================================================
  // PHASE 13: Vendor Prequalification
  // ============================================================================
  test('Phase 13: Vendor Prequalification', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/procurement/prequalification');
    await shot(page, '13-prequalification');
  });

  // ============================================================================
  // PHASE 14: Tenders
  // ============================================================================
  test('Phase 14: Tenders', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/portfolio/tenders');
    await shot(page, '14-tenders');
  });

  // ============================================================================
  // PHASE 15: Counterparties
  // ============================================================================
  test('Phase 15: Counterparties', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/counterparties');
    await shot(page, '15-counterparties');
  });

  // ============================================================================
  // PHASE 16: EVM / Planning
  // ============================================================================
  test('Phase 16: EVM Dashboard', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/planning/evm');
    await shot(page, '16-evm');
  });

  // ============================================================================
  // PHASE 17: Financial Models list
  // ============================================================================
  test('Phase 17: Financial Models List', async ({ page }) => {
    test.setTimeout(30_000);
    await go(page, '/financial-models');
    await shot(page, '17-financial-models');
  });
});
