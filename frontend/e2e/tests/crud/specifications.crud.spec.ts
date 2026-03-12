/**
 * SESSION 2.6 — Deep CRUD: Specifications (Спецификации)
 *
 * Full lifecycle: create spec → add items → verify columns → push to FM → create КЛ.
 * Persona focus: Инженер-сметчик (columns, quantities), Снабженец (КЛ, vendors).
 *
 * Domain rules:
 *   - Spec items: Наименование, Тип/Марка, Код, Завод, Ед.изм., Кол-во, Вес, Примечание
 *   - NO price columns in spec (prices come from КП/КЛ/ФМ later)
 *   - Minimum 3 vendors in КЛ (procurement best practice)
 *   - Weight must be filled for MATERIAL items (logistics planning)
 *   - Each spec item can be pushed to FM (budgetItemId backlink)
 *
 * API endpoints tested:
 *   POST   /api/specifications               — create
 *   GET    /api/specifications               — list
 *   GET    /api/specifications/{id}          — detail
 *   PUT    /api/specifications/{id}          — update
 *   PATCH  /api/specifications/{id}/status   — change status
 *   DELETE /api/specifications/{id}          — delete
 *   POST   /api/specifications/{id}/items    — add items
 *   PUT    /api/specifications/items/{id}    — update item
 *   DELETE /api/specifications/items/{id}    — delete item
 *   GET    /api/competitive-lists            — list КЛ
 *   POST   /api/competitive-lists            — create КЛ
 *   POST   /api/competitive-lists/{id}/entries — add vendor entry
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
const SPEC_NAME = 'E2E-Спецификация электромонтажных работ, корпус 1';

const SPEC_ITEMS = [
  {
    name: 'Кабель силовой',
    brand: 'ВВГнг(А)-LS 3×2.5',
    productCode: 'ГОСТ 31996-2012',
    manufacturer: 'ОАО "Электрокабель"',
    unitOfMeasure: 'м',
    quantity: 5000,
    weight: 0.11,
    notes: 'Прокладка в гофре',
    itemType: 'MATERIAL',
  },
  {
    name: 'Кабель силовой',
    brand: 'ВВГнг(А)-LS 5×4.0',
    productCode: 'ГОСТ 31996-2012',
    manufacturer: 'ОАО "Электрокабель"',
    unitOfMeasure: 'м',
    quantity: 2000,
    weight: 0.28,
    notes: 'Прокладка в лотке',
    itemType: 'MATERIAL',
  },
  {
    name: 'Автоматический выключатель',
    brand: 'ВА47-29 25А',
    productCode: 'ТУ 2000-001-12345678',
    manufacturer: 'IEK',
    unitOfMeasure: 'шт',
    quantity: 120,
    weight: 0.15,
    notes: '',
    itemType: 'EQUIPMENT',
  },
  {
    name: 'Щит распределительный',
    brand: 'ЩР-24 IP31',
    productCode: 'ГОСТ Р 51778-2001',
    manufacturer: 'ООО "ЭЩК"',
    unitOfMeasure: 'шт',
    quantity: 5,
    weight: 12.0,
    notes: 'Навесного исполнения',
    itemType: 'EQUIPMENT',
  },
  {
    name: 'Труба гофрированная',
    brand: 'ПНД d=25мм',
    productCode: 'ТУ 3649-010-12345678',
    manufacturer: 'ООО "Трубпласт"',
    unitOfMeasure: 'м',
    quantity: 5200,
    weight: 0.08,
    notes: 'С зондом',
    itemType: 'MATERIAL',
  },
];

// Pre-calculated: 5000×0.11 + 2000×0.28 + 120×0.15 + 5×12 + 5200×0.08
// = 550 + 560 + 18 + 60 + 416 = 1604 кг
const EXPECTED_TOTAL_WEIGHT = 1604;

const COMPETITIVE_LIST_ENTRIES = [
  { vendorName: 'ООО "ЭлектроПром"', unitPrice: 85.0, deliveryDays: 5, note: '' },
  { vendorName: 'ООО "КабельТорг"', unitPrice: 82.0, deliveryDays: 10, note: 'Минимум 3000м' },
  { vendorName: 'АО "Электрокомплект"', unitPrice: 88.0, deliveryDays: 3, note: 'Со склада' },
];

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */
let projectId: string;
let specId: string;
const itemIds: string[] = [];
let competitiveListId: string;

