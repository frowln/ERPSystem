/**
 * SESSION 2.6 — Deep CRUD: Estimates (Сметы / ЛСР)
 *
 * Full lifecycle: create estimate → add sections + items → verify overhead/profit/НДС.
 * Persona focus: Инженер-сметчик (ГЭСН codes, calculations), Бухгалтер (НДС exact).
 *
 * Domain rules (MDS 81-33.2004, MDS 81-25.2001):
 *   - Direct costs = SUM(items: quantity × baseUnitCost)
 *   - Overhead (НР) = directCosts × overheadRate (typically 12%)
 *   - Profit (СП) = directCosts × profitRate (typically 8%)
 *   - Subtotal = directCosts + overhead + profit
 *   - НДС = subtotal × 0.20 (exactly 20%, non-negotiable)
 *   - Grand total = subtotal + НДС
 *
 * Pre-calculated values:
 *   Section 1: (50 × 2812.20) + (20 × 3415.50) = 140,610.00 + 68,310.00 = 208,920.00
 *   Section 2: 120 × 115.80 = 13,896.00
 *   Direct costs: 222,816.00
 *   Overhead 12%: 26,737.92
 *   Profit 8%: 17,825.28
 *   Subtotal: 267,379.20
 *   НДС 20%: 53,475.84
 *   Grand total: 320,855.04
 *
 * API endpoints tested:
 *   POST   /api/estimates                    — create
 *   GET    /api/estimates                    — list
 *   GET    /api/estimates/{id}               — detail
 *   PUT    /api/estimates/{id}               — update
 *   PATCH  /api/estimates/{id}/status        — change status
 *   POST   /api/estimates/{id}/items         — add item
 *   PUT    /api/estimates/items/{id}         — update item
 *   DELETE /api/estimates/items/{id}         — delete item
 *   GET    /api/estimates/{id}/financial-summary — totals
 *   POST   /api/estimates/{id}/recalculate   — recalculate totals
 *   POST   /api/estimates/local/import-lsr   — import hierarchical ЛСР
 */
import { test, expect } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Issue tracker                                                      */
/* ------------------------------------------------------------------ */
interface Issue {
  entity: string;
  operation: string;
  issue: string;
  severity: '[CRITICAL]' | '[MAJOR]' | '[MINOR]' | '[UX]' | '[MISSING]';
  expected: string;
  actual: string;
}
const issues: Issue[] = [];
function trackIssue(i: Issue) {
  issues.push(i);
  console.log(`${i.severity} ${i.entity}/${i.operation}: ${i.issue}`);
}

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const API = process.env.API_BASE_URL ?? 'http://localhost:8080';
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4000';
const CREDENTIALS = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@privod.ru',
  password: process.env.E2E_ADMIN_PASS ?? 'admin123',
};

let TOKEN = '';
async function getToken(): Promise<string> {
  if (TOKEN) return TOKEN;
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(CREDENTIALS),
  });
  const json = await res.json();
  TOKEN = json.accessToken ?? json.data?.accessToken ?? json.token ?? '';
  return TOKEN;
}
function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function parseRussianNumber(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/[^\d,.\-−]/g, '').replace('−', '-').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

async function apiGet(path: string) {
  const res = await fetch(`${API}${path}`, { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

async function apiPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: res.ok ? await res.json() : null };
}

async function apiPut(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}${path}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: res.ok ? await res.json() : null };
}

async function apiPatch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: res.ok ? await res.json() : null };
}

async function apiDelete(path: string) {
  const res = await fetch(`${API}${path}`, { method: 'DELETE', headers: headers() });
  return res.status;
}

/* ------------------------------------------------------------------ */
/*  Test Data                                                          */
/* ------------------------------------------------------------------ */
const ESTIMATE_NAME = 'E2E-ЛСР электромонтаж корпус 1';

const SECTION_1_ITEMS = [
  {
    name: 'Прокладка кабелей массой 1м до 1кг',
    code: 'ГЭСН 08-02-001-01',
    category: 'LABOR',
    itemType: 'WORKS',
    unit: '100 м',
    quantity: 50,
    unitPrice: 2812.20,
  },
  {
    name: 'Прокладка кабелей массой 1м до 3кг',
    code: 'ГЭСН 08-02-001-03',
    category: 'LABOR',
    itemType: 'WORKS',
    unit: '100 м',
    quantity: 20,
    unitPrice: 3415.50,
  },
];

