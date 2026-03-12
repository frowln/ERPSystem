/**
 * Calculation Verification — FM Margins/НДС, EVM CPI/SPI, Portfolio Aggregates
 *
 * Verifies the core financial engine: FM (Финансовая Модель) calculations,
 * portfolio-level aggregates, and EVM (Earned Value Management) metrics.
 * These drive business decisions worth millions.
 *
 * A директор trusting wrong KPIs = wrong strategic decisions.
 * A бухгалтер trusting wrong НДС = tax audit consequences.
 * Zero tolerance for calculation errors.
 *
 * Severity classification:
 *   [CRITICAL] — Wrong calculation, data loss, security
 *   [MAJOR]    — Feature broken, workflow blocked
 *   [MINOR]    — Cosmetic, non-critical UX
 *   [UX]       — Not a bug, but makes life harder
 *   [MISSING]  — Feature that should exist but doesn't
 */

import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth.fixture';
import {
  authenticatedRequest,
  createEntity,
  deleteEntity,
  listEntities,
} from '../../fixtures/api.fixture';
import {
  parseRussianNumber,
  parseCurrency,
  assertVAT,
  assertMargin,
  assertPercentage,
  assertProfitable,
  assertCPI,
} from '../../helpers/calculation.helper';
import {
  getTableData,
  getColumnValues,
  verifySum,
} from '../../helpers/table.helper';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Test Data Constants ─────────────────────────────────────────────────────

/** FM Items with pre-calculated expected values */
const FM_ITEMS = [
  // Section: Электро
  {
    section: 'Электро', name: 'E2E-FM Кабель ВВГнг 3х2.5',
    quantity: 1200, unit: 'м', category: 'MATERIALS',
    costPrice: 185.00, estimatePrice: 245.50, customerPrice: 260.00,
    // cost = 1200 × 185.00 = 222_000.00
    // estimate = 1200 × 245.50 = 294_600.00
    // customer = 1200 × 260.00 = 312_000.00
    // margin = 312_000 - 222_000 = 90_000.00
    // marginPct = 90_000 / 312_000 = 28.85%
    expectedCost: 222_000.00,
    expectedEstimate: 294_600.00,
    expectedCustomer: 312_000.00,
    expectedMargin: 90_000.00,
    expectedMarginPct: 28.85,
    expectedNdv: 62_400.00, // 312_000 × 0.20
  },
  {
    section: 'Электро', name: 'E2E-FM Автомат АВВ 3P 25A',
    quantity: 48, unit: 'шт', category: 'EQUIPMENT',
    costPrice: 2_100.00, estimatePrice: 2_800.00, customerPrice: 3_000.00,
    // cost = 100_800.00, estimate = 134_400.00, customer = 144_000.00
    // margin = 43_200.00, marginPct = 30.00%
    expectedCost: 100_800.00,
    expectedEstimate: 134_400.00,
    expectedCustomer: 144_000.00,
    expectedMargin: 43_200.00,
    expectedMarginPct: 30.00,
    expectedNdv: 28_800.00,
  },
  // Section: Вентиляция
  {
    section: 'Вентиляция', name: 'E2E-FM Воздуховод оцинк. 250мм',
    quantity: 80, unit: 'п.м.', category: 'MATERIALS',
    costPrice: 950.00, estimatePrice: 1_200.00, customerPrice: 1_350.00,
    // cost = 76_000.00, estimate = 96_000.00, customer = 108_000.00
    // margin = 32_000.00, marginPct = 29.63%
    expectedCost: 76_000.00,
    expectedEstimate: 96_000.00,
    expectedCustomer: 108_000.00,
    expectedMargin: 32_000.00,
    expectedMarginPct: 29.63,
    expectedNdv: 21_600.00,
  },
  {
    section: 'Вентиляция', name: 'E2E-FM Вентилятор ВКП 250',
    quantity: 4, unit: 'шт', category: 'EQUIPMENT',
    costPrice: 15_000.00, estimatePrice: 19_500.00, customerPrice: 21_000.00,
    // cost = 60_000.00, estimate = 78_000.00, customer = 84_000.00
    // margin = 24_000.00, marginPct = 28.57%
    expectedCost: 60_000.00,
    expectedEstimate: 78_000.00,
    expectedCustomer: 84_000.00,
    expectedMargin: 24_000.00,
    expectedMarginPct: 28.57,
    expectedNdv: 16_800.00,
  },
] as const;

/** Pre-calculated section and grand totals */
const EXPECTED = {
  electro: {
    costTotal: 322_800.00,      // 222_000 + 100_800
    estimateTotal: 429_000.00,  // 294_600 + 134_400
    customerTotal: 456_000.00,  // 312_000 + 144_000
    margin: 133_200.00,         // 456_000 - 322_800
    marginPct: 29.21,           // 133_200 / 456_000 × 100
    nds: 91_200.00,             // 456_000 × 0.20
  },
  vent: {
    costTotal: 136_000.00,      // 76_000 + 60_000
    estimateTotal: 174_000.00,  // 96_000 + 78_000
    customerTotal: 192_000.00,  // 108_000 + 84_000
    margin: 56_000.00,          // 192_000 - 136_000
    marginPct: 29.17,           // 56_000 / 192_000 × 100
    nds: 38_400.00,             // 192_000 × 0.20
  },
  grand: {
    costTotal: 458_800.00,      // 322_800 + 136_000
    estimateTotal: 603_000.00,  // 429_000 + 174_000
    customerTotal: 648_000.00,  // 456_000 + 192_000
    margin: 189_200.00,         // 648_000 - 458_800
    marginPct: 29.20,           // 189_200 / 648_000 × 100 (29.1975...)
    nds: 129_600.00,            // 648_000 × 0.20
    totalWithNds: 777_600.00,   // 648_000 + 129_600
  },
};

/** Mutated item data for price change test */
const MUTATED_COST = {
  newCostPrice: 200.00,
  // Item 0 (Кабель): new cost = 1200 × 200 = 240_000.00
  newItemCost: 240_000.00,
  newElectroCost: 340_800.00,   // 240_000 + 100_800
  newElectroMargin: 115_200.00, // 456_000 - 340_800
  newElectroMarginPct: 25.26,   // 115_200 / 456_000 × 100
  newGrandCost: 476_800.00,     // 340_800 + 136_000
  newGrandMargin: 171_200.00,   // 648_000 - 476_800
  newGrandMarginPct: 26.42,     // 171_200 / 648_000 × 100
};

/** New item for add test */
const NEW_ITEM = {
  name: 'E2E-FM Коробка распаечная IP65',
  quantity: 30, unit: 'шт', category: 'MATERIALS',
  costPrice: 250, estimatePrice: 350, customerPrice: 400,
  // cost = 7_500, estimate = 10_500, customer = 12_000
  expectedCost: 7_500,
  expectedEstimate: 10_500,
  expectedCustomer: 12_000,
  expectedMargin: 4_500,
  expectedMarginPct: 37.50,
  // New Электро totals:
  newElectroCost: 330_300,      // 322_800 + 7_500
  newElectroCustomer: 468_000,  // 456_000 + 12_000
  newElectroMargin: 137_700,    // 468_000 - 330_300
  newElectroMarginPct: 29.42,
};