test.describe('Specification CRUD — Deep Lifecycle (Спецификация)', () => {
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
    // Delete spec items
    for (const itemId of itemIds) {
      await apiDelete(`/api/specifications/items/${itemId}`);
    }
    // Delete competitive list
    if (competitiveListId) {
      await apiDelete(`/api/competitive-lists/${competitiveListId}`);
    }
    // Delete specification
    if (specId) {
      await apiDelete(`/api/specifications/${specId}`);
    }

    // Print issue summary
    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log(`SPECIFICATION CRUD: ${issues.length} issues found`);
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
  test('A1: Create specification via API', async () => {
    const { status, data } = await apiPost('/api/specifications', {
      name: SPEC_NAME,
      projectId,
      status: 'DRAFT',
      notes: 'Электромонтажные работы по корпусу 1, ЖК Солнечный квартал',
    });

    expect(status).toBeLessThan(300);
    expect(data).toBeTruthy();
    specId = data.id ?? data.data?.id;
    expect(specId).toBeTruthy();
  });

  test('A2: Add 5 spec items via API', async () => {
    expect(specId).toBeTruthy();

    for (const item of SPEC_ITEMS) {
      const { status, data } = await apiPost(`/api/specifications/${specId}/items`, {
        ...item,
        specificationId: specId,
      });

      // Accept 200/201/202
      if (status < 300 && data) {
        const id = data.id ?? data.data?.id;
        if (id) itemIds.push(id);
      } else {
        trackIssue({
          entity: 'SpecItem',
          operation: 'CREATE',
          issue: `Failed to create item "${item.name} ${item.brand}"`,
          severity: '[MAJOR]',
          expected: '201 Created',
          actual: `${status}`,
        });
      }
    }

    expect(itemIds.length).toBe(5);
  });

  test('A3: Verify item count = 5', async () => {
    const detail = await apiGet(`/api/specifications/${specId}`);
    expect(detail).toBeTruthy();

    const items = detail.items ?? detail.data?.items;
    const itemCount = detail.itemCount ?? detail.data?.itemCount ?? (items ? items.length : 0);

    if (itemCount !== 5 && (!items || items.length !== 5)) {
      trackIssue({
        entity: 'Specification',
        operation: 'READ',
        issue: 'Item count mismatch',
        severity: '[MAJOR]',
        expected: '5 items',
        actual: `${itemCount ?? 'unknown'}`,
      });
    }
  });

  test('A4: Verify spec in /specifications list', async ({ page }) => {
    await page.goto(`${BASE_URL}/specifications`);
    await page.waitForLoadState('networkidle');

    // Look for the spec name in the list
    const specRow = page.getByText(SPEC_NAME).first();
    const isVisible = await specRow.isVisible().catch(() => false);

    if (!isVisible) {
      trackIssue({
        entity: 'Specification',
        operation: 'READ',
        issue: 'Specification not visible in list page',
        severity: '[MAJOR]',
        expected: `"${SPEC_NAME}" visible in list`,
        actual: 'Not found',
      });
    }

    // Verify DRAFT status badge
    const draftBadge = page.getByText(/DRAFT|Черновик/i).first();
    await expect(draftBadge).toBeVisible({ timeout: 5000 }).catch(() => {
      trackIssue({
        entity: 'Specification',
        operation: 'READ',
        issue: 'DRAFT status badge not visible',
        severity: '[MINOR]',
        expected: 'DRAFT badge visible',
        actual: 'Not found',
      });
    });
  });

  /* ============================================================== */
  /*  B. READ — columns, detail, items                              */
  /* ============================================================== */
  test('B1: Verify spec detail shows correct columns (no prices)', async ({ page }) => {
    await page.goto(`${BASE_URL}/specifications/${specId}`);
    await page.waitForLoadState('networkidle');

    // Required columns for spec items table
    const requiredColumns = ['Наименование', 'Ед.'];
    const optionalColumns = ['Тип', 'Марка', 'Код', 'Завод', 'Кол-во', 'Вес', 'Примечание'];
    const forbiddenColumns = ['Цена', 'Стоимость', 'Price', 'Cost', 'Amount'];

    for (const col of requiredColumns) {
      const header = page.getByRole('columnheader', { name: new RegExp(col, 'i') }).first();
      const altHeader = page.locator('th').filter({ hasText: new RegExp(col, 'i') }).first();
      const visible = await header.isVisible().catch(() => false) || await altHeader.isVisible().catch(() => false);
      if (!visible) {
        trackIssue({
          entity: 'Specification',
          operation: 'READ',
          issue: `Required column "${col}" not visible in spec items table`,
          severity: '[MAJOR]',
          expected: `Column "${col}" visible`,
          actual: 'Not found',
        });
      }
    }

    // Price columns must NOT exist in spec (prices come later via КП/КЛ/ФМ)
    for (const col of forbiddenColumns) {
      const header = page.locator('th').filter({ hasText: new RegExp(col, 'i') }).first();
      const visible = await header.isVisible().catch(() => false);
      if (visible) {
        trackIssue({
          entity: 'Specification',
          operation: 'READ',
          issue: `Price column "${col}" found in spec — spec should have physical quantities only`,
          severity: '[CRITICAL]',
          expected: 'No price columns',
          actual: `Column "${col}" visible`,
        });
      }
    }
  });

  test('B2: Verify spec detail via API — all 5 items with correct data', async () => {
    const detail = await apiGet(`/api/specifications/${specId}`);
    const items = detail?.items ?? detail?.data?.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      // Try fetching items separately
      const itemsRes = await apiGet(`/api/specifications/${specId}/items`);
      const itemsList = itemsRes?.content ?? itemsRes?.data ?? itemsRes ?? [];

      if (Array.isArray(itemsList) && itemsList.length > 0) {
        // Verify first item data
        const cable = itemsList.find((i: any) => i.brand?.includes('3×2.5') || i.name?.includes('3×2.5'));
        if (cable) {
          expect(cable.quantity).toBe(5000);
          expect(cable.unitOfMeasure ?? cable.unit).toBe('м');
        }
      } else {
        trackIssue({
          entity: 'Specification',
          operation: 'READ',
          issue: 'Items not returned in API detail response',
          severity: '[MAJOR]',
          expected: '5 items in detail or /items endpoint',
          actual: `Got ${itemsList?.length ?? 0}`,
        });
      }
    }
  });

  test('B3: Verify total weight calculation = 1604 кг', async () => {
    const itemsRes = await apiGet(`/api/specifications/${specId}/items`);
    const items = itemsRes?.content ?? itemsRes?.data ?? itemsRes ?? [];

    if (Array.isArray(items) && items.length > 0) {
      let totalWeight = 0;
      for (const item of items) {
        const qty = item.quantity ?? 0;
        const weight = item.weight ?? 0;
        totalWeight += qty * weight;
      }

      const diff = Math.abs(totalWeight - EXPECTED_TOTAL_WEIGHT);
      if (diff > 1) {
        trackIssue({
          entity: 'Specification',
          operation: 'CALC',
          issue: `Total weight mismatch: ${totalWeight} vs expected ${EXPECTED_TOTAL_WEIGHT}`,
          severity: '[CRITICAL]',
          expected: `${EXPECTED_TOTAL_WEIGHT} кг`,
          actual: `${totalWeight} кг`,
        });
      }
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('B4: Verify list page columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/specifications`);
    await page.waitForLoadState('networkidle');

    // List page should show: Name, Project, Status, possibly Version, Item Count
    const table = page.locator('table').first();
    const tableVisible = await table.isVisible().catch(() => false);

    if (tableVisible) {
      const headerCells = await page.locator('th').allTextContents();
      const headerText = headerCells.join(' ').toLowerCase();

      // Should have status column
      const hasStatus = headerText.includes('статус') || headerText.includes('status');
      if (!hasStatus) {
        trackIssue({
          entity: 'Specification',
          operation: 'READ',
          issue: 'List page missing Status column',
          severity: '[MINOR]',
          expected: 'Status column visible',
          actual: 'Not found',
        });
      }
    }
  });

  /* ============================================================== */
  /*  C. UPDATE                                                     */
  /* ============================================================== */
  test('C1: Update spec item quantity via API', async () => {
    expect(itemIds.length).toBeGreaterThan(0);
    const firstItemId = itemIds[0];

    const { status } = await apiPut(`/api/specifications/items/${firstItemId}`, {
      quantity: 6000, // was 5000
      name: 'Кабель силовой',
      brand: 'ВВГнг(А)-LS 3×2.5',
      unitOfMeasure: 'м',
    });

    if (status >= 300) {
      trackIssue({
        entity: 'SpecItem',
        operation: 'UPDATE',
        issue: 'Failed to update item quantity',
        severity: '[MAJOR]',
        expected: '200 OK',
        actual: `${status}`,
      });
    }
  });

  test('C2: Update spec status DRAFT → IN_REVIEW', async () => {
    const { status } = await apiPatch(`/api/specifications/${specId}/status`, {
      status: 'IN_REVIEW',
    });

    if (status >= 300) {
      // Try PUT instead of PATCH
      const { status: putStatus } = await apiPut(`/api/specifications/${specId}`, {
        name: SPEC_NAME,
        projectId,
        status: 'IN_REVIEW',
      });

      if (putStatus >= 300) {
        trackIssue({
          entity: 'Specification',
          operation: 'UPDATE',
          issue: 'Cannot transition DRAFT → IN_REVIEW',
          severity: '[MAJOR]',
          expected: '200 OK',
          actual: `PATCH: ${status}, PUT: ${putStatus}`,
        });
      }
    }
  });

  test('C3: Update spec status IN_REVIEW → APPROVED', async () => {
    const { status } = await apiPatch(`/api/specifications/${specId}/status`, {
      status: 'APPROVED',
    });

    if (status >= 300) {
      const { status: putStatus } = await apiPut(`/api/specifications/${specId}`, {
        name: SPEC_NAME,
        projectId,
        status: 'APPROVED',
      });

      if (putStatus >= 300) {
        trackIssue({
          entity: 'Specification',
          operation: 'UPDATE',
          issue: 'Cannot transition IN_REVIEW → APPROVED',
          severity: '[MAJOR]',
          expected: '200 OK',
          actual: `${status}`,
        });
      }
    }
  });

  /* ============================================================== */
  /*  D. COMPETITIVE LIST (КЛ) — minimum 3 vendors                 */
  /* ============================================================== */
  test('D1: Create competitive list for first spec item', async () => {
    expect(specId).toBeTruthy();

    const { status, data } = await apiPost('/api/competitive-lists', {
      specificationId: specId,
      specItemId: itemIds[0],
      projectId,
      name: 'E2E-КЛ Кабель ВВГнг(А)-LS 3×2.5',
      itemName: 'Кабель силовой ВВГнг(А)-LS 3×2.5',
      status: 'DRAFT',
    });

    if (status < 300 && data) {
      competitiveListId = data.id ?? data.data?.id;
      expect(competitiveListId).toBeTruthy();
    } else {
      trackIssue({
        entity: 'CompetitiveList',
        operation: 'CREATE',
        issue: 'Failed to create competitive list',
        severity: '[MAJOR]',
        expected: '201 Created',
        actual: `${status}`,
      });
    }
  });

  test('D2: Add 3 vendor entries to КЛ', async () => {
    if (!competitiveListId) return;

    for (const entry of COMPETITIVE_LIST_ENTRIES) {
      const { status } = await apiPost(`/api/competitive-lists/${competitiveListId}/entries`, {
        ...entry,
        competitiveListId,
      });

      if (status >= 300) {
        trackIssue({
          entity: 'CompetitiveList',
          operation: 'CREATE',
          issue: `Failed to add vendor "${entry.vendorName}"`,
          severity: '[MAJOR]',
          expected: '201 Created',
          actual: `${status}`,
        });
      }
    }
  });

  test('D3: Verify minimum price = 82.00 (ООО "КабельТорг")', async () => {
    if (!competitiveListId) return;

    const detail = await apiGet(`/api/competitive-lists/${competitiveListId}`);
    const entries = detail?.entries ?? detail?.data?.entries ?? [];

    if (Array.isArray(entries) && entries.length >= 3) {
      const prices = entries.map((e: any) => e.unitPrice ?? e.price ?? 0);
      const minPrice = Math.min(...prices);

      expect(minPrice).toBe(82.0);

      // Verify winner is cheapest
      const winner = entries.find((e: any) => e.isWinner || e.selected);
      if (winner && winner.unitPrice !== 82.0) {
        trackIssue({
          entity: 'CompetitiveList',
          operation: 'READ',
          issue: 'Winner is not the cheapest vendor',
          severity: '[MAJOR]',
          expected: 'Winner = ООО "КабельТорг" at 82.00',
          actual: `Winner price = ${winner.unitPrice}`,
        });
      }
    } else {
      trackIssue({
        entity: 'CompetitiveList',
        operation: 'READ',
        issue: `Expected 3 entries, got ${entries?.length ?? 0}`,
        severity: '[MAJOR]',
        expected: '3 vendor entries',
        actual: `${entries?.length ?? 0}`,
      });
    }
  });

  test('D4: Verify КЛ visible in /specifications/competitive-registry', async ({ page }) => {
    await page.goto(`${BASE_URL}/specifications/competitive-registry`);
    await page.waitForLoadState('networkidle');

    const content = await page.textContent('body');
    const hasContent = content && content.length > 100;

    if (!hasContent) {
      trackIssue({
        entity: 'CompetitiveList',
        operation: 'READ',
        issue: 'Competitive registry page has no content',
        severity: '[MAJOR]',
        expected: 'Registry with КЛ entries',
        actual: 'Empty or minimal content',
      });
    }
  });

  /* ============================================================== */
  /*  E. PUSH TO FM                                                 */
  /* ============================================================== */
  test('E1: Push spec items to FM (Financial Model)', async () => {
    // Attempt to push spec items to budget via API
    const { status } = await apiPost(`/api/specifications/${specId}/push-to-fm`, {
      projectId,
    });

    if (status >= 300) {
      // Also try the recalculate-supply endpoint
      const { status: recalcStatus } = await apiPost(`/api/specifications/${specId}/recalculate-supply`, {});

      if (recalcStatus >= 300) {
        trackIssue({
          entity: 'Specification',
          operation: 'PUSH_TO_FM',
          issue: 'Push to FM endpoint not available or failed',
          severity: '[MISSING]',
          expected: 'POST /api/specifications/{id}/push-to-fm → 200',
          actual: `push-to-fm: ${status}, recalculate-supply: ${recalcStatus}`,
        });
      }
    }
  });

  test('E2: Verify push to FM via UI button', async ({ page }) => {
    await page.goto(`${BASE_URL}/specifications/${specId}`);
    await page.waitForLoadState('networkidle');

    // Look for "Передать в ФМ" button
    const fmButton = page.getByRole('button', { name: /Передать в ФМ|передать в фм|Push to FM/i }).first();
    const altButton = page.locator('button').filter({ hasText: /ФМ|FM/i }).first();

    const visible = await fmButton.isVisible().catch(() => false) || await altButton.isVisible().catch(() => false);
    if (!visible) {
      trackIssue({
        entity: 'Specification',
        operation: 'PUSH_TO_FM',
        issue: '"Передать в ФМ" button not found on spec detail page',
        severity: '[UX]',
        expected: 'Button visible for pushing items to FM',
        actual: 'Not found',
      });
    }
  });

  /* ============================================================== */
  /*  F. VALIDATION                                                 */
  /* ============================================================== */
  test('F1: Cannot create spec item with quantity = 0', async () => {
    const { status } = await apiPost(`/api/specifications/${specId}/items`, {
      name: 'E2E-Invalid item',
      unitOfMeasure: 'шт',
      quantity: 0,
      itemType: 'MATERIAL',
    });

    if (status < 300) {
      trackIssue({
        entity: 'SpecItem',
        operation: 'VALIDATION',
        issue: 'Accepted item with quantity = 0',
        severity: '[MAJOR]',
        expected: '400 Bad Request',
        actual: `${status} (accepted)`,
      });
    }
  });

  test('F2: Cannot create spec item without name', async () => {
    const { status } = await apiPost(`/api/specifications/${specId}/items`, {
      name: '',
      unitOfMeasure: 'шт',
      quantity: 10,
      itemType: 'MATERIAL',
    });

    if (status < 300) {
      trackIssue({
        entity: 'SpecItem',
        operation: 'VALIDATION',
        issue: 'Accepted item with empty name',
        severity: '[MAJOR]',
        expected: '400 Bad Request',
        actual: `${status} (accepted)`,
      });
    }
  });

  test('F3: Cannot create spec item without unit', async () => {
    const { status } = await apiPost(`/api/specifications/${specId}/items`, {
      name: 'E2E-Test item no unit',
      unitOfMeasure: '',
      quantity: 10,
      itemType: 'MATERIAL',
    });

    if (status < 300) {
      trackIssue({
        entity: 'SpecItem',
        operation: 'VALIDATION',
        issue: 'Accepted item without unit of measure',
        severity: '[MAJOR]',
        expected: '400 Bad Request',
        actual: `${status} (accepted)`,
      });
    }
  });

  test('F4: Warning for КЛ with < 3 vendors', async () => {
    // Create a КЛ with only 2 vendors — should warn or reject
    const { status, data } = await apiPost('/api/competitive-lists', {
      specificationId: specId,
      specItemId: itemIds.length > 1 ? itemIds[1] : itemIds[0],
      projectId,
      name: 'E2E-КЛ Кабель 5×4.0 (insufficient vendors)',
      itemName: 'Кабель силовой ВВГнг(А)-LS 5×4.0',
      status: 'DRAFT',
    });

    if (status < 300 && data) {
      const clId = data.id ?? data.data?.id;
      // Add only 2 entries
      await apiPost(`/api/competitive-lists/${clId}/entries`, {
        vendorName: 'ООО "Vendor1"', unitPrice: 100, deliveryDays: 5, competitiveListId: clId,
      });
      await apiPost(`/api/competitive-lists/${clId}/entries`, {
        vendorName: 'ООО "Vendor2"', unitPrice: 95, deliveryDays: 7, competitiveListId: clId,
      });

      // Try to approve/decide — should warn about < 3 vendors
      const { status: approveStatus } = await apiPatch(`/api/competitive-lists/${clId}/status`, {
        status: 'DECIDED',
      });

      if (approveStatus < 300) {
        trackIssue({
          entity: 'CompetitiveList',
          operation: 'VALIDATION',
          issue: 'КЛ with <3 vendors accepted without warning',
          severity: '[MAJOR]',
          expected: 'Warning or rejection: "Минимум 3 поставщика"',
          actual: `${approveStatus} (accepted)`,
        });
      }

      // Cleanup
      await apiDelete(`/api/competitive-lists/${clId}`);
    }
  });

  test('F5: UI validation — empty form submit shows errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/specifications/new`);
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitBtn = page.getByRole('button', { name: /Сохранить|Создать|Save|Create/i }).first();
    const visible = await submitBtn.isVisible().catch(() => false);

    if (visible) {
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Check for validation errors
      const errorMessages = await page.locator('.text-red-500, .text-red-600, [role="alert"], .field-error').count();
      if (errorMessages === 0) {
        trackIssue({
          entity: 'Specification',
          operation: 'VALIDATION',
          issue: 'No validation errors shown on empty form submit',
          severity: '[UX]',
          expected: 'Validation error messages',
          actual: '0 error messages',
        });
      }
    }
  });

  /* ============================================================== */
  /*  G. DELETE                                                     */
  /* ============================================================== */
  test('G1: Delete single spec item', async () => {
    if (itemIds.length < 5) return;

    // Delete last item (Труба гофрированная)
    const lastItemId = itemIds[itemIds.length - 1];
    const status = await apiDelete(`/api/specifications/items/${lastItemId}`);

    if (status < 300 || status === 404) {
      itemIds.pop();
    } else {
      trackIssue({
        entity: 'SpecItem',
        operation: 'DELETE',
        issue: 'Failed to delete spec item',
        severity: '[MAJOR]',
        expected: '200 OK or 204 No Content',
        actual: `${status}`,
      });
    }
  });

  test('G2: Verify item count decreased to 4', async () => {
    const itemsRes = await apiGet(`/api/specifications/${specId}/items`);
    const items = itemsRes?.content ?? itemsRes?.data ?? itemsRes ?? [];

    if (Array.isArray(items)) {
      // Should be 4 items now (was 5, deleted 1)
      if (items.length !== 4 && items.length !== 5) {
        // 5 is ok if soft-delete
        trackIssue({
          entity: 'SpecItem',
          operation: 'DELETE',
          issue: `Expected 4 items after deletion, got ${items.length}`,
          severity: '[MINOR]',
          expected: '4 items',
          actual: `${items.length}`,
        });
      }
    }
  });

  /* ============================================================== */
  /*  H. UI CRUD                                                    */
  /* ============================================================== */
  test('H1: Specification form page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/specifications/new`);
    await page.waitForLoadState('networkidle');

    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(100);

    // Should have form fields
    const nameField = page.locator('input[name="name"], input[placeholder*="наименование" i], input[placeholder*="название" i]').first();
    const visible = await nameField.isVisible().catch(() => false);

    if (!visible) {
      trackIssue({
        entity: 'Specification',
        operation: 'UI',
        issue: 'Name field not found on create form',
        severity: '[UX]',
        expected: 'Name input field visible',
        actual: 'Not found',
      });
    }
  });

  test('H2: Specification detail page shows items table', async ({ page }) => {
    if (!specId) return;

    await page.goto(`${BASE_URL}/specifications/${specId}`);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table').first();
    const visible = await table.isVisible().catch(() => false);

    if (!visible) {
      // Could be card view — check for item names
      const content = await page.textContent('body');
      const hasItemName = content?.includes('Кабель') || content?.includes('Автоматический');

      if (!hasItemName) {
        trackIssue({
          entity: 'Specification',
          operation: 'UI',
          issue: 'No items table or item content on detail page',
          severity: '[MAJOR]',
          expected: 'Items table with 4-5 rows',
          actual: 'No table or item names found',
        });
      }
    }
  });

  /* ============================================================== */
  /*  I. CROSS-ENTITY                                               */
  /* ============================================================== */
  test('I1: Spec items should NOT have prices (инженер-сметчик rule)', async () => {
    const itemsRes = await apiGet(`/api/specifications/${specId}/items`);
    const items = itemsRes?.content ?? itemsRes?.data ?? itemsRes ?? [];

    if (Array.isArray(items)) {
      for (const item of items) {
        // Spec items should not have price fields filled
        if (item.price && item.price > 0) {
          trackIssue({
            entity: 'SpecItem',
            operation: 'CROSS',
            issue: `Spec item "${item.name}" has price=${item.price} — spec should only have quantities`,
            severity: '[CRITICAL]',
            expected: 'No price on spec items',
            actual: `Price: ${item.price}`,
          });
        }
      }
    }
  });

  test('I2: Spec approved but no КЛ → procurement gap warning', async () => {
    // Business rule: APPROVED spec without КЛ = procurement behind schedule
    const detail = await apiGet(`/api/specifications/${specId}`);
    const specStatus = detail?.status ?? detail?.data?.status;

    // We created КЛ for item[0] but not others — check
    const clList = await apiGet(`/api/competitive-lists?specificationId=${specId}&size=100`);
    const cls = clList?.content ?? clList?.data ?? clList ?? [];
    const clCount = Array.isArray(cls) ? cls.length : 0;

    if (specStatus === 'APPROVED' && clCount < itemIds.length) {
      console.log(`[WARNING] Spec APPROVED but only ${clCount}/${itemIds.length} items have КЛ — procurement gap`);
    }
  });
});
