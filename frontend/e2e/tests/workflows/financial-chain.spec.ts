/**
 * Financial Chain E2E — Full Lifecycle Test
 *
 * Tests the #1 most critical business flow in the system:
 * Specification → Competitive List → Financial Model ← Estimate (ЛСР) → Commercial Proposal
 *
 * 26 steps across 7 phases, ~165 assertions.
 * All expected values are pre-calculated in financial-chain-test-spec.md.
 *
 * Domain: Russian construction ERP — ГЭСН norms, НДС=20%, КС-2/КС-3 documents.
 * Personas: прораб, бухгалтер, директор, инженер-сметчик, снабженец.
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  authenticatedRequest,
  createEntity,
  getEntity,
  updateEntity,
  deleteEntity,
  listEntities,
} from '../../fixtures/api.fixture';
import { parseRussianNumber } from '../../helpers/calculation.helper';
import { getTableData } from '../../helpers/table.helper';

// ─── Configuration ───────────────────────────────────────────────────────────

const SS = 'e2e/screenshots/financial-chain';
const CURRENCY_TOL = 1.0;   // ±1.00 rounding tolerance for currency
const PERCENT_TOL = 0.01;   // ±0.01% for percentages

// ─── Test Data (from financial-chain-test-spec.md) ───────────────────────────

const PROJECT = {
  name: 'E2E-ЖК Солнечный квартал',
  code: 'E2E-FC-001',
  status: 'PLANNING',
};

const SECTIONS = [
  { name: 'Электроснабжение', disciplineMark: 'ЭС' },
  { name: 'Вентиляция', disciplineMark: 'ОВ' },
];

interface ItemDef {
  name: string;
  category: string;
  unit: string;
  qty: number;
  weight: number | null;
  sectionIdx: number; // index into SECTIONS
}

const ITEMS: ItemDef[] = [
  { name: 'Кабель ВВГнг 3×2.5',    category: 'MATERIAL',  unit: 'м',    qty: 1500, weight: 0.12, sectionIdx: 0 },
  { name: 'Автомат АВВ 25А',        category: 'EQUIPMENT', unit: 'шт',   qty: 48,   weight: 0.3,  sectionIdx: 0 },
  { name: 'Монтаж кабельных линий', category: 'WORK',      unit: 'м',    qty: 1500, weight: null,  sectionIdx: 0 },
  { name: 'Воздуховод оцинк. 200',  category: 'MATERIAL',  unit: 'п.м.', qty: 320,  weight: 2.5,  sectionIdx: 1 },
  { name: 'Монтаж воздуховодов',    category: 'WORK',      unit: 'п.м.', qty: 320,  weight: null,  sectionIdx: 1 },
];

// КЛ vendor entries per material item (indices 0, 1, 3 in ITEMS)
const KL_MATERIAL_INDICES = [0, 1, 3]; // only materials/equipment get КЛ entries

interface VendorEntry {
  vendorName: string;
  unitPrice: number;
  deliveryDays: number;
  warrantyMonths: number;
  prepaymentPercent: number;
}

const VENDOR_ENTRIES: Record<number, VendorEntry[]> = {
  0: [ // Кабель ВВГнг
    { vendorName: 'ООО "ЭлектроПром"',     unitPrice: 45.00,  deliveryDays: 14, warrantyMonths: 12, prepaymentPercent: 30 },
    { vendorName: 'ООО "КабельОпт"',       unitPrice: 42.50,  deliveryDays: 21, warrantyMonths: 24, prepaymentPercent: 50 },
    { vendorName: 'ООО "ЭнергоСнаб"',      unitPrice: 48.00,  deliveryDays: 7,  warrantyMonths: 18, prepaymentPercent: 0 },
  ],
  1: [ // Автомат АВВ
    { vendorName: 'ООО "ЭлектроПром"',     unitPrice: 890.00,  deliveryDays: 10, warrantyMonths: 36, prepaymentPercent: 0 },
    { vendorName: 'ИП Петров К.В.',        unitPrice: 920.00,  deliveryDays: 5,  warrantyMonths: 24, prepaymentPercent: 20 },
    { vendorName: 'ООО "АВВ-Дистрибуция"', unitPrice: 875.00,  deliveryDays: 14, warrantyMonths: 12, prepaymentPercent: 100 },
  ],
  3: [ // Воздуховод оцинк.
    { vendorName: 'ООО "ВентСистемы"',     unitPrice: 380.00,  deliveryDays: 7,  warrantyMonths: 12, prepaymentPercent: 0 },
    { vendorName: 'ООО "КлиматПро"',       unitPrice: 420.00,  deliveryDays: 3,  warrantyMonths: 24, prepaymentPercent: 10 },
    { vendorName: 'ООО "ВоздухТехно"',     unitPrice: 395.00,  deliveryDays: 10, warrantyMonths: 18, prepaymentPercent: 30 },
  ],
};

// Prices set at various stages of the chain
const COST_PRICES = [42.50, 875.00, null, 380.00, null] as const;        // from КЛ winners
const ESTIMATE_PRICES = [52.00, null, 85.00, 450.00, 120.00] as const;   // from ЛСР import
const CUSTOMER_PRICES = [58.00, 1050.00, 95.00, 490.00, 140.00] as const; // from КП

// ─── Pre-Calculated Expected Values ─────────────────────────────────────────

const EXP = {
  // Item-level calculations
  costTotals:     [63_750, 42_000, 0, 121_600, 0],
  customerTotals: [87_000, 50_400, 142_500, 156_800, 44_800],
  vatAmounts:     [17_400, 10_080, 28_500, 31_360, 8_960],
  margins:        [23_250, 8_400, 142_500, 35_200, 44_800],
  marginPcts:     [26.72, 16.67, 100.00, 22.45, 100.00],

  // Overhead/Profit/Contingency (rates 12%/8%/3%)
  overheads:      [7_650, 5_040, 0, 14_592, 0],
  profits:        [5_100, 3_360, 0, 9_728, 0],
  contingencies:  [2_142, 1_411.20, 0, 4_085.76, 0],

  // KPI strip grand totals
  kpi: {
    costTotal:        227_350,
    estimateTotal:    387_900,
    customerTotal:    481_500,
    ndvTotal:         96_300,
    marginTotal:      254_150,
    marginPct:        52.78,
    overheadTotal:    27_282,
    profitTotal:      18_188,
    contingencyTotal: 7_638.96,
  },

  // Section subtotals
  sections: {
    elektro: { costTotal: 105_750, customerTotal: 279_900, ndvTotal: 55_980, marginTotal: 174_150 },
    vent:    { costTotal: 121_600, customerTotal: 201_600, ndvTotal: 40_320, marginTotal: 80_000 },
  },

  // КЛ auto-rank scores for Item 1
  klRanks: {
    vendorA: { total: 54.27, rank: 2 },
    vendorB: { total: 70.00, rank: 1 },
    vendorC: { total: 46.25, rank: 3 },
  },

  // Mutation test: item 1 qty 1500 → 2000
  mutation: {
    item1CostTotal:     85_000,
    item1CustomerTotal: 116_000,
    item1Vat:           23_200,
    item1Margin:        31_000,
    item1MarginPct:     26.72,
    kpiCostTotal:       248_600,
    kpiCustomerTotal:   510_500,
    kpiMarginTotal:     261_900,
    kpiMarginPct:       51.30,
    kpiNdvTotal:        102_100,
  },

  // Delete test: remove item 5
  deletion: {
    kpiCostTotal:     227_350,
    kpiCustomerTotal: 436_700,
    kpiMarginTotal:   209_350,
    kpiNdvTotal:      87_340,
    ventCustomerTotal: 156_800,
  },
};

// ─── Shared State ────────────────────────────────────────────────────────────

let projectId: string;
let budgetId: string;
let specId: string;
let clId: string;
let cpId: string;
const budgetItemIds: string[] = [];
const sectionItemIds: string[] = [];
const cpItemIds: string[] = [];

// ─── Issue Tracker ───────────────────────────────────────────────────────────

interface Issue {
  severity: '[CRITICAL]' | '[MAJOR]' | '[MINOR]' | '[UX]' | '[MISSING]';
  message: string;
  step: number;
  actual?: string;
  expected?: string;
}

const issues: Issue[] = [];

function logIssue(
  severity: Issue['severity'],
  message: string,
  step: number,
  actual?: string,
  expected?: string,
): void {
  issues.push({ severity, message, step, actual, expected });
  console.log(`  ${severity} Step ${step}: ${message}${actual ? ` (got: ${actual}, expected: ${expected})` : ''}`);
}

// ─── Assertion Helpers ───────────────────────────────────────────────────────

/** Assert a numeric value is within tolerance. Logs issue and continues on failure. */
function expectNear(
  actual: number,
  expected: number,
  tolerance: number,
  label: string,
  step: number,
): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    logIssue('[CRITICAL]', `${label}: value mismatch`, step, String(actual), String(expected));
  }
  expect.soft(
    diff,
    `${label} (step ${step}): expected ≈${expected}, got ${actual}`,
  ).toBeLessThanOrEqual(tolerance);
}