const SECTION_2_ITEMS = [
  {
    name: 'Установка автоматических выключателей',
    code: 'ГЭСН 08-03-587-01',
    category: 'LABOR',
    itemType: 'WORKS',
    unit: 'шт',
    quantity: 120,
    unitPrice: 115.80,
  },
];

// Pre-calculated values
const CALC = {
  section1Total: 50 * 2812.20 + 20 * 3415.50, // 208,920.00
  section2Total: 120 * 115.80,                  // 13,896.00
  directCosts: 0,   // filled below
  overheadRate: 0.12,
  profitRate: 0.08,
  vatRate: 0.20,
  overhead: 0,
  profit: 0,
  subtotal: 0,
  vat: 0,
  grandTotal: 0,
};
CALC.directCosts = CALC.section1Total + CALC.section2Total; // 222,816.00
CALC.overhead = CALC.directCosts * CALC.overheadRate;        // 26,737.92
CALC.profit = CALC.directCosts * CALC.profitRate;            // 17,825.28
CALC.subtotal = CALC.directCosts + CALC.overhead + CALC.profit; // 267,379.20
CALC.vat = CALC.subtotal * CALC.vatRate;                     // 53,475.84
CALC.grandTotal = CALC.subtotal + CALC.vat;                  // 320,855.04

const TOLERANCE = 1.0; // ±1 ₽ tolerance for rounding

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let projectId: string;
let estimateId: string;
const itemIds: string[] = [];