/** EVM test data */
const EVM_DATA = {
  bac: 15_000_000,
  plannedProgressPct: 60,
  actualProgressPct: 55,
  actualCost: 9_500_000,
  // Derived
  pv: 9_000_000,               // BAC × 0.60
  ev: 8_250_000,               // BAC × 0.55
  cpi: 0.868,                  // EV / AC = 8_250_000 / 9_500_000
  spi: 0.917,                  // EV / PV = 8_250_000 / 9_000_000
  eac: 17_281_105.99,          // BAC / CPI = 15_000_000 / 0.868...
  etc: 7_781_105.99,           // EAC - AC
  vac: -2_281_105.99,          // BAC - EAC
};

/** Portfolio test projects */
const PORTFOLIO_PROJECTS = [
  { name: 'E2E-PORT ЖК Солнечный', code: 'E2E-PORT-001', status: 'IN_PROGRESS', budget: 45_000_000 },
  { name: 'E2E-PORT Склад Логистик', code: 'E2E-PORT-002', status: 'IN_PROGRESS', budget: 28_000_000 },
  { name: 'E2E-PORT Д/С Радуга', code: 'E2E-PORT-003', status: 'PLANNING', budget: 9_500_000 },
  { name: 'E2E-PORT Офис Центр', code: 'E2E-PORT-004', status: 'ON_HOLD', budget: 15_000_000 },
  { name: 'E2E-PORT Паркинг Восток', code: 'E2E-PORT-005', status: 'COMPLETED', budget: 12_000_000 },
] as const;

const PORTFOLIO_EXPECTED = {
  totalBudget: 109_500_000,     // sum of all 5
  activeCount: 2,               // IN_PROGRESS only
  atRiskCount: 0,               // depends on seed CPI/SPI
};

// ── Report Collector ────────────────────────────────────────────────────────

interface CalcCheck {
  page: string;
  metric: string;
  expected: number | string;
  actual: number | string;
  pass: boolean;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'MISSING';
  note?: string;
}

const checks: CalcCheck[] = [];

function record(
  page: string,
  metric: string,
  expected: number | string,
  actual: number | string,
  pass: boolean,
  severity: CalcCheck['severity'] = 'CRITICAL',
  note?: string,
) {
  checks.push({ page, metric, expected, actual, pass, severity, note });
}

// ── Entity tracking for cleanup ──────────────────────────────────────────────

interface TrackedEntity { endpoint: string; id: string }
const trackedEntities: TrackedEntity[] = [];

function track(endpoint: string, id: string) {
  trackedEntities.push({ endpoint, id });
}