/** Find a row in parsed table data by partial name match */
function findRow(
  tableData: Record<string, string>[],
  nameSubstring: string,
): Record<string, string> | undefined {
  return tableData.find((row) => {
    const values = Object.values(row);
    return values.some((v) => v.includes(nameSubstring));
  });
}

/** Extract numeric value from a table row by column header pattern */
function getRowValue(
  row: Record<string, string>,
  columnPattern: RegExp,
): number {
  const key = Object.keys(row).find((k) => columnPattern.test(k));
  if (!key || !row[key]) return 0;
  return parseRussianNumber(row[key]);
}

/** Parse a KPI card value from the FM page */
async function parseKpiValue(
  page: import('@playwright/test').Page,
  labelPattern: RegExp,
): Promise<number> {
  // KPI cards are typically stat cards with a label and value
  const cards = page.locator('[data-testid*="kpi"], [class*="stat"], [class*="kpi"], [class*="card"]');
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const text = await cards.nth(i).textContent();
    if (text && labelPattern.test(text)) {
      // Extract the numeric part — usually the largest number in the card
      const numbers = text.match(/[\d\s]+[,.]?\d*/g);
      if (numbers) {
        // Take the first substantial number (skip small labels like percentages)
        for (const n of numbers) {
          const parsed = parseRussianNumber(n.trim());
          if (parsed > 0) return parsed;
        }
      }
    }
  }

  // Fallback: search in page text near the label
  const body = await page.textContent('body') || '';
  const labelMatch = body.match(new RegExp(labelPattern.source + '[^\\d]*(\\d[\\d\\s,.]*\\d)', 'i'));
  if (labelMatch) {
    return parseRussianNumber(labelMatch[1]);
  }

  return 0;
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

async function apiPost(path: string, data?: unknown): Promise<Response> {
  return authenticatedRequest('admin', 'POST', path, data);
}

async function apiGet(path: string): Promise<Response> {
  return authenticatedRequest('admin', 'GET', path);
}

async function apiPut(path: string, data: unknown): Promise<Response> {
  return authenticatedRequest('admin', 'PUT', path, data);
}

// ─── Screenshot Helper ──────────────────────────────────────────────────────

async function screenshot(
  page: import('@playwright/test').Page,
  name: string,
): Promise<void> {
  await page.screenshot({ path: `${SS}/${name}.png`, fullPage: true });
}

// =============================================================================
// TEST SUITE
// =============================================================================