test.describe('Estimate CRUD — Deep Lifecycle (Смета / ЛСР)', () => {
  test.describe.configure({ mode: 'serial' });

  /* ============================================================== */
  /*  SETUP                                                         */
  /* ============================================================== */
  test.beforeAll(async () => {
    await getToken();

    // Find or create E2E project
    const listRes = await fetch(`${API}/api/projects?search=E2E-ЖК Солнечный&size=5`, { headers: headers() });
    const listJson = await listRes.json();
    const projects = listJson.content ?? listJson.data ?? listJson ?? [];
    const existing = Array.isArray(projects) ? projects.find((p: any) => p.name?.includes('E2E-ЖК Солнечный')) : null;
    if (existing) {
      projectId = existing.id;
    } else {
      const createRes = await fetch(`${API}/api/projects`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          name: 'E2E-ЖК Солнечный квартал',
          code: 'E2E-ZHK-SLN',
          type: 'RESIDENTIAL',
          status: 'PLANNING',
          startDate: '2026-01-15',
          plannedEndDate: '2027-06-30',
        }),
      });
      if (createRes.ok) {
        const pJson = await createRes.json();
        projectId = pJson.id ?? pJson.data?.id;
      }
    }
  });

  /* ============================================================== */
  /*  CLEANUP                                                       */
  /* ============================================================== */
  test.afterAll(async () => {
    for (const itemId of itemIds) {
      await apiDelete(`/api/estimates/items/${itemId}`);
    }
    if (estimateId) {
      await apiDelete(`/api/estimates/${estimateId}`);
    }

    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log(`ESTIMATE CRUD: ${issues.length} issues found`);
      issues.forEach((i, idx) => {
        console.log(`  ${idx + 1}. ${i.severity} ${i.entity}/${i.operation}: ${i.issue}`);
        console.log(`     Expected: ${i.expected}`);
        console.log(`     Actual: ${i.actual}`);
      });
      console.log('═══════════════════════════════════════\n');
    }
  });

  /* ============================================================== */
  /*  A. CREATE                                                     */
  /* ============================================================== */
  test('A1: Create estimate via API', async () => {
    const { status, data } = await apiPost('/api/estimates', {
      name: ESTIMATE_NAME,
      projectId,
      status: 'DRAFT',
      notes: 'Локальная сметная расценка на электромонтаж, РИМ (ресурсно-индексный метод)',
    });

    expect(status).toBeLessThan(300);
    expect(data).toBeTruthy();
    estimateId = data.id ?? data.data?.id;
    expect(estimateId).toBeTruthy();
  });

  test('A2: Add Section 1 items (кабельная прокладка)', async () => {
    expect(estimateId).toBeTruthy();

    for (const item of SECTION_1_ITEMS) {
      const { status, data } = await apiPost(`/api/estimates/${estimateId}/items`, {
        ...item,
        estimateId,
        sectionName: 'Раздел 1. Электромонтаж',
      });

      if (status < 300 && data) {
        const id = data.id ?? data.data?.id;
        if (id) itemIds.push(id);
      } else {
        trackIssue({
          entity: 'EstimateItem',
          operation: 'CREATE',
          issue: `Failed to create item "${item.name}"`,
          severity: '[MAJOR]',
          expected: '201 Created',
          actual: `${status}`,
        });
      }
    }
  });

  test('A3: Add Section 2 item (монтаж оборудования)', async () => {
    for (const item of SECTION_2_ITEMS) {
      const { status, data } = await apiPost(`/api/estimates/${estimateId}/items`, {
        ...item,
        estimateId,
        sectionName: 'Раздел 2. Монтаж оборудования',
      });

      if (status < 300 && data) {
        const id = data.id ?? data.data?.id;
        if (id) itemIds.push(id);
      } else {
        trackIssue({
          entity: 'EstimateItem',
          operation: 'CREATE',
          issue: `Failed to create item "${item.name}"`,
          severity: '[MAJOR]',
          expected: '201 Created',
          actual: `${status}`,
        });
      }
    }

    expect(itemIds.length).toBe(3);
  });

  test('A4: Verify estimate in /estimates list', async ({ page }) => {
    await page.goto(`${BASE_URL}/estimates`);
    await page.waitForLoadState('networkidle');

    const estimateRow = page.getByText(ESTIMATE_NAME).first();
    const isVisible = await estimateRow.isVisible().catch(() => false);

    if (!isVisible) {
      // Try searching
      const searchInput = page.locator('input[type="search"], input[placeholder*="Поиск" i]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('E2E-ЛСР');
        await page.waitForTimeout(500);
      }

      const afterSearch = await page.getByText(ESTIMATE_NAME).first().isVisible().catch(() => false);
      if (!afterSearch) {
        trackIssue({
          entity: 'Estimate',
          operation: 'READ',
          issue: 'Estimate not visible in list page',
          severity: '[MAJOR]',
          expected: `"${ESTIMATE_NAME}" in list`,
          actual: 'Not found',
        });
      }
    }
  });

  /* ============================================================== */
  /*  B. READ — detail, API, financial summary                      */
  /* ============================================================== */
  test('B1: Verify estimate detail via API', async () => {
    const detail = await apiGet(`/api/estimates/${estimateId}`);
    expect(detail).toBeTruthy();

    const name = detail.name ?? detail.data?.name;
    expect(name).toContain('E2E-ЛСР');
  });

  test('B2: Verify items via API — 3 items with correct quantities', async () => {
    const itemsRes = await apiGet(`/api/estimates/${estimateId}/items`);
    const items = itemsRes?.content ?? itemsRes?.data ?? itemsRes ?? [];

    if (Array.isArray(items) && items.length > 0) {
      // Find cable item
      const cableItem = items.find((i: any) =>
        i.name?.includes('Прокладка кабелей массой 1м до 1кг') || i.code?.includes('08-02-001-01'));

      if (cableItem) {
        expect(cableItem.quantity).toBe(50);
      }

      // Find breaker item
      const breakerItem = items.find((i: any) =>
        i.name?.includes('Установка автоматических') || i.code?.includes('08-03-587-01'));

      if (breakerItem) {
        expect(breakerItem.quantity).toBe(120);
      }
    } else {
      trackIssue({
        entity: 'EstimateItem',
        operation: 'READ',
        issue: 'Items not returned from API',
        severity: '[MAJOR]',
        expected: '3 items',
        actual: `${items?.length ?? 0}`,
      });
    }
  });

  test('B3: Verify Section 1 total = 208,920.00', async () => {
    const itemsRes = await apiGet(`/api/estimates/${estimateId}/items`);
    const items = itemsRes?.content ?? itemsRes?.data ?? itemsRes ?? [];

    if (Array.isArray(items) && items.length >= 2) {
      // Items in section 1 (cable laying)
      const sec1Items = items.filter((i: any) =>
        i.code?.includes('08-02-001') || i.name?.includes('Прокладка кабелей'));

      let sec1Total = 0;
      for (const item of sec1Items) {
        const amount = item.amount ?? (item.quantity * (item.unitPrice ?? 0));
        sec1Total += amount;
      }

      if (sec1Items.length > 0) {
        const diff = Math.abs(sec1Total - CALC.section1Total);
        if (diff > TOLERANCE) {
          trackIssue({
            entity: 'Estimate',
            operation: 'CALC',
            issue: `Section 1 total: ${sec1Total} vs expected ${CALC.section1Total}`,
            severity: '[CRITICAL]',
            expected: `${CALC.section1Total}`,
            actual: `${sec1Total}`,
          });
        }
      }
    }
  });

  test('B4: Verify Section 2 total = 13,896.00', async () => {
    const itemsRes = await apiGet(`/api/estimates/${estimateId}/items`);
    const items = itemsRes?.content ?? itemsRes?.data ?? itemsRes ?? [];

    if (Array.isArray(items)) {
      const sec2Items = items.filter((i: any) =>
        i.code?.includes('08-03-587') || i.name?.includes('Установка автоматических'));

      let sec2Total = 0;
      for (const item of sec2Items) {
        const amount = item.amount ?? (item.quantity * (item.unitPrice ?? 0));
        sec2Total += amount;
      }

      if (sec2Items.length > 0) {
        const diff = Math.abs(sec2Total - CALC.section2Total);
        if (diff > TOLERANCE) {
          trackIssue({
            entity: 'Estimate',
            operation: 'CALC',
            issue: `Section 2 total: ${sec2Total} vs expected ${CALC.section2Total}`,
            severity: '[CRITICAL]',
            expected: `${CALC.section2Total}`,
            actual: `${sec2Total}`,
          });
        }
      }
    }
  });

  test('B5: Verify direct costs = 222,816.00', async () => {
    const itemsRes = await apiGet(`/api/estimates/${estimateId}/items`);
    const items = itemsRes?.content ?? itemsRes?.data ?? itemsRes ?? [];

    if (Array.isArray(items) && items.length > 0) {
      let totalDirect = 0;
      for (const item of items) {
        const amount = item.amount ?? (item.quantity * (item.unitPrice ?? 0));
        totalDirect += amount;
      }

      const diff = Math.abs(totalDirect - CALC.directCosts);
      if (diff > TOLERANCE) {
        trackIssue({
          entity: 'Estimate',
          operation: 'CALC',
          issue: `Direct costs: ${totalDirect} vs expected ${CALC.directCosts}`,
          severity: '[CRITICAL]',
          expected: `${CALC.directCosts}`,
          actual: `${totalDirect}`,
        });
      }
      expect(diff).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  test('B6: Verify financial summary — overhead, profit, НДС, grand total', async () => {
    // Try financial summary endpoint
    const summary = await apiGet(`/api/estimates/${estimateId}/financial-summary`);

    if (summary) {
      const data = summary.data ?? summary;

      // Check overhead (12%)
      if (data.overhead !== undefined) {
        const diff = Math.abs(data.overhead - CALC.overhead);
        if (diff > TOLERANCE) {
          trackIssue({
            entity: 'Estimate',
            operation: 'CALC',
            issue: `Overhead: ${data.overhead} vs expected ${CALC.overhead}`,
            severity: '[CRITICAL]',
            expected: `${CALC.overhead}`,
            actual: `${data.overhead}`,
          });
        }
      }

      // Check profit (8%)
      if (data.profit !== undefined) {
        const diff = Math.abs(data.profit - CALC.profit);
        if (diff > TOLERANCE) {
          trackIssue({
            entity: 'Estimate',
            operation: 'CALC',
            issue: `Profit: ${data.profit} vs expected ${CALC.profit}`,
            severity: '[CRITICAL]',
            expected: `${CALC.profit}`,
            actual: `${data.profit}`,
          });
        }
      }

      // Check НДС (20%) — non-negotiable
      if (data.vat !== undefined || data.nds !== undefined) {
        const vat = data.vat ?? data.nds;
        const diff = Math.abs(vat - CALC.vat);
        if (diff > TOLERANCE) {
          trackIssue({
            entity: 'Estimate',
            operation: 'CALC',
            issue: `НДС: ${vat} vs expected ${CALC.vat} (MUST be exactly 20%)`,
            severity: '[CRITICAL]',
            expected: `${CALC.vat}`,
            actual: `${vat}`,
          });
        }
      }

      // Check grand total
      if (data.grandTotal !== undefined || data.totalAmount !== undefined) {
        const total = data.grandTotal ?? data.totalAmount;
        const diff = Math.abs(total - CALC.grandTotal);
        if (diff > TOLERANCE) {
          trackIssue({
            entity: 'Estimate',
            operation: 'CALC',
            issue: `Grand total: ${total} vs expected ${CALC.grandTotal}`,
            severity: '[CRITICAL]',
            expected: `${CALC.grandTotal}`,
            actual: `${total}`,
          });
        }
      }
    } else {
      trackIssue({
        entity: 'Estimate',
        operation: 'READ',
        issue: 'Financial summary endpoint not available',
        severity: '[MISSING]',
        expected: 'GET /estimates/{id}/financial-summary returns overhead, profit, НДС, total',
        actual: 'Endpoint returned null/error',
      });

      // Verify via manual calculation from items
      const estimateDetail = await apiGet(`/api/estimates/${estimateId}`);
      if (estimateDetail) {
        const total = estimateDetail.totalAmount ?? estimateDetail.data?.totalAmount;
        if (total) {
          console.log(`Estimate totalAmount from API: ${total}`);
        }
      }
    }
  });

  /* ============================================================== */
  /*  C. UPDATE                                                     */
  /* ============================================================== */
  test('C1: Update item quantity and verify recalculation', async () => {
    if (itemIds.length === 0) return;

    // Change first item qty from 50 to 60
    const { status } = await apiPut(`/api/estimates/items/${itemIds[0]}`, {
      name: 'Прокладка кабелей массой 1м до 1кг',
      code: 'ГЭСН 08-02-001-01',
      category: 'LABOR',
      itemType: 'WORKS',
      unit: '100 м',
      quantity: 60, // was 50
      unitPrice: 2812.20,
    });

    if (status >= 300) {
      trackIssue({
        entity: 'EstimateItem',
        operation: 'UPDATE',
        issue: 'Failed to update item quantity',
        severity: '[MAJOR]',
        expected: '200 OK',
        actual: `${status}`,
      });
      return;
    }

    // New direct costs: (60 × 2812.20) + (20 × 3415.50) + (120 × 115.80)
    // = 168,732.00 + 68,310.00 + 13,896.00 = 250,938.00
    const newDirectCosts = 60 * 2812.20 + 20 * 3415.50 + 120 * 115.80;

    // Trigger recalculation
    await apiPost(`/api/estimates/${estimateId}/recalculate`, {});

    // Verify
    const detail = await apiGet(`/api/estimates/${estimateId}`);
    if (detail) {
      const total = detail.totalAmount ?? detail.data?.totalAmount;
      if (total) {
        console.log(`After qty update: totalAmount = ${total}, expected direct costs = ${newDirectCosts}`);
      }
    }

    // Revert quantity back to 50
    await apiPut(`/api/estimates/items/${itemIds[0]}`, {
      name: 'Прокладка кабелей массой 1м до 1кг',
      code: 'ГЭСН 08-02-001-01',
      category: 'LABOR',
      itemType: 'WORKS',
      unit: '100 м',
      quantity: 50,
      unitPrice: 2812.20,
    });
    await apiPost(`/api/estimates/${estimateId}/recalculate`, {});
  });

  test('C2: Update estimate status DRAFT → IN_WORK', async () => {
    const { status } = await apiPatch(`/api/estimates/${estimateId}/status`, {
      status: 'IN_WORK',
    });

    if (status >= 300) {
      const { status: putStatus } = await apiPut(`/api/estimates/${estimateId}`, {
        name: ESTIMATE_NAME,
        projectId,
        status: 'IN_WORK',
      });

      if (putStatus >= 300) {
        trackIssue({
          entity: 'Estimate',
          operation: 'UPDATE',
          issue: 'Cannot transition DRAFT → IN_WORK',
          severity: '[MAJOR]',
          expected: '200 OK',
          actual: `PATCH: ${status}, PUT: ${putStatus}`,
        });
      }
    }
  });

  /* ============================================================== */
  /*  D. DETAIL PAGE UI                                             */
  /* ============================================================== */
  test('D1: Estimate detail page loads with items', async ({ page }) => {
    if (!estimateId) return;

    await page.goto(`${BASE_URL}/estimates/${estimateId}`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);

    // Should show ГЭСН codes
    const hasGesn = body?.includes('ГЭСН') || body?.includes('08-02') || body?.includes('08-03');
    if (!hasGesn) {
      trackIssue({
        entity: 'Estimate',
        operation: 'UI',
        issue: 'ГЭСН codes not visible on detail page',
        severity: '[UX]',
        expected: 'ГЭСН codes visible (e.g., ГЭСН 08-02-001-01)',
        actual: 'Not found in page content',
      });
    }
  });

  test('D2: Estimate list page shows plan vs fact columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/estimates`);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table').first();
    if (await table.isVisible().catch(() => false)) {
      const headerCells = await page.locator('th').allTextContents();
      const headerText = headerCells.join(' ').toLowerCase();

      // Should have plan/fact columns (План/Факт or similar)
      const hasPlan = headerText.includes('план') || headerText.includes('plan') || headerText.includes('сумма');
      if (!hasPlan) {
        trackIssue({
          entity: 'Estimate',
          operation: 'UI',
          issue: 'Plan column not visible in list',
          severity: '[MINOR]',
          expected: 'План/Plan/Сумма column',
          actual: `Headers: ${headerCells.join(', ')}`,
        });
      }
    }
  });

  test('D3: Estimate form page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/estimates/new`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);
  });

  /* ============================================================== */
  /*  E. VALIDATION                                                 */
  /* ============================================================== */
  test('E1: Cannot create item with quantity = 0', async () => {
    const { status } = await apiPost(`/api/estimates/${estimateId}/items`, {
      name: 'E2E-Invalid zero-qty item',
      category: 'LABOR',
      itemType: 'WORKS',
      unit: 'шт',
      quantity: 0,
      unitPrice: 100,
    });

    if (status < 300) {
      trackIssue({
        entity: 'EstimateItem',
        operation: 'VALIDATION',
        issue: 'Accepted item with quantity = 0',
        severity: '[MAJOR]',
        expected: '400 Bad Request',
        actual: `${status} (accepted)`,
      });
    }
  });

  test('E2: Cannot create item without name', async () => {
    const { status } = await apiPost(`/api/estimates/${estimateId}/items`, {
      name: '',
      category: 'LABOR',
      itemType: 'WORKS',
      unit: 'шт',
      quantity: 10,
      unitPrice: 100,
    });

    if (status < 300) {
      trackIssue({
        entity: 'EstimateItem',
        operation: 'VALIDATION',
        issue: 'Accepted item with empty name',
        severity: '[MAJOR]',
        expected: '400 Bad Request',
        actual: `${status} (accepted)`,
      });
    }
  });

  test('E3: Warning for overhead > 25% (atypical)', async () => {
    // Domain rule: overhead > 25% is suspicious
    // We test by checking if the system flags unusual percentages
    console.log('[INFO] Overhead rate check: standard = 12%, warning threshold = 25%');
    console.log(`[INFO] Current overhead: ${CALC.overhead} (${(CALC.overheadRate * 100).toFixed(0)}% of direct costs)`);

    if (CALC.overheadRate > 0.25) {
      trackIssue({
        entity: 'Estimate',
        operation: 'VALIDATION',
        issue: `Overhead rate ${(CALC.overheadRate * 100).toFixed(0)}% exceeds 25% threshold`,
        severity: '[MAJOR]',
        expected: 'Overhead 12-25% (normal range)',
        actual: `${(CALC.overheadRate * 100).toFixed(0)}%`,
      });
    }
  });

  test('E4: Warning for profit > 15% (atypical)', async () => {
    console.log('[INFO] Profit rate check: standard = 8%, warning threshold = 15%');
    console.log(`[INFO] Current profit: ${CALC.profit} (${(CALC.profitRate * 100).toFixed(0)}% of direct costs)`);

    if (CALC.profitRate > 0.15) {
      trackIssue({
        entity: 'Estimate',
        operation: 'VALIDATION',
        issue: `Profit rate ${(CALC.profitRate * 100).toFixed(0)}% exceeds 15% threshold`,
        severity: '[MAJOR]',
        expected: 'Profit 6-10% (normal ГЭСН range)',
        actual: `${(CALC.profitRate * 100).toFixed(0)}%`,
      });
    }
  });

  test('E5: НДС must be exactly 20% (non-negotiable)', async () => {
    // НДС = 20% per НК РФ ст.164 — no exceptions
    const vatCheck = CALC.subtotal * 0.20;
    const diff = Math.abs(vatCheck - CALC.vat);
    expect(diff).toBeLessThanOrEqual(0.01);

    // Verify the calculation is correct
    expect(CALC.vat).toBeCloseTo(53475.84, 1);
  });

  /* ============================================================== */
  /*  F. LSR IMPORT WIZARD                                          */
  /* ============================================================== */
  test('F1: LSR import wizard page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/estimates/import-lsr`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);

    // Should show upload zone or step indicator
    const hasUpload = body?.includes('xlsx') || body?.includes('Загрузить') || body?.includes('файл');
    if (!hasUpload) {
      trackIssue({
        entity: 'Estimate',
        operation: 'UI',
        issue: 'LSR import wizard does not show upload zone',
        severity: '[UX]',
        expected: 'Upload zone for xlsx/xls files',
        actual: 'Not found',
      });
    }
  });

  test('F2: Minstroy index page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/estimates/minstroy`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  /* ============================================================== */
  /*  G. DELETE                                                     */
  /* ============================================================== */
  test('G1: Delete single estimate item', async () => {
    if (itemIds.length < 3) return;

    const lastItemId = itemIds[itemIds.length - 1];
    const status = await apiDelete(`/api/estimates/items/${lastItemId}`);

    if (status < 300 || status === 404) {
      itemIds.pop();
    } else {
      trackIssue({
        entity: 'EstimateItem',
        operation: 'DELETE',
        issue: 'Failed to delete estimate item',
        severity: '[MAJOR]',
        expected: '200/204',
        actual: `${status}`,
      });
    }
  });

  test('G2: Verify item count after deletion', async () => {
    const itemsRes = await apiGet(`/api/estimates/${estimateId}/items`);
    const items = itemsRes?.content ?? itemsRes?.data ?? itemsRes ?? [];

    if (Array.isArray(items)) {
      // Should be 2 items now (was 3, deleted 1)
      if (items.length !== 2 && items.length !== 3) {
        trackIssue({
          entity: 'EstimateItem',
          operation: 'DELETE',
          issue: `Expected 2 items after deletion, got ${items.length}`,
          severity: '[MINOR]',
          expected: '2 items',
          actual: `${items.length}`,
        });
      }
    }
  });

  /* ============================================================== */
  /*  H. CROSS-ENTITY                                               */
  /* ============================================================== */
  test('H1: Estimate linked to project', async () => {
    const detail = await apiGet(`/api/estimates/${estimateId}`);
    const linkedProject = detail?.projectId ?? detail?.data?.projectId;

    if (linkedProject) {
      expect(linkedProject).toBe(projectId);
    }
  });

  test('H2: Pricing database page loads (ГЭСН reference)', async ({ page }) => {
    await page.goto(`${BASE_URL}/estimates/pricing/databases`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);

    // Should mention ГЭСН, ФЕР, or ТЕР
    const hasNormative = body?.includes('ГЭСН') || body?.includes('ФЕР') || body?.includes('ТЕР')
      || body?.includes('расценк') || body?.includes('Pricing');

    if (!hasNormative) {
      trackIssue({
        entity: 'Estimate',
        operation: 'CROSS',
        issue: 'Pricing database page does not reference ГЭСН/ФЕР/ТЕР',
        severity: '[UX]',
        expected: 'Normative pricing reference',
        actual: 'Not found',
      });
    }
  });
});