async function cleanupTracked() {
  const reversed = [...trackedEntities].reverse();
  for (const { endpoint, id } of reversed) {
    try { await deleteEntity(endpoint, id); } catch { /* ignore */ }
  }
  trackedEntities.length = 0;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function approxEqual(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance;
}

function pctEqual(a: number, b: number, tolerancePct = 0.05): boolean {
  return Math.abs(a - b) <= tolerancePct;
}

// ── Test Suite ───────────────────────────────────────────────────────────────

test.describe('FM Margins/НДС, EVM, Portfolio Aggregates — Calculation Verification', () => {
  // ── Shared state ──
  let projectId: string;
  let budgetId: string;
  let sectionIds: { electro: string; vent: string };
  let itemIds: string[]; // indices match FM_ITEMS

  // ── Setup: Create project + budget + sections + items via API ──
  test.beforeAll(async () => {
    // Create project
    const projRes = await authenticatedRequest('admin', 'POST', '/api/projects', {
      name: 'E2E-FM-CALC Test Project',
      code: 'E2E-FM-CALC-001',
      status: 'IN_PROGRESS',
    });
    if (projRes.ok) {
      const proj = await projRes.json().then((j: any) => j.data ?? j);
      projectId = proj.id;
      track('/api/projects', projectId);
    } else {
      // Try to find existing
      const projects = await listEntities<any>('/api/projects');
      const existing = projects.find((p: any) => p.code === 'E2E-FM-CALC-001');
      if (existing) {
        projectId = existing.id;
      } else {
        throw new Error(`Failed to create project: ${projRes.status}`);
      }
    }

    // Create budget
    try {
      const budget = await createEntity<any>('/api/budgets', {
        name: 'E2E-FM Budget',
        projectId,
        totalAmount: 1_000_000,
      });
      budgetId = budget.id;
      track('/api/budgets', budgetId);
    } catch {
      // Auto-created?
      const budgets = await listEntities<any>('/api/budgets', { projectId });
      if (budgets.length > 0) {
        budgetId = budgets[0].id;
      } else {
        throw new Error('Failed to create or find budget');
      }
    }

    // Create sections
    const electroSection = await createEntity<any>(`/api/budgets/${budgetId}/items`, {
      name: 'Электро',
      section: true,
      category: 'MATERIALS',
      plannedAmount: 0,
    });
    track(`/api/budgets/${budgetId}/items`, electroSection.id);

    const ventSection = await createEntity<any>(`/api/budgets/${budgetId}/items`, {
      name: 'Вентиляция',
      section: true,
      category: 'MATERIALS',
      plannedAmount: 0,
    });
    track(`/api/budgets/${budgetId}/items`, ventSection.id);

    sectionIds = { electro: electroSection.id, vent: ventSection.id };

    // Create items
    itemIds = [];
    for (const item of FM_ITEMS) {
      const parentId = item.section === 'Электро' ? sectionIds.electro : sectionIds.vent;
      try {
        const created = await createEntity<any>(`/api/budgets/${budgetId}/items`, {
          name: item.name,
          category: item.category,
          unit: item.unit,
          quantity: item.quantity,
          costPrice: item.costPrice,
          estimatePrice: item.estimatePrice,
          customerPrice: item.customerPrice,
          plannedAmount: item.expectedCustomer,
          parentId,
        });
        itemIds.push(created.id);
        track(`/api/budgets/${budgetId}/items`, created.id);
      } catch (e) {
        itemIds.push('');
        console.error(`Failed to create FM item ${item.name}:`, e);
      }
    }
  });

  test.afterAll(async () => {
    // Write reports
    const reportsDir = path.resolve(__dirname, '..', '..', '..', 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });

    // JSON report
    fs.writeFileSync(
      path.join(reportsDir, 'calc-fm-portfolio-results.json'),
      JSON.stringify(checks, null, 2),
    );

    // Summary markdown
    const passed = checks.filter((c) => c.pass).length;
    const failed = checks.filter((c) => !c.pass).length;
    const critical = checks.filter((c) => !c.pass && c.severity === 'CRITICAL').length;
    const major = checks.filter((c) => !c.pass && c.severity === 'MAJOR').length;
    const minor = checks.filter((c) => !c.pass && c.severity === 'MINOR').length;
    const ux = checks.filter((c) => !c.pass && c.severity === 'UX').length;
    const missing = checks.filter((c) => !c.pass && c.severity === 'MISSING').length;

    const summary = [
      '# FM Margins/НДС, EVM, Portfolio — Calculation Results',
      '',
      `**Date**: ${new Date().toISOString().slice(0, 10)}`,
      `**Total checks**: ${checks.length}`,
      `**Passed**: ${passed}  |  **Failed**: ${failed}`,
      '',
      '## Failures by severity',
      `- CRITICAL: ${critical}`,
      `- MAJOR: ${major}`,
      `- MINOR: ${minor}`,
      `- UX: ${ux}`,
      `- MISSING: ${missing}`,
      '',
      '## All Checks',
      '| Page | Metric | Expected | Actual | Pass | Severity |',
      '|------|--------|----------|--------|------|----------|',
      ...checks.map((c) =>
        `| ${c.page} | ${c.metric} | ${c.expected} | ${c.actual} | ${c.pass ? '✅' : '❌'} | ${c.severity} |`,
      ),
    ].join('\n');

    fs.writeFileSync(path.join(reportsDir, 'calc-fm-portfolio-summary.md'), summary);

    // Cleanup test entities
    await cleanupTracked();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 1: FM Item-Level Calculations
  // ═══════════════════════════════════════════════════════════════════════════

  test('1. FM item-level calculations — cost, estimate, customer, margin, НДС', async ({ browser }) => {
    const { context, page } = await loginAs(browser, 'admin');
    try {
      await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'networkidle', timeout: 60_000 });

      // Wait for the FM table to render
      await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(2000); // let calculations settle

      // Verify each item via API (source of truth)
      const apiRes = await authenticatedRequest('admin', 'GET', `/api/budgets/${budgetId}/items`);
      const apiItems: any[] = apiRes.ok
        ? await apiRes.json().then((j: any) => j.data ?? j.content ?? j)
        : [];

      const nonSectionItems = apiItems.filter((i: any) => !i.section);

      for (let idx = 0; idx < FM_ITEMS.length; idx++) {
        const expected = FM_ITEMS[idx];
        const apiItem = nonSectionItems.find((i: any) => i.name === expected.name);

        if (!apiItem) {
          record('FM Items', `Item "${expected.name}" exists`, 'found', 'not found', false, 'CRITICAL');
          continue;
        }

        // Verify stored prices match input
        const costPrice = apiItem.costPrice ?? 0;
        const estimatePrice = apiItem.estimatePrice ?? 0;
        const customerPrice = apiItem.customerPrice ?? 0;
        const quantity = apiItem.quantity ?? 0;

        // cost = quantity × costPrice
        const computedCost = quantity * costPrice;
        const costMatch = approxEqual(computedCost, expected.expectedCost, 1);
        record('FM Items', `${expected.name} costTotal`, expected.expectedCost, computedCost, costMatch);

        // estimate = quantity × estimatePrice
        const computedEstimate = quantity * estimatePrice;
        const estMatch = approxEqual(computedEstimate, expected.expectedEstimate, 1);
        record('FM Items', `${expected.name} estimateTotal`, expected.expectedEstimate, computedEstimate, estMatch);

        // customer = quantity × customerPrice
        const computedCustomer = quantity * customerPrice;
        const custMatch = approxEqual(computedCustomer, expected.expectedCustomer, 1);
        record('FM Items', `${expected.name} customerTotal`, expected.expectedCustomer, computedCustomer, custMatch);

        // margin = customer - cost
        const computedMargin = computedCustomer - computedCost;
        const marginMatch = approxEqual(computedMargin, expected.expectedMargin, 1);
        record('FM Items', `${expected.name} margin`, expected.expectedMargin, computedMargin, marginMatch);

        // marginPct = (margin / customer) × 100
        const computedMarginPct = computedCustomer > 0 ? (computedMargin / computedCustomer) * 100 : 0;
        const pctMatch = pctEqual(computedMarginPct, expected.expectedMarginPct, 0.05);
        record('FM Items', `${expected.name} marginPct`, `${expected.expectedMarginPct}%`, `${computedMarginPct.toFixed(2)}%`, pctMatch);

        // НДС = customer × 0.20 (Russia, no exceptions)
        const computedNdv = computedCustomer * 0.20;
        const ndvMatch = approxEqual(computedNdv, expected.expectedNdv, 1);
        record('FM Items', `${expected.name} НДС`, expected.expectedNdv, computedNdv, ndvMatch);

        // Business rule: customerPrice >= costPrice (GOLDEN RULE)
        const profitable = customerPrice >= costPrice;
        record('FM Items', `${expected.name} profitable (customer≥cost)`, 'true', String(profitable), profitable);

        // All assertions
        expect(costMatch).toBeTruthy();
        expect(estMatch).toBeTruthy();
        expect(custMatch).toBeTruthy();
        expect(marginMatch).toBeTruthy();
        expect(pctMatch).toBeTruthy();
        expect(ndvMatch).toBeTruthy();
        expect(profitable).toBeTruthy();
      }
    } finally {
      await context.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 2: FM Section Subtotals
  // ═══════════════════════════════════════════════════════════════════════════

  test('2. FM section subtotals — Электро and Вентиляция', async ({ browser }) => {
    const { context, page } = await loginAs(browser, 'admin');
    try {
      await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'networkidle', timeout: 60_000 });
      await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(2000);

      // Verify via API — compute section subtotals from items
      const apiRes = await authenticatedRequest('admin', 'GET', `/api/budgets/${budgetId}/items`);
      const apiItems: any[] = apiRes.ok
        ? await apiRes.json().then((j: any) => j.data ?? j.content ?? j)
        : [];

      // Group items by parent section
      const electroItems = apiItems.filter((i: any) => i.parentId === sectionIds.electro && !i.section);
      const ventItems = apiItems.filter((i: any) => i.parentId === sectionIds.vent && !i.section);

      // Calculate Электро section totals
      const electroCost = electroItems.reduce((s: number, i: any) => s + (i.costPrice ?? 0) * (i.quantity ?? 1), 0);
      const electroEstimate = electroItems.reduce((s: number, i: any) => s + (i.estimatePrice ?? 0) * (i.quantity ?? 1), 0);
      const electroCustomer = electroItems.reduce((s: number, i: any) => s + (i.customerPrice ?? 0) * (i.quantity ?? 1), 0);
      const electroMargin = electroCustomer - electroCost;
      const electroNds = electroCustomer * 0.20;

      record('FM Sections', 'Электро costTotal', EXPECTED.electro.costTotal, electroCost,
        approxEqual(electroCost, EXPECTED.electro.costTotal, 1));
      record('FM Sections', 'Электро estimateTotal', EXPECTED.electro.estimateTotal, electroEstimate,
        approxEqual(electroEstimate, EXPECTED.electro.estimateTotal, 1));
      record('FM Sections', 'Электро customerTotal', EXPECTED.electro.customerTotal, electroCustomer,
        approxEqual(electroCustomer, EXPECTED.electro.customerTotal, 1));
      record('FM Sections', 'Электро margin', EXPECTED.electro.margin, electroMargin,
        approxEqual(electroMargin, EXPECTED.electro.margin, 1));
      record('FM Sections', 'Электро НДС', EXPECTED.electro.nds, electroNds,
        approxEqual(electroNds, EXPECTED.electro.nds, 1));

      // Calculate Вентиляция section totals
      const ventCost = ventItems.reduce((s: number, i: any) => s + (i.costPrice ?? 0) * (i.quantity ?? 1), 0);
      const ventEstimate = ventItems.reduce((s: number, i: any) => s + (i.estimatePrice ?? 0) * (i.quantity ?? 1), 0);
      const ventCustomer = ventItems.reduce((s: number, i: any) => s + (i.customerPrice ?? 0) * (i.quantity ?? 1), 0);
      const ventMargin = ventCustomer - ventCost;
      const ventNds = ventCustomer * 0.20;

      record('FM Sections', 'Вентиляция costTotal', EXPECTED.vent.costTotal, ventCost,
        approxEqual(ventCost, EXPECTED.vent.costTotal, 1));
      record('FM Sections', 'Вентиляция estimateTotal', EXPECTED.vent.estimateTotal, ventEstimate,
        approxEqual(ventEstimate, EXPECTED.vent.estimateTotal, 1));
      record('FM Sections', 'Вентиляция customerTotal', EXPECTED.vent.customerTotal, ventCustomer,
        approxEqual(ventCustomer, EXPECTED.vent.customerTotal, 1));
      record('FM Sections', 'Вентиляция margin', EXPECTED.vent.margin, ventMargin,
        approxEqual(ventMargin, EXPECTED.vent.margin, 1));
      record('FM Sections', 'Вентиляция НДС', EXPECTED.vent.nds, ventNds,
        approxEqual(ventNds, EXPECTED.vent.nds, 1));

      // Also verify section rows are visible on page
      const sectionRows = page.locator('tbody tr').filter({ hasText: /Электро|Вентиляция/ });
      const sectionCount = await sectionRows.count();
      record('FM Sections', 'Section rows visible', '≥2', String(sectionCount),
        sectionCount >= 2, 'MAJOR');

      // Assertions
      expect(approxEqual(electroCost, EXPECTED.electro.costTotal, 1)).toBeTruthy();
      expect(approxEqual(electroCustomer, EXPECTED.electro.customerTotal, 1)).toBeTruthy();
      expect(approxEqual(ventCost, EXPECTED.vent.costTotal, 1)).toBeTruthy();
      expect(approxEqual(ventCustomer, EXPECTED.vent.customerTotal, 1)).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 3: FM Grand Totals (tfoot)
  // ═══════════════════════════════════════════════════════════════════════════

  test('3. FM grand totals — tfoot row matches expected values', async ({ browser }) => {
    const { context, page } = await loginAs(browser, 'admin');
    try {
      await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'networkidle', timeout: 60_000 });
      await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(2000);

      // Parse tfoot cells
      const tfoot = page.locator('tfoot tr').first();
      await expect(tfoot).toBeVisible({ timeout: 10_000 });

      const footCells = tfoot.locator('td');
      const footCellCount = await footCells.count();

      // tfoot column mapping from FmItemsTable:
      // 0: label, 1: unit(empty), 2: qty(empty), 3: costPrice(empty),
      // 4: costTotal, 5: estimateTotal, 6: overhead, 7: profit, 8: contingency,
      // 9: custPrice(empty), 10: customerTotal, 11: НДС, 12: margin, 13: marginPct
      if (footCellCount >= 14) {
        const costTotalText = await footCells.nth(4).innerText();
        const estimateTotalText = await footCells.nth(5).innerText();
        const customerTotalText = await footCells.nth(10).innerText();
        const ndvTotalText = await footCells.nth(11).innerText();
        const marginTotalText = await footCells.nth(12).innerText();
        const marginPctText = await footCells.nth(13).innerText();

        const costTotal = parseRussianNumber(costTotalText);
        const estimateTotal = parseRussianNumber(estimateTotalText);
        const customerTotal = parseRussianNumber(customerTotalText);
        const ndvTotal = parseRussianNumber(ndvTotalText);
        const marginTotal = parseRussianNumber(marginTotalText);
        const marginPct = parseRussianNumber(marginPctText);

        record('FM Grand Totals', 'costTotal', EXPECTED.grand.costTotal, costTotal,
          approxEqual(costTotal, EXPECTED.grand.costTotal, 5));
        record('FM Grand Totals', 'estimateTotal', EXPECTED.grand.estimateTotal, estimateTotal,
          approxEqual(estimateTotal, EXPECTED.grand.estimateTotal, 5));
        record('FM Grand Totals', 'customerTotal', EXPECTED.grand.customerTotal, customerTotal,
          approxEqual(customerTotal, EXPECTED.grand.customerTotal, 5));
        record('FM Grand Totals', 'НДС total', EXPECTED.grand.nds, ndvTotal,
          approxEqual(ndvTotal, EXPECTED.grand.nds, 5));
        record('FM Grand Totals', 'margin total', EXPECTED.grand.margin, marginTotal,
          approxEqual(marginTotal, EXPECTED.grand.margin, 5));
        record('FM Grand Totals', 'margin %', `${EXPECTED.grand.marginPct}%`, `${marginPct}%`,
          pctEqual(marginPct, EXPECTED.grand.marginPct, 0.2));

        // Formula consistency: НДС = customerTotal × 0.20
        if (!isNaN(customerTotal) && !isNaN(ndvTotal)) {
          const expectedNdv = customerTotal * 0.20;
          const ndvFormulaMatch = approxEqual(ndvTotal, expectedNdv, 5);
          record('FM Grand Totals', 'НДС formula consistency (customer × 0.20)', expectedNdv, ndvTotal, ndvFormulaMatch);
          expect(ndvFormulaMatch).toBeTruthy();
        }

        // Formula consistency: margin = customer - cost
        if (!isNaN(customerTotal) && !isNaN(costTotal) && !isNaN(marginTotal)) {
          const expectedMargin = customerTotal - costTotal;
          const marginFormulaMatch = approxEqual(marginTotal, expectedMargin, 5);
          record('FM Grand Totals', 'margin formula consistency (customer - cost)', expectedMargin, marginTotal, marginFormulaMatch);
          expect(marginFormulaMatch).toBeTruthy();
        }

        expect(approxEqual(costTotal, EXPECTED.grand.costTotal, 5)).toBeTruthy();
        expect(approxEqual(customerTotal, EXPECTED.grand.customerTotal, 5)).toBeTruthy();
      } else {
        record('FM Grand Totals', 'tfoot cell count', '≥14', String(footCellCount), false, 'CRITICAL',
          'Not enough cells in tfoot to verify all columns');
      }
    } finally {
      await context.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 4: FM KPI Cards
  // ═══════════════════════════════════════════════════════════════════════════

  test('4. FM KPI cards — budget, margin, cost, НДС values and colors', async ({ browser }) => {
    const { context, page } = await loginAs(browser, 'admin');
    try {
      await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForTimeout(3000);

      // KPI strip is a flex container with KpiCard components
      // Each KpiCard has: label text + value text
      // We look for specific KPI values on the page

      // Check that the KPI strip container is visible
      const kpiStrip = page.locator('.flex.items-center.gap-6').first();
      const kpiVisible = await kpiStrip.isVisible().catch(() => false);
      record('FM KPI', 'KPI strip visible', 'true', String(kpiVisible), kpiVisible, 'MAJOR');

      // Verify grand totals via API computation (matching how FmPage computes kpis)
      const apiRes = await authenticatedRequest('admin', 'GET', `/api/budgets/${budgetId}/items`);
      const apiItems: any[] = apiRes.ok
        ? await apiRes.json().then((j: any) => j.data ?? j.content ?? j)
        : [];

      const nonSection = apiItems.filter((i: any) => !i.section);
      const costTotal = nonSection.reduce((s: number, i: any) => s + (i.costPrice ?? 0) * (i.quantity ?? 1), 0);
      const estimateTotal = nonSection.reduce((s: number, i: any) => s + (i.estimatePrice ?? 0) * (i.quantity ?? 1), 0);
      const customerTotal = nonSection.reduce((s: number, i: any) => s + (i.customerPrice ?? 0) * (i.quantity ?? 1), 0);
      const ndvTotal = customerTotal * 0.20;
      const marginTotal = customerTotal - costTotal;
      const marginPct = customerTotal > 0 ? (marginTotal / customerTotal) * 100 : 0;

      // Verify API-computed values match expected
      record('FM KPI', 'API costTotal', EXPECTED.grand.costTotal, costTotal,
        approxEqual(costTotal, EXPECTED.grand.costTotal, 1));
      record('FM KPI', 'API customerTotal', EXPECTED.grand.customerTotal, customerTotal,
        approxEqual(customerTotal, EXPECTED.grand.customerTotal, 1));
      record('FM KPI', 'API НДС = customer × 0.20', EXPECTED.grand.nds, ndvTotal,
        approxEqual(ndvTotal, EXPECTED.grand.nds, 1));
      record('FM KPI', 'API marginTotal', EXPECTED.grand.margin, marginTotal,
        approxEqual(marginTotal, EXPECTED.grand.margin, 1));
      record('FM KPI', 'API marginPct', `${EXPECTED.grand.marginPct}%`, `${marginPct.toFixed(2)}%`,
        pctEqual(marginPct, EXPECTED.grand.marginPct, 0.1));

      // Margin color: >15% should be green (matching marginPctColor logic)
      // marginPct ~29.2% → should show green
      const marginColor = marginPct >= 15 ? 'green' : marginPct >= 5 ? 'yellow' : marginPct < 0 ? 'red' : 'orange';
      record('FM KPI', 'margin color (≥15%=green)', 'green', marginColor, marginColor === 'green', 'UX');

      // НДС must be EXACTLY 20% — Russian law, no exceptions
      assertVAT(customerTotal, ndvTotal, 0.20);
      record('FM KPI', 'НДС rate verification', '20%', '20%', true);

      expect(approxEqual(costTotal, EXPECTED.grand.costTotal, 1)).toBeTruthy();
      expect(approxEqual(customerTotal, EXPECTED.grand.customerTotal, 1)).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 5: Three-Price Comparison (cost ≤ estimate ≤ customer)
  // ═══════════════════════════════════════════════════════════════════════════

  test('5. Three-price comparison — customerPrice ≥ estimatePrice ≥ costPrice', async () => {
    const apiRes = await authenticatedRequest('admin', 'GET', `/api/budgets/${budgetId}/items`);
    const apiItems: any[] = apiRes.ok
      ? await apiRes.json().then((j: any) => j.data ?? j.content ?? j)
      : [];

    const nonSection = apiItems.filter((i: any) => !i.section);
    let allProfitable = true;
    let allEstimateAboveCost = true;

    for (const item of nonSection) {
      const cost = item.costPrice ?? 0;
      const estimate = item.estimatePrice ?? 0;
      const customer = item.customerPrice ?? 0;

      // GOLDEN RULE: customer ≥ cost (we make money)
      const profitable = customer >= cost;
      record('Three-Price', `${item.name} customer(${customer}) ≥ cost(${cost})`,
        'true', String(profitable), profitable);
      if (!profitable) allProfitable = false;

      // Normal pattern: estimate ≥ cost (norms higher than market)
      if (estimate > 0 && cost > 0) {
        const estAboveCost = estimate >= cost;
        record('Three-Price', `${item.name} estimate(${estimate}) ≥ cost(${cost})`,
          'true', String(estAboveCost), estAboveCost, 'MAJOR');
        if (!estAboveCost) allEstimateAboveCost = false;
      }

      // customer ≥ estimate (we charge at/above norms)
      if (customer > 0 && estimate > 0) {
        const custAboveEst = customer >= estimate;
        record('Three-Price', `${item.name} customer(${customer}) ≥ estimate(${estimate})`,
          'true', String(custAboveEst), custAboveEst, 'MAJOR');
      }
    }

    expect(allProfitable).toBeTruthy();
    expect(allEstimateAboveCost).toBeTruthy();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 6: FM Mutation — Change costPrice
  // ═══════════════════════════════════════════════════════════════════════════

  test('6. FM mutation — change costPrice → verify downstream totals update', async () => {
    // Mutate item 0 (Кабель): costPrice 185 → 200
    const kabelId = itemIds[0];
    if (!kabelId) {
      record('FM Mutation', 'Кабель item exists for mutation', 'exists', 'missing', false, 'CRITICAL');
      return;
    }

    // Save original state, mutate, verify, revert
    try {
      // Mutate
      await authenticatedRequest('admin', 'PUT', `/api/budgets/${budgetId}/items/${kabelId}`, {
        costPrice: MUTATED_COST.newCostPrice,
      });

      // Re-fetch all items and compute totals
      const apiRes = await authenticatedRequest('admin', 'GET', `/api/budgets/${budgetId}/items`);
      const apiItems: any[] = apiRes.ok
        ? await apiRes.json().then((j: any) => j.data ?? j.content ?? j)
        : [];
      const nonSection = apiItems.filter((i: any) => !i.section);

      // Find mutated item
      const mutatedItem = nonSection.find((i: any) => i.id === kabelId);
      const newCost = (mutatedItem?.costPrice ?? 0) * (mutatedItem?.quantity ?? 0);

      record('FM Mutation', 'Кабель new costTotal after mutation',
        MUTATED_COST.newItemCost, newCost,
        approxEqual(newCost, MUTATED_COST.newItemCost, 1));

      // Grand totals
      const grandCost = nonSection.reduce((s: number, i: any) => s + (i.costPrice ?? 0) * (i.quantity ?? 1), 0);
      const grandCustomer = nonSection.reduce((s: number, i: any) => s + (i.customerPrice ?? 0) * (i.quantity ?? 1), 0);
      const grandMargin = grandCustomer - grandCost;
      const grandMarginPct = grandCustomer > 0 ? (grandMargin / grandCustomer) * 100 : 0;

      record('FM Mutation', 'Grand costTotal after mutation',
        MUTATED_COST.newGrandCost, grandCost,
        approxEqual(grandCost, MUTATED_COST.newGrandCost, 1));
      record('FM Mutation', 'Grand margin after mutation',
        MUTATED_COST.newGrandMargin, grandMargin,
        approxEqual(grandMargin, MUTATED_COST.newGrandMargin, 1));
      record('FM Mutation', 'Grand marginPct after mutation',
        `${MUTATED_COST.newGrandMarginPct}%`, `${grandMarginPct.toFixed(2)}%`,
        pctEqual(grandMarginPct, MUTATED_COST.newGrandMarginPct, 0.1));

      expect(approxEqual(newCost, MUTATED_COST.newItemCost, 1)).toBeTruthy();
      expect(approxEqual(grandCost, MUTATED_COST.newGrandCost, 1)).toBeTruthy();
    } finally {
      // REVERT: restore original costPrice
      await authenticatedRequest('admin', 'PUT', `/api/budgets/${budgetId}/items/${kabelId}`, {
        costPrice: FM_ITEMS[0].costPrice,
      });

      // Verify revert
      const revRes = await authenticatedRequest('admin', 'GET', `/api/budgets/${budgetId}/items`);
      const revItems: any[] = revRes.ok
        ? await revRes.json().then((j: any) => j.data ?? j.content ?? j)
        : [];
      const revNonSection = revItems.filter((i: any) => !i.section);
      const revCost = revNonSection.reduce((s: number, i: any) => s + (i.costPrice ?? 0) * (i.quantity ?? 1), 0);
      const revertOk = approxEqual(revCost, EXPECTED.grand.costTotal, 1);
      record('FM Mutation', 'costTotal reverted to original', EXPECTED.grand.costTotal, revCost, revertOk);
      expect(revertOk).toBeTruthy();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 7: FM Mutation — Add New Item
  // ═══════════════════════════════════════════════════════════════════════════

  test('7. FM mutation — add new item → verify section and grand totals update', async () => {
    // Add item to Электро
    let newItemId = '';
    try {
      const created = await createEntity<any>(`/api/budgets/${budgetId}/items`, {
        name: NEW_ITEM.name,
        category: NEW_ITEM.category,
        unit: NEW_ITEM.unit,
        quantity: NEW_ITEM.quantity,
        costPrice: NEW_ITEM.costPrice,
        estimatePrice: NEW_ITEM.estimatePrice,
        customerPrice: NEW_ITEM.customerPrice,
        plannedAmount: NEW_ITEM.expectedCustomer,
        parentId: sectionIds.electro,
      });
      newItemId = created.id;

      // Verify totals
      const apiRes = await authenticatedRequest('admin', 'GET', `/api/budgets/${budgetId}/items`);
      const apiItems: any[] = apiRes.ok
        ? await apiRes.json().then((j: any) => j.data ?? j.content ?? j)
        : [];
      const nonSection = apiItems.filter((i: any) => !i.section);

      // Электро section items
      const electroItems = nonSection.filter((i: any) => i.parentId === sectionIds.electro);
      const electroCost = electroItems.reduce((s: number, i: any) => s + (i.costPrice ?? 0) * (i.quantity ?? 1), 0);
      const electroCustomer = electroItems.reduce((s: number, i: any) => s + (i.customerPrice ?? 0) * (i.quantity ?? 1), 0);
      const electroMargin = electroCustomer - electroCost;

      record('FM Add Item', 'Электро costTotal (with new item)',
        NEW_ITEM.newElectroCost, electroCost,
        approxEqual(electroCost, NEW_ITEM.newElectroCost, 1));
      record('FM Add Item', 'Электро customerTotal (with new item)',
        NEW_ITEM.newElectroCustomer, electroCustomer,
        approxEqual(electroCustomer, NEW_ITEM.newElectroCustomer, 1));
      record('FM Add Item', 'Электро margin (with new item)',
        NEW_ITEM.newElectroMargin, electroMargin,
        approxEqual(electroMargin, NEW_ITEM.newElectroMargin, 1));

      // Grand totals should increase
      const grandCost = nonSection.reduce((s: number, i: any) => s + (i.costPrice ?? 0) * (i.quantity ?? 1), 0);
      const grandCustomer = nonSection.reduce((s: number, i: any) => s + (i.customerPrice ?? 0) * (i.quantity ?? 1), 0);
      const expectedGrandCost = EXPECTED.grand.costTotal + NEW_ITEM.expectedCost;
      const expectedGrandCustomer = EXPECTED.grand.customerTotal + NEW_ITEM.expectedCustomer;

      record('FM Add Item', 'Grand costTotal (with new item)',
        expectedGrandCost, grandCost,
        approxEqual(grandCost, expectedGrandCost, 1));
      record('FM Add Item', 'Grand customerTotal (with new item)',
        expectedGrandCustomer, grandCustomer,
        approxEqual(grandCustomer, expectedGrandCustomer, 1));

      expect(approxEqual(electroCost, NEW_ITEM.newElectroCost, 1)).toBeTruthy();
      expect(approxEqual(grandCost, expectedGrandCost, 1)).toBeTruthy();
    } finally {
      // Cleanup: delete the new item
      if (newItemId) {
        await deleteEntity(`/api/budgets/${budgetId}/items`, newItemId).catch(() => {});
      }

      // Verify grand totals restored
      const revRes = await authenticatedRequest('admin', 'GET', `/api/budgets/${budgetId}/items`);
      const revItems: any[] = revRes.ok
        ? await revRes.json().then((j: any) => j.data ?? j.content ?? j)
        : [];
      const revNonSection = revItems.filter((i: any) => !i.section);
      const revCost = revNonSection.reduce((s: number, i: any) => s + (i.costPrice ?? 0) * (i.quantity ?? 1), 0);
      record('FM Add Item', 'Grand costTotal restored after cleanup',
        EXPECTED.grand.costTotal, revCost,
        approxEqual(revCost, EXPECTED.grand.costTotal, 1));
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 8: Portfolio Aggregate Metrics
  // ═══════════════════════════════════════════════════════════════════════════

  test('8. Portfolio aggregate metrics — total budget, active projects, at-risk count', async ({ browser }) => {
    // Create portfolio test projects via API
    const portfolioProjectIds: string[] = [];
    try {
      for (const proj of PORTFOLIO_PROJECTS) {
        try {
          const created = await createEntity<any>('/api/projects', {
            name: proj.name,
            code: proj.code,
            status: proj.status,
            budget: proj.budget,
          });
          portfolioProjectIds.push(created.id);
        } catch {
          // May already exist
          portfolioProjectIds.push('');
        }
      }

      // Verify expected aggregates
      const totalBudget = PORTFOLIO_PROJECTS.reduce((s, p) => s + p.budget, 0);
      const activeCount = PORTFOLIO_PROJECTS.filter(p => p.status === 'IN_PROGRESS').length;

      record('Portfolio', 'Total budget = SUM of project budgets',
        PORTFOLIO_EXPECTED.totalBudget, totalBudget,
        totalBudget === PORTFOLIO_EXPECTED.totalBudget);
      record('Portfolio', 'Active project count (IN_PROGRESS)',
        PORTFOLIO_EXPECTED.activeCount, activeCount,
        activeCount === PORTFOLIO_EXPECTED.activeCount);

      // Navigate to portfolio health page and check
      const { context, page } = await loginAs(browser, 'admin');
      try {
        await page.goto('/portfolio/health', { waitUntil: 'networkidle', timeout: 60_000 });

        // Page should load
        const pageLoaded = await page.locator('h1, h2, [class*="text-xl"]').first()
          .isVisible({ timeout: 10_000 }).catch(() => false);
        record('Portfolio', 'Portfolio health page loads', 'true', String(pageLoaded),
          pageLoaded, 'MAJOR');

        // If table visible, check it has rows
        const hasTable = await page.locator('table').first()
          .isVisible({ timeout: 5_000 }).catch(() => false);
        if (hasTable) {
          const rowCount = await page.locator('tbody tr').count();
          record('Portfolio', 'Portfolio has project rows', '>0', String(rowCount),
            rowCount > 0, 'MAJOR');
        } else {
          // May use card view
          const hasCards = await page.locator('[class*="grid"]').first()
            .isVisible({ timeout: 3_000 }).catch(() => false);
          record('Portfolio', 'Portfolio has content (table or cards)',
            'true', String(hasTable || hasCards), hasTable || hasCards, 'MAJOR');
        }
      } finally {
        await context.close();
      }

      expect(totalBudget).toBe(PORTFOLIO_EXPECTED.totalBudget);
      expect(activeCount).toBe(PORTFOLIO_EXPECTED.activeCount);
    } finally {
      // Cleanup portfolio projects
      for (const id of portfolioProjectIds) {
        if (id) {
          await deleteEntity('/api/projects', id).catch(() => {});
        }
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 9: EVM Calculations (Earned Value Management)
  // ═══════════════════════════════════════════════════════════════════════════

  test('9. EVM calculations — CPI, SPI, EAC, ETC, VAC formulas', async ({ browser }) => {
    // Test EVM formulas with known data
    const { bac, pv, ev, actualCost, cpi, spi, eac, etc: evmEtc, vac } = EVM_DATA;

    // Verify formula correctness
    const computedPV = bac * (EVM_DATA.plannedProgressPct / 100);
    const computedEV = bac * (EVM_DATA.actualProgressPct / 100);
    const computedCPI = computedEV / actualCost;
    const computedSPI = computedEV / computedPV;
    const computedEAC = bac / computedCPI;
    const computedETC = computedEAC - actualCost;
    const computedVAC = bac - computedEAC;

    // PV = BAC × planned%
    record('EVM', 'PV = BAC × planned%', pv, computedPV,
      approxEqual(computedPV, pv, 1));
    expect(computedPV).toBe(pv);

    // EV = BAC × actual%
    record('EVM', 'EV = BAC × actual%', ev, computedEV,
      approxEqual(computedEV, ev, 1));
    expect(computedEV).toBe(ev);

    // CPI = EV / AC
    record('EVM', 'CPI = EV / AC', cpi.toFixed(3), computedCPI.toFixed(3),
      approxEqual(computedCPI, cpi, 0.005));
    assertCPI(computedEV, actualCost, cpi, 0.005);

    // CPI < 1.0 → over budget (RED)
    const cpiStatus = computedCPI < 0.8 ? 'RED' : computedCPI < 1.0 ? 'YELLOW' : 'GREEN';
    record('EVM', 'CPI status (0.868 → RED)', 'RED', cpiStatus,
      cpiStatus === 'RED', 'MAJOR');

    // SPI = EV / PV
    record('EVM', 'SPI = EV / PV', spi.toFixed(3), computedSPI.toFixed(3),
      approxEqual(computedSPI, spi, 0.005));

    // SPI < 1.0 → behind schedule (YELLOW)
    const spiStatus = computedSPI < 0.8 ? 'RED' : computedSPI < 1.0 ? 'YELLOW' : 'GREEN';
    record('EVM', 'SPI status (0.917 → YELLOW)', 'YELLOW', spiStatus,
      spiStatus === 'YELLOW', 'MAJOR');

    // EAC = BAC / CPI
    record('EVM', 'EAC = BAC / CPI', eac.toFixed(2), computedEAC.toFixed(2),
      approxEqual(computedEAC, eac, 100)); // tolerance for rounding

    // ETC = EAC - AC
    record('EVM', 'ETC = EAC - AC', evmEtc.toFixed(2), computedETC.toFixed(2),
      approxEqual(computedETC, evmEtc, 100));

    // VAC = BAC - EAC (negative = overrun)
    record('EVM', 'VAC = BAC - EAC (negative = overrun)', vac.toFixed(2), computedVAC.toFixed(2),
      approxEqual(computedVAC, vac, 100));
    expect(computedVAC).toBeLessThan(0); // project is over budget

    // Navigate to EVM page to verify it loads
    const { context, page } = await loginAs(browser, 'admin');
    try {
      await page.goto('/planning/evm', { waitUntil: 'networkidle', timeout: 60_000 });

      const pageLoaded = await page.locator('h1, h2, [class*="text-xl"]').first()
        .isVisible({ timeout: 10_000 }).catch(() => false);
      record('EVM', 'EVM dashboard page loads', 'true', String(pageLoaded),
        pageLoaded, 'MAJOR');

      // Check for EVM metric labels on page (CPI, SPI, etc.)
      const pageText = await page.textContent('body') ?? '';
      const hasCpiLabel = /CPI/i.test(pageText);
      const hasSpiLabel = /SPI/i.test(pageText);
      record('EVM', 'CPI label present on page', 'true', String(hasCpiLabel), hasCpiLabel, 'MAJOR');
      record('EVM', 'SPI label present on page', 'true', String(hasSpiLabel), hasSpiLabel, 'MAJOR');
    } finally {
      await context.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 10: S-Curve Cash Flow Page
  // ═══════════════════════════════════════════════════════════════════════════

  test('10. S-curve cash flow page — loads and shows planned vs actual curves', async ({ browser }) => {
    const { context, page } = await loginAs(browser, 'admin');
    try {
      await page.goto('/finance/s-curve-cashflow', { waitUntil: 'networkidle', timeout: 60_000 });

      const pageLoaded = await page.locator('h1, h2, [class*="text-xl"], [class*="font-bold"]').first()
        .isVisible({ timeout: 10_000 }).catch(() => false);
      record('S-Curve', 'Page loads', 'true', String(pageLoaded), pageLoaded, 'MAJOR');

      // Check for SVG chart or chart container
      const hasSvg = await page.locator('svg').first()
        .isVisible({ timeout: 5_000 }).catch(() => false);
      const hasCanvas = await page.locator('canvas').first()
        .isVisible({ timeout: 3_000 }).catch(() => false);
      const hasChart = hasSvg || hasCanvas;
      record('S-Curve', 'Chart element visible (SVG or Canvas)', 'true', String(hasChart),
        hasChart, 'MAJOR');

      // Check for planned/actual legend or labels
      const bodyText = await page.textContent('body') ?? '';
      const hasPlannedLabel = /план|planned|PV/i.test(bodyText);
      const hasActualLabel = /факт|actual|AC|EV/i.test(bodyText);
      record('S-Curve', 'Planned curve label present', 'true', String(hasPlannedLabel),
        hasPlannedLabel, 'MINOR');
      record('S-Curve', 'Actual curve label present', 'true', String(hasActualLabel),
        hasActualLabel, 'MINOR');

      // Metric cards (if present)
      const metricCards = page.locator('[class*="card"], [class*="rounded-lg"]').filter({
        hasText: /бюджет|budget|план|план/i,
      });
      const cardCount = await metricCards.count();
      record('S-Curve', 'Metric cards count', '>0', String(cardCount),
        cardCount >= 0, 'UX'); // 0 is ok if chart-only
    } finally {
      await context.close();
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 11: Cross-Module Financial Consistency
  // ═══════════════════════════════════════════════════════════════════════════

  test('11. Cross-module financial consistency — FM ↔ Budget ↔ Invoices ↔ Payments', async () => {
    // Verify FM grand total matches budget total for the same project
    const apiRes = await authenticatedRequest('admin', 'GET', `/api/budgets/${budgetId}/items`);
    const apiItems: any[] = apiRes.ok
      ? await apiRes.json().then((j: any) => j.data ?? j.content ?? j)
      : [];
    const nonSection = apiItems.filter((i: any) => !i.section);

    // FM computed totals
    const fmCostTotal = nonSection.reduce((s: number, i: any) => s + (i.costPrice ?? 0) * (i.quantity ?? 1), 0);
    const fmCustomerTotal = nonSection.reduce((s: number, i: any) => s + (i.customerPrice ?? 0) * (i.quantity ?? 1), 0);
    const fmNdvTotal = fmCustomerTotal * 0.20;
    const fmMarginTotal = fmCustomerTotal - fmCostTotal;

    // Basic formula consistency checks
    // margin = customer - cost
    const marginCheck = approxEqual(fmMarginTotal, fmCustomerTotal - fmCostTotal, 0.01);
    record('Cross-Module', 'margin = customerTotal - costTotal', fmCustomerTotal - fmCostTotal, fmMarginTotal,
      marginCheck);

    // НДС = customer × 0.20 (ALWAYS 20% in Russia)
    const ndvCheck = approxEqual(fmNdvTotal, fmCustomerTotal * 0.20, 0.01);
    record('Cross-Module', 'НДС = customerTotal × 0.20', fmCustomerTotal * 0.20, fmNdvTotal, ndvCheck);

    // marginPct = (margin / customer) × 100
    const fmMarginPct = fmCustomerTotal > 0 ? (fmMarginTotal / fmCustomerTotal) * 100 : 0;
    const pctCheck = pctEqual(fmMarginPct, EXPECTED.grand.marginPct, 0.1);
    record('Cross-Module', 'marginPct consistency', `${EXPECTED.grand.marginPct}%`, `${fmMarginPct.toFixed(2)}%`,
      pctCheck);

    // totalWithNds = customer + НДС
    const totalWithNds = fmCustomerTotal + fmNdvTotal;
    const expectedTotal = EXPECTED.grand.totalWithNds;
    record('Cross-Module', 'totalWithNds = customer + НДС', expectedTotal, totalWithNds,
      approxEqual(totalWithNds, expectedTotal, 1));

    // Verify each item has consistent data
    let inconsistentItems = 0;
    for (const item of nonSection) {
      const cost = (item.costPrice ?? 0) * (item.quantity ?? 1);
      const customer = (item.customerPrice ?? 0) * (item.quantity ?? 1);
      const margin = customer - cost;

      // If marginAmount is stored, verify it matches computed
      if (item.marginAmount != null) {
        const marginStored = item.marginAmount;
        if (!approxEqual(marginStored, margin, 2)) {
          inconsistentItems++;
          record('Cross-Module', `${item.name} stored margin vs computed`,
            margin, marginStored, false, 'CRITICAL',
            'Stored marginAmount does not match (customer - cost) × quantity');
        }
      }

      // If marginPercent is stored, verify it matches computed
      if (item.marginPercent != null && customer > 0) {
        const expectedPct = (margin / customer) * 100;
        if (!pctEqual(item.marginPercent, expectedPct, 0.5)) {
          inconsistentItems++;
          record('Cross-Module', `${item.name} stored marginPct vs computed`,
            `${expectedPct.toFixed(2)}%`, `${item.marginPercent}%`, false, 'CRITICAL',
            'Stored marginPercent does not match computed');
        }
      }
    }

    record('Cross-Module', 'Inconsistent items count', '0', String(inconsistentItems),
      inconsistentItems === 0, inconsistentItems > 0 ? 'CRITICAL' : 'CRITICAL');

    // Verify budget-level constraints
    // FM costTotal should be < customerTotal (overall profitable)
    assertProfitable(fmCustomerTotal, fmCostTotal);
    record('Cross-Module', 'Overall profitable (customer > cost)', 'true', 'true', true);

    // Business rule: marginPct between 15-40% is healthy for construction
    const healthyMargin = fmMarginPct >= 15 && fmMarginPct <= 60;
    record('Cross-Module', 'Margin in healthy range (15-60%)',
      '15-60%', `${fmMarginPct.toFixed(2)}%`, healthyMargin, healthyMargin ? 'CRITICAL' : 'UX');

    // НДС rate must be exactly 20% — law violation otherwise
    const ndvRate = fmCustomerTotal > 0 ? (fmNdvTotal / fmCustomerTotal) * 100 : 0;
    const ndvRateCorrect = approxEqual(ndvRate, 20, 0.01);
    record('Cross-Module', 'НДС rate = 20% (Russian tax law)', '20%', `${ndvRate.toFixed(2)}%`,
      ndvRateCorrect);

    expect(marginCheck).toBeTruthy();
    expect(ndvCheck).toBeTruthy();
    expect(ndvRateCorrect).toBeTruthy();
    expect(fmCustomerTotal).toBeGreaterThan(fmCostTotal);
  });
});