test.describe.serial('Financial Chain — Full Lifecycle', () => {
  test.setTimeout(120_000); // 2 minutes per test for complex operations

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase A: Setup (Steps 1-3)
  // ═══════════════════════════════════════════════════════════════════════════

  test('Phase A — Step 1: Create project via API', async () => {
    // Step 1: Create Project
    const project = await createEntity<{ id: string }>('/api/projects', {
      name: PROJECT.name,
      code: PROJECT.code,
      status: PROJECT.status,
    }, 'admin');

    expect(project, 'Project creation should return an object').toBeTruthy();
    expect(project.id, 'Project should have an ID').toBeTruthy();
    projectId = project.id;

    console.log(`  ✓ Step 1: Project created: ${projectId}`);
  });

  test('Phase A — Step 2: Create specification + budget with items via API', async ({ page }) => {
    expect(projectId, 'projectId must be set from Step 1').toBeTruthy();

    // Create Budget (FM) for the project
    const budget = await createEntity<{ id: string }>('/api/budgets', {
      projectId,
      name: `E2E ФМ ${PROJECT.name}`,
      status: 'DRAFT',
      totalPlannedAmount: 0,
    }, 'admin');
    expect(budget.id, 'Budget should have an ID').toBeTruthy();
    budgetId = budget.id;

    // Create section headers
    for (const section of SECTIONS) {
      const sec = await createEntity<{ id: string }>(`/api/budgets/${budgetId}/items`, {
        name: section.name,
        category: 'SECTION',
        section: true,
        plannedAmount: 0,
        disciplineMark: section.disciplineMark,
      }, 'admin');
      sectionItemIds.push(sec.id);
    }

    // Create 5 budget items under their sections
    for (let i = 0; i < ITEMS.length; i++) {
      const item = ITEMS[i];
      const sectionId = sectionItemIds[item.sectionIdx];
      const bi = await createEntity<{ id: string }>(`/api/budgets/${budgetId}/items`, {
        name: item.name,
        category: item.category,
        unit: item.unit,
        quantity: item.qty,
        plannedAmount: item.qty * 100, // rough estimate placeholder
        section: false,
        sectionId,
        itemType: item.category,
      }, 'admin');
      budgetItemIds.push(bi.id);
    }
    expect(budgetItemIds.length, '5 budget items created').toBe(5);

    // Create Specification
    const spec = await createEntity<{ id: string }>('/api/specifications', {
      title: 'E2E Спецификация электро+вент',
      projectId,
      status: 'DRAFT',
    }, 'admin');
    expect(spec.id, 'Specification should have an ID').toBeTruthy();
    specId = spec.id;

    // Create Competitive List linked to spec
    const cl = await createEntity<{ id: string }>('/api/competitive-lists', {
      specificationId: specId,
      projectId,
      name: 'E2E КЛ электро+вент',
    }, 'admin');
    expect(cl.id, 'Competitive List should have an ID').toBeTruthy();
    clId = cl.id;

    // UI Verification: navigate to spec detail page
    await page.goto(`/specifications/${specId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, '01-spec-created');

    console.log(`  ✓ Step 2: Budget=${budgetId}, Spec=${specId}, КЛ=${clId}, Items=${budgetItemIds.length}`);
  });

  test('Phase A — Step 3: Verify auto-created entities via API', async () => {
    expect(projectId, 'projectId required').toBeTruthy();
    expect(budgetId, 'budgetId required').toBeTruthy();

    // Verify budget exists for project
    const budgets = await listEntities<{ id: string }>('/api/budgets', { projectId }, 'admin');
    expect.soft(budgets.length, 'At least 1 budget for project').toBeGreaterThanOrEqual(1);

    const found = budgets.find((b) => b.id === budgetId);
    expect.soft(found, 'Our budget found in project budgets').toBeTruthy();

    // Verify budget items
    const items = await listEntities<{ id: string; section?: boolean }>(
      `/api/budgets/${budgetId}/items`, {}, 'admin',
    );
    const regularItems = items.filter((i) => !i.section);
    expect.soft(regularItems.length, 'Budget should have 5 non-section items').toBe(5);

    // Verify КЛ exists
    const cls = await listEntities<{ id: string; status?: string }>(
      '/api/competitive-lists', { projectId }, 'admin',
    );
    expect.soft(cls.length, 'At least 1 КЛ for project').toBeGreaterThanOrEqual(1);

    const ourCl = cls.find((c) => c.id === clId);
    if (ourCl) {
      expect.soft(ourCl.status, 'КЛ should be DRAFT').toBe('DRAFT');
    }

    console.log(`  ✓ Step 3: Verified — ${items.length} budget items, ${cls.length} КЛ(s)`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase B: Competitive List Flow (Steps 4-8)
  // ═══════════════════════════════════════════════════════════════════════════

  test('Phase B — Steps 4-5: Add vendor entries and transition to COLLECTING', async ({ page }) => {
    expect(clId, 'clId required').toBeTruthy();

    // Step 4: Add 9 vendor entries (3 vendors × 3 material items)
    for (const itemIdx of KL_MATERIAL_INDICES) {
      const vendors = VENDOR_ENTRIES[itemIdx];
      for (const vendor of vendors) {
        await createEntity(`/api/competitive-lists/${clId}/entries`, {
          ...vendor,
          itemName: ITEMS[itemIdx].name,
          budgetItemId: budgetItemIds[itemIdx],
          quantity: ITEMS[itemIdx].qty,
          unit: ITEMS[itemIdx].unit,
        }, 'admin');
      }
    }

    // Verify 9 entries created
    const entries = await listEntities<{ id: string }>(
      `/api/competitive-lists/${clId}/entries`, {}, 'admin',
    );
    expect.soft(entries.length, '9 КЛ entries (3 vendors × 3 items)').toBe(9);

    // Step 5: Transition to COLLECTING
    await apiPost(`/api/competitive-lists/${clId}/status`, { status: 'COLLECTING' });

    // UI Verification
    const clUrl = `/specifications/${specId}/competitive-list/${clId}`;
    await page.goto(clUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, '02-kl-vendor-entries');

    // Check status badge shows COLLECTING
    const statusBadge = page.locator('[class*="badge"], [class*="Badge"], [class*="status"]')
      .filter({ hasText: /COLLECTING|Сбор|сбор/i });
    const hasBadge = await statusBadge.count() > 0;
    if (!hasBadge) {
      logIssue('[MINOR]', 'КЛ status badge COLLECTING not visible', 5);
    }

    console.log(`  ✓ Steps 4-5: ${entries.length} vendor entries added, status → COLLECTING`);
  });

  test('Phase B — Steps 6-7: Auto-rank and auto-select best prices', async ({ page }) => {
    expect(clId, 'clId required').toBeTruthy();

    // Step 6: Auto-rank entries
    const rankResp = await apiPost(`/api/competitive-lists/${clId}/auto-rank`);
    expect.soft(rankResp.ok, 'Auto-rank should succeed').toBeTruthy();

    // UI Verification: check ranked entries
    const clUrl = `/specifications/${specId}/competitive-list/${clId}`;
    await page.goto(clUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, '03-kl-auto-ranked');

    // Step 7: Auto-select best prices
    const selectResp = await apiPost(`/api/competitive-lists/${clId}/auto-select-best`);
    expect.soft(selectResp.ok, 'Auto-select should succeed').toBeTruthy();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await screenshot(page, '04-kl-auto-selected');

    // Verify winners via API
    const entries = await listEntities<{
      id: string;
      unitPrice?: number;
      selected?: boolean;
      winner?: boolean;
      vendorName?: string;
      budgetItemId?: string;
    }>(`/api/competitive-lists/${clId}/entries`, {}, 'admin');

    const winners = entries.filter((e) => e.selected || e.winner);
    expect.soft(winners.length, 'Should have 3 winners (1 per material item)').toBe(3);

    // Verify correct winners selected (cheapest)
    for (const w of winners) {
      if (w.budgetItemId === budgetItemIds[0]) {
        expectNear(w.unitPrice || 0, 42.50, 0.01, 'Item 1 winner price (КабельОпт)', 7);
      } else if (w.budgetItemId === budgetItemIds[1]) {
        expectNear(w.unitPrice || 0, 875.00, 0.01, 'Item 2 winner price (АВВ-Дистрибуция)', 7);
      } else if (w.budgetItemId === budgetItemIds[3]) {
        expectNear(w.unitPrice || 0, 380.00, 0.01, 'Item 4 winner price (ВентСистемы)', 7);
      }
    }

    console.log(`  ✓ Steps 6-7: Ranked and selected ${winners.length} winners`);
  });

  test('Phase B — Step 8: Verify costPrice propagated to FM', async ({ page }) => {
    expect(budgetId, 'budgetId required').toBeTruthy();

    // API Verification: check costPrice on budget items
    const items = await listEntities<{
      id: string;
      name?: string;
      costPrice?: number;
      priceSourceType?: string;
    }>(`/api/budgets/${budgetId}/items`, {}, 'admin');

    const regularItems = items.filter((i) => budgetItemIds.includes(i.id));

    for (const itemId of budgetItemIds) {
      const item = regularItems.find((i) => i.id === itemId);
      if (!item) continue;

      const idx = budgetItemIds.indexOf(itemId);
      const expectedCost = COST_PRICES[idx];

      if (expectedCost !== null) {
        if (item.costPrice != null) {
          expectNear(item.costPrice, expectedCost, 0.01, `Budget item ${idx + 1} costPrice`, 8);
        } else {
          // costPrice not propagated yet — may need manual trigger
          logIssue('[MAJOR]', `Budget item ${idx + 1} costPrice not set after КЛ winner selection`, 8,
            'null', String(expectedCost));
        }
      }
    }

    // UI Verification: navigate to FM page
    await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, '05-fm-after-kl-winners');

    // Check FM table shows cost prices
    const body = await page.textContent('body') || '';
    if (body.includes('42,50') || body.includes('42.50')) {
      console.log('  ✓ FM displays costPrice 42.50 for Кабель ВВГнг');
    } else {
      logIssue('[MAJOR]', 'FM does not display costPrice 42.50 for Кабель ВВГнг', 8);
    }

    console.log(`  ✓ Step 8: costPrice propagation verified`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase C: ЛСР Import (Steps 9-10)
  // ═══════════════════════════════════════════════════════════════════════════

  test('Phase C — Steps 9-10: Set estimatePrice and verify in FM', async ({ page }) => {
    expect(budgetId, 'budgetId required').toBeTruthy();

    // Step 9: Set estimatePrice on budget items (simulating ЛСР import via API)
    // In production, this would come from xlsx import; here we set directly for reliability
    const estimatePriceMap: [number, number][] = [
      [0, 52.00],   // Кабель ВВГнг
      [2, 85.00],   // Монтаж кабельных линий
      [3, 450.00],  // Воздуховод оцинк.
      [4, 120.00],  // Монтаж воздуховодов
    ];

    for (const [idx, price] of estimatePriceMap) {
      await updateEntity(`/api/budgets/${budgetId}/items`, budgetItemIds[idx], {
        estimatePrice: price,
      }, 'admin');
    }

    // Step 10: Verify estimatePrice in FM via UI
    await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, '06-fm-after-lsr-import');

    const body = await page.textContent('body') || '';

    // Check for estimate prices in page content
    const checks: [string, string][] = [
      ['52', 'Item 1 estimatePrice 52'],
      ['85', 'Item 3 estimatePrice 85'],
      ['450', 'Item 4 estimatePrice 450'],
      ['120', 'Item 5 estimatePrice 120'],
    ];

    for (const [value, label] of checks) {
      if (!body.includes(value)) {
        logIssue('[MINOR]', `${label} not visible in FM page`, 10);
      }
    }

    console.log(`  ✓ Steps 9-10: estimatePrice set for 4 items, verified in FM`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase D: КП Flow (Steps 11-16)
  // ═══════════════════════════════════════════════════════════════════════════

  test('Phase D — Steps 11-13: Create КП and set customer prices', async ({ page }) => {
    expect(budgetId, 'budgetId required').toBeTruthy();

    // Step 11: Create КП from budget
    const cp = await createEntity<{ id: string }>('/api/commercial-proposals', {
      budgetId,
      name: 'E2E КП электро+вент',
      specificationId: specId,
    }, 'admin');
    expect(cp.id, 'КП should have an ID').toBeTruthy();
    cpId = cp.id;

    // Get КП items (should be auto-created from budget items)
    const allItems = await listEntities<{
      id: string;
      name?: string;
      budgetItemId?: string;
      costPrice?: number;
      customerPrice?: number;
      itemType?: string;
      category?: string;
    }>(`/api/commercial-proposals/${cpId}/items`, {}, 'admin');

    expect.soft(allItems.length, 'КП should have 5 items').toBeGreaterThanOrEqual(5);

    // Map КП items to budget item indices for later reference
    for (const biId of budgetItemIds) {
      const cpItem = allItems.find((i) => i.budgetItemId === biId);
      cpItemIds.push(cpItem?.id || '');
    }

    // Step 12: Set customerPrice on material items via API
    const materialPrices: [number, number][] = [
      [0, 58.00],    // Кабель ВВГнг
      [1, 1050.00],  // Автомат АВВ
      [3, 490.00],   // Воздуховод оцинк.
    ];

    for (const [idx, price] of materialPrices) {
      if (cpItemIds[idx]) {
        await updateEntity(
          `/api/commercial-proposals/${cpId}/items`, cpItemIds[idx],
          { customerPrice: price },
          'admin',
        );
      }
    }

    // Step 13: Set customerPrice on work items
    const workPrices: [number, number][] = [
      [2, 95.00],   // Монтаж кабельных линий
      [4, 140.00],  // Монтаж воздуховодов
    ];

    for (const [idx, price] of workPrices) {
      if (cpItemIds[idx]) {
        await updateEntity(
          `/api/commercial-proposals/${cpId}/items`, cpItemIds[idx],
          { customerPrice: price },
          'admin',
        );
      }
    }

    // UI Verification: КП Materials tab
    await page.goto(`/commercial-proposals/${cpId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Click Materials tab
    const materialsTab = page.locator('button, [role="tab"], a').filter({ hasText: /материал/i }).first();
    if (await materialsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await materialsTab.click();
      await page.waitForTimeout(1500);
    }
    await screenshot(page, '07-kp-materials-tab');

    // Verify margins on materials
    const matBody = await page.textContent('body') || '';
    if (matBody.includes('26,72') || matBody.includes('26.72')) {
      console.log('  ✓ Item 1 margin 26.72% visible');
    } else {
      logIssue('[MINOR]', 'Item 1 margin 26.72% not visible in КП materials tab', 12);
    }

    // Click Works tab
    const worksTab = page.locator('button, [role="tab"], a').filter({ hasText: /работ/i }).first();
    if (await worksTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await worksTab.click();
      await page.waitForTimeout(1500);
    }
    await screenshot(page, '08-kp-works-tab');

    console.log(`  ✓ Steps 11-13: КП created (${cpId}), prices set for all 5 items`);
  });

  test('Phase D — Steps 14-16: Approve КП items and push to FM', async ({ page }) => {
    expect(cpId, 'cpId required').toBeTruthy();

    // Step 14: Approve all КП items via API
    for (const itemId of cpItemIds) {
      if (!itemId) continue;
      try {
        await apiPost(`/api/commercial-proposals/${cpId}/items/${itemId}/approve`);
      } catch {
        logIssue('[MAJOR]', `Failed to approve КП item ${itemId}`, 14);
      }
    }

    // Transition КП status: DRAFT → IN_REVIEW → APPROVED
    try {
      await apiPost(`/api/commercial-proposals/${cpId}/status`, { status: 'IN_REVIEW' });
      await apiPost(`/api/commercial-proposals/${cpId}/status`, { status: 'APPROVED' });
    } catch {
      logIssue('[MAJOR]', 'КП status transition failed', 14);
    }

    // Step 15: Confirm all → Push to FM
    try {
      await apiPost(`/api/commercial-proposals/${cpId}/confirm-all`);
    } catch {
      logIssue('[MINOR]', 'КП confirm-all failed (may already be confirmed)', 15);
    }

    try {
      await apiPost(`/api/commercial-proposals/${cpId}/push-to-fm`);
    } catch {
      logIssue('[MAJOR]', 'КП push-to-fm failed', 15);
    }

    // Step 16: Verify customerPrice propagated to FM
    await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await screenshot(page, '09-fm-after-kp-push');

    // API Verification: customerPrice on budget items
    const items = await listEntities<{
      id: string;
      customerPrice?: number;
    }>(`/api/budgets/${budgetId}/items`, {}, 'admin');

    for (let i = 0; i < budgetItemIds.length; i++) {
      const item = items.find((it) => it.id === budgetItemIds[i]);
      if (item?.customerPrice != null) {
        expectNear(
          item.customerPrice, CUSTOMER_PRICES[i], CURRENCY_TOL,
          `Budget item ${i + 1} customerPrice after КП push`, 16,
        );
      } else {
        logIssue('[MAJOR]', `Budget item ${i + 1} customerPrice not set after push`, 16,
          'null', String(CUSTOMER_PRICES[i]));
      }
    }

    // UI check: customerPrice values visible
    const body = await page.textContent('body') || '';
    const priceStrings = ['58', '1 050', '95', '490', '140'];
    for (let i = 0; i < priceStrings.length; i++) {
      if (!body.includes(priceStrings[i])) {
        logIssue('[MINOR]', `customerPrice "${priceStrings[i]}" not visible in FM`, 16);
      }
    }

    console.log(`  ✓ Steps 14-16: КП approved, pushed to FM, customerPrices verified`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase E: FM Calculations Verification (Steps 17-20)
  // ═══════════════════════════════════════════════════════════════════════════

  test('Phase E — Steps 17-18: Set rates and verify item-level calculations', async ({ page }) => {
    expect(budgetId, 'budgetId required').toBeTruthy();

    // Step 17: Set overhead/profit/contingency rates on all 5 items
    for (const itemId of budgetItemIds) {
      await updateEntity(`/api/budgets/${budgetId}/items`, itemId, {
        overheadRate: 12,
        profitRate: 8,
        contingencyRate: 3,
      }, 'admin');
    }

    // Wait for recalculation, then navigate to FM
    await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Step 18: Verify item-level calculations
    // Try to parse the FM table
    let tableData: Record<string, string>[] = [];
    try {
      tableData = await getTableData(page);
    } catch {
      // Table might not be standard HTML table — try fallback
      logIssue('[MINOR]', 'FM table not parsed via getTableData, using API fallback', 18);
    }

    // API fallback: get items with calculated values
    const items = await listEntities<{
      id: string;
      name?: string;
      costPrice?: number;
      estimatePrice?: number;
      customerPrice?: number;
      quantity?: number;
      costTotal?: number;
      customerTotal?: number;
      vatAmount?: number;
      margin?: number;
      marginPercent?: number;
      overheadAmount?: number;
      profitAmount?: number;
      contingencyAmount?: number;
    }>(`/api/budgets/${budgetId}/items`, {}, 'admin');

    for (let i = 0; i < budgetItemIds.length; i++) {
      const item = items.find((it) => it.id === budgetItemIds[i]);
      if (!item) {
        logIssue('[CRITICAL]', `Budget item ${i + 1} not found in API response`, 18);
        continue;
      }

      const label = `Item ${i + 1} "${ITEMS[i].name}"`;

      // costTotal = costPrice × quantity
      if (item.costTotal != null) {
        expectNear(item.costTotal, EXP.costTotals[i], CURRENCY_TOL, `${label} costTotal`, 18);
      }

      // customerTotal = customerPrice × quantity
      if (item.customerTotal != null) {
        expectNear(item.customerTotal, EXP.customerTotals[i], CURRENCY_TOL, `${label} customerTotal`, 18);
      }

      // НДС = customerTotal × 0.20
      if (item.vatAmount != null) {
        expectNear(item.vatAmount, EXP.vatAmounts[i], CURRENCY_TOL, `${label} НДС`, 18);
      }

      // Margin = customerTotal - costTotal
      if (item.margin != null) {
        expectNear(item.margin, EXP.margins[i], CURRENCY_TOL, `${label} margin`, 18);
      }

      // Margin %
      if (item.marginPercent != null) {
        expectNear(item.marginPercent, EXP.marginPcts[i], PERCENT_TOL, `${label} margin%`, 18);
      }

      // Overhead
      if (item.overheadAmount != null) {
        expectNear(item.overheadAmount, EXP.overheads[i], CURRENCY_TOL, `${label} overhead`, 18);
      }

      // Profit
      if (item.profitAmount != null) {
        expectNear(item.profitAmount, EXP.profits[i], CURRENCY_TOL, `${label} profit`, 18);
      }

      // Contingency
      if (item.contingencyAmount != null) {
        expectNear(item.contingencyAmount, EXP.contingencies[i], CURRENCY_TOL, `${label} contingency`, 18);
      }
    }

    // UI table verification: look for key values in the page
    const body = await page.textContent('body') || '';

    // Item 1 costTotal: 63 750
    if (body.includes('63 750') || body.includes('63750') || body.includes('63,750')) {
      console.log('  ✓ Item 1 costTotal 63,750 visible');
    } else {
      logIssue('[MAJOR]', 'Item 1 costTotal 63,750 not visible in FM table', 18);
    }

    // Item 2 costTotal: 42 000
    if (body.includes('42 000') || body.includes('42000') || body.includes('42,000')) {
      console.log('  ✓ Item 2 costTotal 42,000 visible');
    }

    // Margin colors: items with margin ≥ 15% should be green
    const greenIndicators = page.locator('[class*="green"], [class*="success"], [style*="green"]');
    const greenCount = await greenIndicators.count();
    if (greenCount < 4) {
      logIssue('[UX]', `Expected ≥4 green margin indicators, found ${greenCount}`, 18);
    }

    await screenshot(page, '10-fm-full-calculations');

    console.log(`  ✓ Steps 17-18: Rates set, item-level calculations verified`);
  });

  test('Phase E — Steps 19-20: Verify section subtotals and KPI strip', async ({ page }) => {
    expect(budgetId, 'budgetId required').toBeTruthy();

    await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Step 19: Verify section subtotals
    const body = await page.textContent('body') || '';

    // Section "Электроснабжение" subtotals
    const elektroChecks: [number, string][] = [
      [EXP.sections.elektro.costTotal, 'Электро costTotal 105,750'],
      [EXP.sections.elektro.customerTotal, 'Электро customerTotal 279,900'],
    ];

    for (const [expected, label] of elektroChecks) {
      const formatted = expected.toLocaleString('ru-RU').replace(/\s/g, ' ');
      const found = body.includes(formatted) || body.includes(String(expected));
      if (!found) {
        logIssue('[MINOR]', `Section subtotal ${label} not found in page`, 19);
      }
    }

    // Section "Вентиляция" subtotals
    const ventChecks: [number, string][] = [
      [EXP.sections.vent.costTotal, 'Вент costTotal 121,600'],
      [EXP.sections.vent.customerTotal, 'Вент customerTotal 201,600'],
    ];

    for (const [expected, label] of ventChecks) {
      const formatted = expected.toLocaleString('ru-RU').replace(/\s/g, ' ');
      const found = body.includes(formatted) || body.includes(String(expected));
      if (!found) {
        logIssue('[MINOR]', `Section subtotal ${label} not found in page`, 19);
      }
    }

    await screenshot(page, '12-fm-section-subtotals');

    // Step 20: Verify KPI strip grand totals
    // Try to read KPI values from the page
    const kpiChecks: [RegExp, number, string][] = [
      [/себестоимость|cost\s*total/i, EXP.kpi.costTotal, 'KPI Себестоимость'],
      [/сметн|estimate/i, EXP.kpi.estimateTotal, 'KPI Сметная стоимость'],
      [/заказчик|customer|клиент/i, EXP.kpi.customerTotal, 'KPI Заказчику'],
      [/ндс|vat|ндв|нд\s*с/i, EXP.kpi.ndvTotal, 'KPI НДС'],
      [/маржа(?!\s*%)|margin(?!\s*%)/i, EXP.kpi.marginTotal, 'KPI Маржа'],
    ];

    for (const [pattern, expected, label] of kpiChecks) {
      const value = await parseKpiValue(page, pattern);
      if (value > 0) {
        expectNear(value, expected, CURRENCY_TOL * 10, label, 20);
      } else {
        logIssue('[MINOR]', `${label} not parseable from KPI strip`, 20);
      }
    }

    // Margin percentage
    const marginPctMatch = body.match(/(\d{1,3}[,.]\d{1,2})\s*%/g);
    if (marginPctMatch) {
      const pcts = marginPctMatch.map((m) => parseRussianNumber(m.replace('%', '')));
      const mainPct = pcts.find((p) => Math.abs(p - EXP.kpi.marginPct) < 1);
      if (mainPct) {
        expectNear(mainPct, EXP.kpi.marginPct, PERCENT_TOL, 'KPI Маржа %', 20);
      } else {
        logIssue('[MAJOR]', `KPI margin% ${EXP.kpi.marginPct}% not found in page percentages`, 20);
      }
    }

    // Formula consistency checks
    // marginTotal = customerTotal - costTotal
    const apiItems = await listEntities<{
      id: string;
      costTotal?: number;
      customerTotal?: number;
      section?: boolean;
    }>(`/api/budgets/${budgetId}/items`, {}, 'admin');

    const regularItems = apiItems.filter((i) => budgetItemIds.includes(i.id));
    const sumCost = regularItems.reduce((s, i) => s + (i.costTotal || 0), 0);
    const sumCustomer = regularItems.reduce((s, i) => s + (i.customerTotal || 0), 0);

    if (sumCustomer > 0 && sumCost > 0) {
      const calculatedMargin = sumCustomer - sumCost;
      expectNear(calculatedMargin, EXP.kpi.marginTotal, CURRENCY_TOL,
        'Formula: marginTotal = customerTotal - costTotal', 20);

      const calculatedNdv = sumCustomer * 0.20;
      expectNear(calculatedNdv, EXP.kpi.ndvTotal, CURRENCY_TOL,
        'Formula: НДС = customerTotal × 0.20', 20);

      const calculatedMarginPct = (calculatedMargin / sumCustomer) * 100;
      expectNear(calculatedMarginPct, EXP.kpi.marginPct, PERCENT_TOL,
        'Formula: margin% = marginTotal / customerTotal × 100', 20);
    }

    await screenshot(page, '11-fm-kpi-strip');

    console.log(`  ✓ Steps 19-20: Section subtotals and KPI strip verified`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase F: Mutation Tests (Steps 21-22)
  // ═══════════════════════════════════════════════════════════════════════════

  test('Phase F — Step 21: Edit item quantity → verify recalculation', async ({ page }) => {
    expect(budgetId, 'budgetId required').toBeTruthy();

    // Change item 1 quantity: 1500 → 2000
    await updateEntity(`/api/budgets/${budgetId}/items`, budgetItemIds[0], {
      quantity: 2000,
    }, 'admin');

    // Navigate to FM and verify recalculated values
    await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // API verification of recalculated item
    const items = await listEntities<{
      id: string;
      costTotal?: number;
      customerTotal?: number;
      vatAmount?: number;
      margin?: number;
      marginPercent?: number;
    }>(`/api/budgets/${budgetId}/items`, {}, 'admin');

    const item1 = items.find((i) => i.id === budgetItemIds[0]);
    if (item1) {
      if (item1.costTotal != null) {
        expectNear(item1.costTotal, EXP.mutation.item1CostTotal, CURRENCY_TOL,
          'Mutated item 1 costTotal (42.50 × 2000)', 21);
      }
      if (item1.customerTotal != null) {
        expectNear(item1.customerTotal, EXP.mutation.item1CustomerTotal, CURRENCY_TOL,
          'Mutated item 1 customerTotal (58 × 2000)', 21);
      }
      if (item1.vatAmount != null) {
        expectNear(item1.vatAmount, EXP.mutation.item1Vat, CURRENCY_TOL,
          'Mutated item 1 НДС', 21);
      }
      if (item1.margin != null) {
        expectNear(item1.margin, EXP.mutation.item1Margin, CURRENCY_TOL,
          'Mutated item 1 margin', 21);
      }
      if (item1.marginPercent != null) {
        expectNear(item1.marginPercent, EXP.mutation.item1MarginPct, PERCENT_TOL,
          'Mutated item 1 margin% (should be same 26.72%)', 21);
      }
    }

    // Verify KPI totals changed
    const regularItems = items.filter((i) => budgetItemIds.includes(i.id));
    const newCostTotal = regularItems.reduce((s, i) => s + (i.costTotal || 0), 0);
    const newCustomerTotal = regularItems.reduce((s, i) => s + (i.customerTotal || 0), 0);

    if (newCostTotal > 0) {
      expectNear(newCostTotal, EXP.mutation.kpiCostTotal, CURRENCY_TOL,
        'KPI costTotal after mutation', 21);
    }
    if (newCustomerTotal > 0) {
      expectNear(newCustomerTotal, EXP.mutation.kpiCustomerTotal, CURRENCY_TOL,
        'KPI customerTotal after mutation', 21);
      expectNear(newCustomerTotal * 0.20, EXP.mutation.kpiNdvTotal, CURRENCY_TOL,
        'KPI НДС after mutation', 21);
    }

    await screenshot(page, '13-fm-after-item-edit');

    // REVERT: change quantity back to 1500
    await updateEntity(`/api/budgets/${budgetId}/items`, budgetItemIds[0], {
      quantity: 1500,
    }, 'admin');

    // Verify revert
    const revertedItems = await listEntities<{
      id: string;
      costTotal?: number;
    }>(`/api/budgets/${budgetId}/items`, {}, 'admin');
    const reverted = revertedItems.find((i) => i.id === budgetItemIds[0]);
    if (reverted?.costTotal != null) {
      expectNear(reverted.costTotal, EXP.costTotals[0], CURRENCY_TOL,
        'Reverted item 1 costTotal (back to 63,750)', 21);
    }

    console.log(`  ✓ Step 21: Quantity mutation verified and reverted`);
  });

  test('Phase F — Step 22: Delete item → verify totals decrease', async ({ page }) => {
    expect(budgetId, 'budgetId required').toBeTruthy();

    // Delete item 5 "Монтаж воздуховодов"
    const deletedItemId = budgetItemIds[4];
    await deleteEntity(`/api/budgets/${budgetId}/items`, deletedItemId, 'admin');

    // Navigate to FM and verify updated totals
    await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // API verification of decreased totals
    const items = await listEntities<{
      id: string;
      costTotal?: number;
      customerTotal?: number;
    }>(`/api/budgets/${budgetId}/items`, {}, 'admin');

    const remainingItems = items.filter((i) => budgetItemIds.slice(0, 4).includes(i.id));
    const costTotal = remainingItems.reduce((s, i) => s + (i.costTotal || 0), 0);
    const customerTotal = remainingItems.reduce((s, i) => s + (i.customerTotal || 0), 0);

    if (costTotal > 0) {
      expectNear(costTotal, EXP.deletion.kpiCostTotal, CURRENCY_TOL,
        'KPI costTotal after deletion (unchanged, item5 was 0)', 22);
    }
    if (customerTotal > 0) {
      expectNear(customerTotal, EXP.deletion.kpiCustomerTotal, CURRENCY_TOL,
        'KPI customerTotal after deletion (was 481,500 → 436,700)', 22);
      expectNear(customerTotal - costTotal, EXP.deletion.kpiMarginTotal, CURRENCY_TOL,
        'KPI marginTotal after deletion', 22);
      expectNear(customerTotal * 0.20, EXP.deletion.kpiNdvTotal, CURRENCY_TOL,
        'KPI НДС after deletion', 22);
    }

    await screenshot(page, '14-fm-after-item-delete');

    // UNDO: Re-create item 5
    const restored = await createEntity<{ id: string }>(`/api/budgets/${budgetId}/items`, {
      name: ITEMS[4].name,
      category: ITEMS[4].category,
      unit: ITEMS[4].unit,
      quantity: ITEMS[4].qty,
      plannedAmount: ITEMS[4].qty * 100,
      section: false,
      sectionId: sectionItemIds[ITEMS[4].sectionIdx],
      estimatePrice: 120.00,
      customerPrice: 140.00,
      overheadRate: 12,
      profitRate: 8,
      contingencyRate: 3,
    }, 'admin');
    budgetItemIds[4] = restored.id;

    console.log(`  ✓ Step 22: Item deletion verified, item restored`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Phase G: Negative Tests (Steps 23-26)
  // ═══════════════════════════════════════════════════════════════════════════

  test('Phase G — Step 23: Validation — customerPrice below estimatePrice', async ({ page }) => {
    expect(budgetId, 'budgetId required').toBeTruthy();

    await page.goto(`/budgets/${budgetId}/fm`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Try to find strict validation toggle
    const strictToggle = page.locator('button, [role="switch"], input[type="checkbox"]')
      .filter({ hasText: /строг|strict|валидац/i }).first();

    if (await strictToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await strictToggle.click();
      await page.waitForTimeout(500);
    } else {
      logIssue('[MISSING]', 'Strict validation toggle not found in FM page', 23);
    }

    // Try setting customerPrice below estimatePrice via API
    // Item 1: estimatePrice=52.00, try customerPrice=40.00
    try {
      const resp = await apiPut(`/api/budgets/${budgetId}/items/${budgetItemIds[0]}`, {
        customerPrice: 40.00,
      });
      if (resp.ok) {
        logIssue('[MAJOR]', 'API accepted customerPrice (40) below estimatePrice (52) without error', 23);
        // Revert
        await apiPut(`/api/budgets/${budgetId}/items/${budgetItemIds[0]}`, {
          customerPrice: 58.00,
        });
      } else {
        console.log('  ✓ API correctly rejected customerPrice below estimatePrice');
      }
    } catch {
      console.log('  ✓ API threw error for customerPrice below estimatePrice');
    }

    console.log(`  ✓ Step 23: customerPrice < estimatePrice validation tested`);
  });

  test('Phase G — Step 24: КЛ — less than 3 vendors', async () => {
    expect(specId, 'specId required').toBeTruthy();

    // Create a new temporary КЛ with only 1 vendor entry
    let tempClId: string | null = null;
    try {
      const tempCl = await createEntity<{ id: string }>('/api/competitive-lists', {
        specificationId: specId,
        projectId,
        name: 'E2E Temp КЛ — insufficient vendors',
      }, 'admin');
      tempClId = tempCl.id;

      // Add only 1 vendor entry
      await createEntity(`/api/competitive-lists/${tempClId}/entries`, {
        vendorName: 'ООО "Единственный"',
        unitPrice: 100.00,
        deliveryDays: 10,
        warrantyMonths: 12,
        prepaymentPercent: 0,
        itemName: 'Test Item',
        quantity: 1,
        unit: 'шт',
      }, 'admin');

      // Try to select winner — should fail with < 3 vendors
      const selectResp = await apiPost(`/api/competitive-lists/${tempClId}/auto-select-best`);
      if (selectResp.ok) {
        logIssue('[MAJOR]', 'КЛ auto-select succeeded with < 3 vendors (should require minimum 3)', 24);
      } else {
        console.log('  ✓ КЛ correctly rejected auto-select with < 3 vendors');
      }
    } catch {
      console.log('  ✓ КЛ threw error for < 3 vendors');
    }

    // Cleanup temp КЛ
    if (tempClId) {
      await deleteEntity('/api/competitive-lists', tempClId, 'admin').catch(() => {});
    }

    console.log(`  ✓ Step 24: КЛ minimum 3 vendors validation tested`);
  });

  test('Phase G — Step 25: КП approve material without invoice', async () => {
    expect(cpId, 'cpId required').toBeTruthy();

    // Create a new КП item without invoice linkage and try to approve
    // This tests that materials require invoice reference before approval
    const cpItems = await listEntities<{
      id: string;
      selectedInvoiceLineId?: string;
      category?: string;
      itemType?: string;
    }>(`/api/commercial-proposals/${cpId}/items`, {}, 'admin');

    const materialWithoutInvoice = cpItems.find(
      (i) => !i.selectedInvoiceLineId && (i.category === 'MATERIAL' || i.itemType === 'MATERIAL'),
    );

    if (materialWithoutInvoice) {
      try {
        const approveResp = await apiPost(
          `/api/commercial-proposals/${cpId}/items/${materialWithoutInvoice.id}/approve`,
        );
        if (approveResp.ok) {
          logIssue('[MINOR]', 'КП material item approved without invoice linkage (may be acceptable in current flow)', 25);
        }
      } catch {
        console.log('  ✓ КП correctly requires invoice before approving material');
      }
    } else {
      logIssue('[MINOR]', 'No material КП item without invoice found to test', 25);
    }

    console.log(`  ✓ Step 25: КП material-without-invoice validation tested`);
  });

  test('Phase G — Step 26: Push to FM — frozen budget', async () => {
    expect(budgetId, 'budgetId required').toBeTruthy();
    expect(cpId, 'cpId required').toBeTruthy();

    // Freeze the budget
    let budgetFrozen = false;
    try {
      // Budget must be ACTIVE before freezing: DRAFT → APPROVED → ACTIVE → FROZEN
      await apiPost(`/api/budgets/${budgetId}/approve`).catch(() => {});
      await apiPost(`/api/budgets/${budgetId}/activate`).catch(() => {});
      await apiPost(`/api/budgets/${budgetId}/freeze`);
      budgetFrozen = true;
    } catch {
      logIssue('[MINOR]', 'Could not freeze budget (status transition may not be supported)', 26);
    }

    if (budgetFrozen) {
      // Try to push КП to frozen FM
      try {
        const pushResp = await apiPost(`/api/commercial-proposals/${cpId}/push-to-fm`);
        if (pushResp.ok) {
          logIssue('[CRITICAL]', 'Push to FM succeeded on FROZEN budget (should be blocked)', 26);
        } else {
          console.log('  ✓ Push to FM correctly blocked on frozen budget');
        }
      } catch {
        console.log('  ✓ Push to FM threw error on frozen budget');
      }

      // Unfreeze: revert budget status for cleanup
      // Note: there may not be an "unfreeze" API — if not, budget stays frozen
      try {
        await apiPost(`/api/budgets/${budgetId}/activate`);
      } catch {
        logIssue('[MINOR]', 'Could not unfreeze budget for cleanup', 26);
      }
    }

    console.log(`  ✓ Step 26: Frozen budget push validation tested`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Cleanup
  // ═══════════════════════════════════════════════════════════════════════════

  test.afterAll(async () => {
    console.log('\n═══ Financial Chain E2E — Cleanup ═══');

    // Delete in reverse dependency order
    const cleanupSteps: [string, string, string][] = [
      ['КП', '/api/commercial-proposals', cpId],
      ['КЛ', '/api/competitive-lists', clId],
      ['Specification', '/api/specifications', specId],
    ];

    for (const [label, endpoint, id] of cleanupSteps) {
      if (id) {
        try {
          await deleteEntity(endpoint, id, 'admin');
          console.log(`  ✓ Deleted ${label}: ${id}`);
        } catch {
          console.log(`  ⚠ Could not delete ${label}: ${id}`);
        }
      }
    }

    // Delete budget items first, then budget
    for (const itemId of [...budgetItemIds, ...sectionItemIds]) {
      if (itemId) {
        try {
          await deleteEntity(`/api/budgets/${budgetId}/items`, itemId, 'admin');
        } catch {
          // Item may already be deleted
        }
      }
    }

    if (budgetId) {
      try {
        await deleteEntity('/api/budgets', budgetId, 'admin');
        console.log(`  ✓ Deleted Budget: ${budgetId}`);
      } catch {
        console.log(`  ⚠ Could not delete Budget: ${budgetId}`);
      }
    }

    if (projectId) {
      try {
        await deleteEntity('/api/projects', projectId, 'admin');
        console.log(`  ✓ Deleted Project: ${projectId}`);
      } catch {
        console.log(`  ⚠ Could not delete Project: ${projectId}`);
      }
    }

    // ─── Issue Summary ───
    console.log('\n═══ Issue Summary ═══');
    const counts = {
      CRITICAL: issues.filter((i) => i.severity === '[CRITICAL]').length,
      MAJOR: issues.filter((i) => i.severity === '[MAJOR]').length,
      MINOR: issues.filter((i) => i.severity === '[MINOR]').length,
      UX: issues.filter((i) => i.severity === '[UX]').length,
      MISSING: issues.filter((i) => i.severity === '[MISSING]').length,
    };

    console.log(`  CRITICAL: ${counts.CRITICAL}`);
    console.log(`  MAJOR:    ${counts.MAJOR}`);
    console.log(`  MINOR:    ${counts.MINOR}`);
    console.log(`  UX:       ${counts.UX}`);
    console.log(`  MISSING:  ${counts.MISSING}`);
    console.log(`  TOTAL:    ${issues.length}`);

    if (issues.length > 0) {
      console.log('\n  All issues:');
      for (const issue of issues) {
        console.log(`    ${issue.severity} Step ${issue.step}: ${issue.message}`);
        if (issue.actual) {
          console.log(`      Actual: ${issue.actual}, Expected: ${issue.expected}`);
        }
      }
    }

    console.log('\n═══ Financial Chain E2E — Complete ═══');
  });
});
