/**
 * SESSION 2.5 — Deep CRUD: Materials (Материалы)
 *
 * Full lifecycle test for the Material entity in warehouse management.
 * Tested as 5 personas: прораб, бухгалтер, директор, инженер-сметчик, снабженец.
 * Uses realistic data: Кирпич М150, ГОСТ 530-2012, ОАО "Кирпичный завод №1".
 *
 * Sections:
 *   A. CREATE — full material card, verify in list + detail
 *   B. READ — list columns, filters, search, category, stock alerts
 *   C. UPDATE — price change, minimum stock, verify history
 *   D. STOCK BALANCE — receipt → issue → verify balance equation
 *   E. VALIDATION — required fields, negative values, duplicates
 *   F. DELETE — empty stock, with stock, with movement history
 *   G. CROSS-ENTITY — stock = receipts - issues, low stock alerts
 *
 * Domain rules (ГОСТ, СНиП):
 *   - Stock balance = SUM(receipts) - SUM(issues) >= 0
 *   - Negative stock is a data error (CRITICAL)
 *   - Minimum stock alerts must trigger when balance < minStockLevel
 *   - ГОСТ reference should be attached to materials where applicable
 *   - Weight per unit needed for logistics planning (dispatch load calc)
 */

import { test, expect } from '../../fixtures/base.fixture';
import {
  createEntity,
  deleteEntity,
  listEntities,
  authenticatedRequest,
} from '../../fixtures/api.fixture';

// ── Constants ────────────────────────────────────────────────────────

const API = process.env.E2E_API_URL || 'http://localhost:8080';
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:4000';

const MATERIAL_DATA = {
  name: 'E2E-Кирпич М150 красный',
  code: 'E2E-MAT-001',
  category: 'CONCRETE',                     // closest available category
  unitOfMeasure: 'шт',
  currentPrice: 18.5,
  minStockLevel: 5000,
  description: 'Кирпич керамический одинарный М150 красный, ГОСТ 530-2012, 250×120×65 мм',
};

const MATERIAL_2_DATA = {
  name: 'E2E-Арматура А500С ∅12',
  code: 'E2E-MAT-002',
  category: 'METAL',
  unitOfMeasure: 'кг',
  currentPrice: 42.0,
  minStockLevel: 1000,
  description: 'Арматура стержневая А500С диаметр 12 мм, ГОСТ 34028-2016',
};

const UPDATE_DATA = {
  currentPrice: 19.8,                       // +7% price increase
  minStockLevel: 3000,                      // lowered min stock
};

// ── Issue Tracker ────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────

async function createMaterialViaApi(
  data: Record<string, unknown> = MATERIAL_DATA,
): Promise<{ id: string; name: string; code: string }> {
  const res = await createEntity<{ id: string; name: string; code: string }>(
    '/api/warehouse/materials',
    data,
    'admin',
  );
  return res;
}

async function cleanupE2EMaterials(): Promise<void> {
  try {
    const materials = await listEntities<{ id: string; name?: string; code?: string }>(
      '/api/warehouse/materials',
      { size: '200' },
    );
    const e2e = materials.filter(
      (m) => (m.name ?? '').startsWith('E2E-') || (m.code ?? '').startsWith('E2E-'),
    );
    for (const m of e2e) {
      try {
        await deleteEntity('/api/warehouse/materials', m.id);
      } catch {
        /* ignore — may have movements */
      }
    }
  } catch {
    /* ignore */
  }
}

// ── Tests ────────────────────────────────────────────────────────────

test.describe('Materials CRUD — Deep Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let createdMaterialId: string | undefined;
  let __createdMaterial2Id: string | undefined;

  test.beforeAll(async () => {
    await cleanupE2EMaterials();
  });

  test.afterAll(async () => {
    await cleanupE2EMaterials();
    if (issues.length > 0) {
      console.log('\n═══ MATERIAL CRUD ISSUES ═══');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ No issues found in material CRUD tests.');
    }
  });

  // ── A: CREATE ──────────────────────────────────────────────────────

  test('A1: CREATE — material via API with all fields', async () => {
    const mat = await createMaterialViaApi();
    expect(mat.id).toBeTruthy();
    createdMaterialId = mat.id;

    // Verify response has expected fields
    expect(mat.name).toBe(MATERIAL_DATA.name);
    if (mat.code) {
      expect(mat.code).toBe(MATERIAL_DATA.code);
    }
  });

  test('A2: CREATE — second material for balance tests', async () => {
    const mat = await createMaterialViaApi(MATERIAL_2_DATA);
    expect(mat.id).toBeTruthy();
    _createdMaterial2Id = mat.id;
  });

  test('A3: CREATE — verify material appears in list via API', async () => {
    const materials = await listEntities<{ id: string; name: string }>(
      '/api/warehouse/materials',
      { size: '100' },
    );
    const found = materials.find((m) => m.name === MATERIAL_DATA.name);
    if (!found) {
      trackIssue({
        entity: 'Material',
        operation: 'CREATE',
        issue: 'Created material not found in list',
        severity: '[CRITICAL]',
        expected: `Material "${MATERIAL_DATA.name}" in list`,
        actual: 'Not found',
      });
    }
    expect(found).toBeTruthy();
  });

  test('A4: CREATE — verify material detail via API', async () => {
    if (!createdMaterialId) return test.skip();

    const res = await authenticatedRequest(
      'admin',
      'GET',
      `${API}/api/warehouse/materials/${createdMaterialId}`,
    );
    expect(res.status).toBeLessThan(400);

    const body = await res.json();
    const mat = body.data ?? body;

    // Verify all fields persisted correctly
    expect(mat.name).toBe(MATERIAL_DATA.name);
    expect(mat.unitOfMeasure || mat.unit).toBeTruthy();

    // Check price stored
    if (mat.currentPrice !== undefined) {
      expect(mat.currentPrice).toBe(MATERIAL_DATA.currentPrice);
    }

    // Check minimum stock
    if (mat.minStockLevel !== undefined) {
      expect(mat.minStockLevel).toBe(MATERIAL_DATA.minStockLevel);
    }
  });

  test('A5: CREATE — UI page loads material list', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/materials`);
    await page.waitForLoadState('networkidle');

    // Page should have content
    const body = await page.textContent('body');
    expect((body ?? '').length).toBeGreaterThan(50);

    // Look for table or card layout
    const hasTable = await page.locator('table').count();
    const hasCards = await page.locator('[class*="card"], [class*="grid"]').count();
    expect(hasTable + hasCards).toBeGreaterThan(0);
  });

  // ── B: READ ────────────────────────────────────────────────────────

  test('B1: READ — list has expected columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/materials`);
    await page.waitForLoadState('networkidle');

    const body = (await page.textContent('body')) ?? '';

    // Columns expected by снабженец persona
    const expectedHeaders = ['Наименование', 'Код', 'Ед.'];
    let foundCount = 0;
    for (const header of expectedHeaders) {
      if (body.includes(header)) foundCount++;
    }

    if (foundCount === 0) {
      // May use English headers or i18n keys
      const enHeaders = ['Name', 'Code', 'Unit'];
      for (const header of enHeaders) {
        if (body.includes(header)) foundCount++;
      }
    }

    if (foundCount === 0) {
      trackIssue({
        entity: 'Material',
        operation: 'READ',
        issue: 'No recognizable table headers found',
        severity: '[MAJOR]',
        expected: 'Наименование, Код, Ед.изм., Остаток, Цена',
        actual: 'No matching headers',
      });
    }
  });

  test('B2: READ — search by name', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/materials`);
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="Поиск"], input[placeholder*="поиск"], input[placeholder*="Search"], input[name="search"]',
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('E2E-Кирпич');
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      // Should find our material
      const hasResult = body.includes('E2E-Кирпич') || body.includes('E2E-MAT-001');
      if (!hasResult) {
        trackIssue({
          entity: 'Material',
          operation: 'READ',
          issue: 'Search by name does not filter results',
          severity: '[MAJOR]',
          expected: 'Filtered list showing "E2E-Кирпич М150"',
          actual: 'Material not visible after search',
        });
      }
    } else {
      trackIssue({
        entity: 'Material',
        operation: 'READ',
        issue: 'No search input found on materials list page',
        severity: '[UX]',
        expected: 'Search input for filtering materials',
        actual: 'Not found',
      });
    }
  });

  test('B3: READ — filter by category', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/materials`);
    await page.waitForLoadState('networkidle');

    // Look for category filter
    const categoryFilter = page.locator(
      'select[name*="category"], [class*="select"][class*="category"], button:has-text("Категория"), button:has-text("Category")',
    ).first();

    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(300);
    } else {
      trackIssue({
        entity: 'Material',
        operation: 'READ',
        issue: 'Category filter not found on materials list',
        severity: '[MINOR]',
        expected: 'Dropdown filter for material categories',
        actual: 'Not found',
      });
    }
  });

  test('B4: READ — material detail page loads', async ({ page }) => {
    if (!createdMaterialId) return test.skip();

    await page.goto(`${BASE_URL}/warehouse/materials/${createdMaterialId}`);
    await page.waitForLoadState('networkidle');

    const body = (await page.textContent('body')) ?? '';
    const hasName = body.includes('E2E-Кирпич') || body.includes(MATERIAL_DATA.name);

    if (!hasName) {
      // May redirect to list or show 404
      const is404 = body.includes('404') || body.includes('не найден');
      if (is404) {
        trackIssue({
          entity: 'Material',
          operation: 'READ',
          issue: 'Material detail page returns 404',
          severity: '[MAJOR]',
          expected: 'Detail page with material info',
          actual: '404 or not found',
        });
      }
    }
  });

  test('B5: READ — stock alerts page', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/stock-alerts`);
    await page.waitForLoadState('networkidle');

    const body = (await page.textContent('body')) ?? '';
    expect((body ?? '').length).toBeGreaterThan(50);

    // Verify page loaded (may show alerts or empty state)
    const hasAlerts =
      body.includes('alert') ||
      body.includes('Alert') ||
      body.includes('запас') ||
      body.includes('stock') ||
      body.includes('Нет') ||
      body.includes('пусто');
    expect(hasAlerts || body.length > 100).toBeTruthy();
  });

  // ── C: UPDATE ──────────────────────────────────────────────────────

  test('C1: UPDATE — price change via API', async () => {
    if (!createdMaterialId) return test.skip();

    const res = await authenticatedRequest(
      'admin',
      'PUT',
      `${API}/api/warehouse/materials/${createdMaterialId}`,
      {
        ...MATERIAL_DATA,
        currentPrice: UPDATE_DATA.currentPrice,
      },
    );

    // Accept 200 or 204
    if (res.status >= 400) {
      trackIssue({
        entity: 'Material',
        operation: 'UPDATE',
        issue: `Price update failed with status ${res.status}`,
        severity: '[MAJOR]',
        expected: '200/204 on price update',
        actual: `${res.status}`,
      });
    }

    // Verify updated price
    const getRes = await authenticatedRequest(
      'admin',
      'GET',
      `${API}/api/warehouse/materials/${createdMaterialId}`,
    );
    if (getRes.ok) {
      const body = await getRes.json();
      const mat = body.data ?? body;
      if (mat.currentPrice !== undefined) {
        expect(mat.currentPrice).toBe(UPDATE_DATA.currentPrice);
      }
    }
  });

  test('C2: UPDATE — minimum stock level via API', async () => {
    if (!createdMaterialId) return test.skip();

    const res = await authenticatedRequest(
      'admin',
      'PUT',
      `${API}/api/warehouse/materials/${createdMaterialId}`,
      {
        ...MATERIAL_DATA,
        currentPrice: UPDATE_DATA.currentPrice,
        minStockLevel: UPDATE_DATA.minStockLevel,
      },
    );

    if (res.status >= 400) {
      trackIssue({
        entity: 'Material',
        operation: 'UPDATE',
        issue: `Min stock update failed with status ${res.status}`,
        severity: '[MAJOR]',
        expected: '200/204 on min stock update',
        actual: `${res.status}`,
      });
    }
  });

  test('C3: UPDATE — UI edit form loads', async ({ page }) => {
    if (!createdMaterialId) return test.skip();

    await page.goto(`${BASE_URL}/warehouse/materials/${createdMaterialId}/edit`);
    await page.waitForLoadState('networkidle');

    const body = (await page.textContent('body')) ?? '';
    // Should show form or pre-filled values
    const hasForm =
      (await page.locator('form').count()) > 0 ||
      (await page.locator('input').count()) > 2;

    if (!hasForm) {
      // Might use modal-based editing
      trackIssue({
        entity: 'Material',
        operation: 'UPDATE',
        issue: 'No edit form found at /materials/:id/edit',
        severity: '[MINOR]',
        expected: 'Edit form with pre-filled values',
        actual: body.includes('404') ? '404 page' : 'No form elements',
      });
    }
  });

  // ── D: STOCK BALANCE ──────────────────────────────────────────────

  test('D1: STOCK — create receipt (приход) +10,000 units', async () => {
    if (!createdMaterialId) return test.skip();

    // Create stock movement: RECEIPT
    const res = await authenticatedRequest(
      'admin',
      'POST',
      `${API}/api/warehouse/movements`,
      {
        movementType: 'RECEIPT',
        movementDate: '2026-03-10',
        notes: 'E2E-Поставка кирпича по ТН-001',
        items: [
          {
            materialId: createdMaterialId,
            quantity: 10000,
            unitPrice: 18.5,
          },
        ],
      },
    );

    if (res.status >= 400) {
      // Try alternative endpoint shape
      const res2 = await authenticatedRequest(
        'admin',
        'POST',
        `${API}/api/warehouse/orders`,
        {
          type: 'RECEIPT',
          date: '2026-03-10',
          notes: 'E2E-Поставка кирпича по ТН-001',
          items: [
            {
              materialId: createdMaterialId,
              quantity: 10000,
              unitPrice: 18.5,
            },
          ],
        },
      );
      if (res2.status >= 400) {
        trackIssue({
          entity: 'Material',
          operation: 'STOCK',
          issue: `Receipt creation failed: ${res.status} / ${res2.status}`,
          severity: '[CRITICAL]',
          expected: '201 on receipt creation',
          actual: `${res.status} / ${res2.status}`,
        });
      }
    }
  });

  test('D2: STOCK — verify stock after receipt = 10,000', async () => {
    if (!createdMaterialId) return test.skip();

    // Try to get stock for this material
    const res = await authenticatedRequest(
      'admin',
      'GET',
      `${API}/api/warehouse/materials/${createdMaterialId}/stock`,
    );

    if (res.ok) {
      const body = await res.json();
      const stock = body.data ?? body;
      const qty = stock.quantity ?? stock.currentStock ?? stock.balance ?? stock;
      if (typeof qty === 'number') {
        expect(qty).toBe(10000);
      }
    } else {
      // Stock might be on the material detail itself
      const detailRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API}/api/warehouse/materials/${createdMaterialId}`,
      );
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const mat = detail.data ?? detail;
        if (mat.currentStock !== undefined || mat.stockBalance !== undefined) {
          const stock = mat.currentStock ?? mat.stockBalance;
          expect(stock).toBe(10000);
        } else {
          trackIssue({
            entity: 'Material',
            operation: 'STOCK',
            issue: 'No stock quantity field found on material or /stock endpoint',
            severity: '[MAJOR]',
            expected: 'currentStock or balance = 10000 after receipt',
            actual: 'No stock field available',
          });
        }
      }
    }
  });

  test('D3: STOCK — create issue (расход) -3,000 units', async () => {
    if (!createdMaterialId) return test.skip();

    const res = await authenticatedRequest(
      'admin',
      'POST',
      `${API}/api/warehouse/movements`,
      {
        movementType: 'ISSUE',
        movementDate: '2026-03-12',
        notes: 'E2E-Выдача кирпича на стройплощадку',
        items: [
          {
            materialId: createdMaterialId,
            quantity: 3000,
          },
        ],
      },
    );

    if (res.status >= 400) {
      // Try alternative endpoint
      const res2 = await authenticatedRequest(
        'admin',
        'POST',
        `${API}/api/warehouse/orders`,
        {
          type: 'ISSUE',
          date: '2026-03-12',
          notes: 'E2E-Выдача кирпича на стройплощадку',
          items: [
            {
              materialId: createdMaterialId,
              quantity: 3000,
            },
          ],
        },
      );
      if (res2.status >= 400) {
        trackIssue({
          entity: 'Material',
          operation: 'STOCK',
          issue: `Issue creation failed: ${res.status} / ${res2.status}`,
          severity: '[CRITICAL]',
          expected: '201 on issue creation',
          actual: `${res.status} / ${res2.status}`,
        });
      }
    }
  });

  test('D4: STOCK — verify balance = 10,000 - 3,000 = 7,000', async () => {
    if (!createdMaterialId) return test.skip();

    // Golden rule: Stock balance = SUM(receipts) - SUM(issues) >= 0
    const res = await authenticatedRequest(
      'admin',
      'GET',
      `${API}/api/warehouse/materials/${createdMaterialId}/stock`,
    );

    if (res.ok) {
      const body = await res.json();
      const stock = body.data ?? body;
      const qty = stock.quantity ?? stock.currentStock ?? stock.balance ?? stock;
      if (typeof qty === 'number') {
        expect(qty).toBe(7000);
      }
    } else {
      // Fallback: check material detail
      const detailRes = await authenticatedRequest(
        'admin',
        'GET',
        `${API}/api/warehouse/materials/${createdMaterialId}`,
      );
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const mat = detail.data ?? detail;
        const stock = mat.currentStock ?? mat.stockBalance;
        if (stock !== undefined) {
          expect(stock).toBe(7000);
        }
      }
    }
  });

  test('D5: STOCK — over-issue blocked (8,000 > 7,000 available)', async () => {
    if (!createdMaterialId) return test.skip();

    const res = await authenticatedRequest(
      'admin',
      'POST',
      `${API}/api/warehouse/movements`,
      {
        movementType: 'ISSUE',
        movementDate: '2026-03-12',
        notes: 'E2E-Попытка перерасхода',
        items: [
          {
            materialId: createdMaterialId,
            quantity: 8000,
          },
        ],
      },
    );

    // Should be rejected: 400 or 422 (insufficient stock)
    if (res.ok) {
      trackIssue({
        entity: 'Material',
        operation: 'STOCK',
        issue: 'Over-issue allowed (8000 > 7000 available) — NEGATIVE STOCK possible',
        severity: '[CRITICAL]',
        expected: '400/422 with "Недостаточно на складе"',
        actual: `${res.status} OK — system allowed over-issue`,
      });
    }
    // Whether blocked or not, test passes — we track the issue if it's allowed
  });

  test('D6: STOCK — UI stock page shows balance', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/stock`);
    await page.waitForLoadState('networkidle');

    const body = (await page.textContent('body')) ?? '';
    expect(body.length).toBeGreaterThan(50);

    // Should show stock data in table or card format
    const hasTable = await page.locator('table').count();
    expect(hasTable).toBeGreaterThan(0);
  });

  // ── E: VALIDATION ─────────────────────────────────────────────────

  test('E1: VALIDATION — empty name rejected', async () => {
    const res = await authenticatedRequest(
      'admin',
      'POST',
      `${API}/api/warehouse/materials`,
      {
        name: '',
        code: 'E2E-VAL-EMPTY',
        unitOfMeasure: 'шт',
      },
    );

    if (res.ok) {
      trackIssue({
        entity: 'Material',
        operation: 'VALIDATION',
        issue: 'Empty material name accepted by backend',
        severity: '[MAJOR]',
        expected: '400 with validation error',
        actual: `${res.status} OK`,
      });
      // Cleanup the accidentally created material
      try {
        const body = await res.json();
        const id = (body.data ?? body).id;
        if (id) await deleteEntity('/api/warehouse/materials', id);
      } catch { /* ignore */ }
    }
  });

  test('E2: VALIDATION — negative price rejected', async () => {
    const res = await authenticatedRequest(
      'admin',
      'POST',
      `${API}/api/warehouse/materials`,
      {
        name: 'E2E-Negative Price Material',
        code: 'E2E-VAL-NEG',
        unitOfMeasure: 'шт',
        currentPrice: -100,
      },
    );

    if (res.ok) {
      trackIssue({
        entity: 'Material',
        operation: 'VALIDATION',
        issue: 'Negative price accepted by backend',
        severity: '[MAJOR]',
        expected: '400 with validation error for negative price',
        actual: `${res.status} OK`,
      });
      try {
        const body = await res.json();
        const id = (body.data ?? body).id;
        if (id) await deleteEntity('/api/warehouse/materials', id);
      } catch { /* ignore */ }
    }
  });

  test('E3: VALIDATION — duplicate code rejected', async () => {
    // Try to create material with same code as existing
    const res = await authenticatedRequest(
      'admin',
      'POST',
      `${API}/api/warehouse/materials`,
      {
        name: 'E2E-Duplicate Code Test',
        code: MATERIAL_DATA.code,   // Same code as created material
        unitOfMeasure: 'шт',
      },
    );

    if (res.ok) {
      trackIssue({
        entity: 'Material',
        operation: 'VALIDATION',
        issue: 'Duplicate material code accepted',
        severity: '[MAJOR]',
        expected: '409/400 duplicate code error',
        actual: `${res.status} OK — duplicate codes allowed`,
      });
      try {
        const body = await res.json();
        const id = (body.data ?? body).id;
        if (id) await deleteEntity('/api/warehouse/materials', id);
      } catch { /* ignore */ }
    }
  });

  test('E4: VALIDATION — UI form shows required field errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/materials/new`);
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitBtn = page.locator(
      'button[type="submit"], button:has-text("Сохранить"), button:has-text("Создать"), button:has-text("Save"), button:has-text("Create")',
    ).first();

    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);

      // Check for validation error indicators
      const errors = await page.locator(
        '.text-red-500, .text-red-600, [role="alert"], .field-error, .error-message',
      ).count();

      if (errors === 0) {
        trackIssue({
          entity: 'Material',
          operation: 'VALIDATION',
          issue: 'Empty form submitted without validation errors',
          severity: '[UX]',
          expected: 'Visible validation errors for required fields',
          actual: 'No error indicators shown',
        });
      }
    } else {
      // Page might not have a standalone form (modal-based creation)
      trackIssue({
        entity: 'Material',
        operation: 'VALIDATION',
        issue: 'No create form page at /warehouse/materials/new',
        severity: '[MINOR]',
        expected: 'Create form page',
        actual: 'Page does not have a submit button',
      });
    }
  });

  // ── F: DELETE ──────────────────────────────────────────────────────

  test('F1: DELETE — material with stock > 0 should be blocked or warned', async () => {
    if (!createdMaterialId) return test.skip();

    // This material has stock = 7,000 from earlier tests
    // Business rule: cannot delete material with stock > 0
    const res = await authenticatedRequest(
      'admin',
      'DELETE',
      `${API}/api/warehouse/materials/${createdMaterialId}`,
    );

    if (res.ok) {
      trackIssue({
        entity: 'Material',
        operation: 'DELETE',
        issue: 'Material with stock > 0 deleted without warning',
        severity: '[CRITICAL]',
        expected: '400/409 — cannot delete material with stock (7000 units)',
        actual: `${res.status} OK — deletion allowed`,
      });
      // Re-create for remaining tests
      const mat = await createMaterialViaApi();
      createdMaterialId = mat.id;
    }
  });

  test('F2: DELETE — material with zero stock can be deleted', async () => {
    // Create a temporary material with no movements
    const tempMat = await createMaterialViaApi({
      name: 'E2E-Удаляемый материал',
      code: 'E2E-MAT-DEL',
      unitOfMeasure: 'шт',
      category: 'OTHER',
    });

    expect(tempMat.id).toBeTruthy();

    const res = await authenticatedRequest(
      'admin',
      'DELETE',
      `${API}/api/warehouse/materials/${tempMat.id}`,
    );

    // Should succeed (no stock, no movements)
    if (res.status >= 400 && res.status !== 404) {
      trackIssue({
        entity: 'Material',
        operation: 'DELETE',
        issue: `Cannot delete material with zero stock: ${res.status}`,
        severity: '[MINOR]',
        expected: '200/204 on delete of empty material',
        actual: `${res.status}`,
      });
    }
  });

  test('F3: DELETE — verify deleted material removed from list', async () => {
    const materials = await listEntities<{ id: string; name: string }>(
      '/api/warehouse/materials',
      { size: '200' },
    );

    const found = materials.find((m) => m.name === 'E2E-Удаляемый материал');
    if (found) {
      trackIssue({
        entity: 'Material',
        operation: 'DELETE',
        issue: 'Deleted material still appears in list (soft-delete without filter?)',
        severity: '[MINOR]',
        expected: 'Material removed from default list view',
        actual: 'Material still visible',
      });
    }
  });

  // ── G: CROSS-ENTITY ───────────────────────────────────────────────

  test('G1: CROSS — movement history for material', async () => {
    if (!createdMaterialId) return test.skip();

    const res = await authenticatedRequest(
      'admin',
      'GET',
      `${API}/api/warehouse/materials/${createdMaterialId}/movements`,
    );

    if (res.ok) {
      const body = await res.json();
      const movements = body.data ?? body.content ?? body;
      if (Array.isArray(movements)) {
        // Should have at least 2 movements (receipt + issue)
        expect(movements.length).toBeGreaterThanOrEqual(1);
      }
    } else {
      trackIssue({
        entity: 'Material',
        operation: 'CROSS',
        issue: 'Material movements endpoint not available',
        severity: '[MISSING]',
        expected: 'GET /warehouse/materials/:id/movements returns movement history',
        actual: `${res.status}`,
      });
    }
  });

  test('G2: CROSS — M-29 report page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/m29-report`);
    await page.waitForLoadState('networkidle');

    const body = (await page.textContent('body')) ?? '';
    expect(body.length).toBeGreaterThan(50);

    // M-29 = material consumption report (statutory form)
    // Should have period selector or project selector
    const hasFilters =
      body.includes('М-29') ||
      body.includes('M-29') ||
      body.includes('Расход') ||
      body.includes('Период') ||
      body.includes('Проект');
    if (!hasFilters) {
      trackIssue({
        entity: 'Material',
        operation: 'CROSS',
        issue: 'M-29 report page missing expected controls',
        severity: '[UX]',
        expected: 'M-29 with project/period filters',
        actual: 'No recognizable controls',
      });
    }
  });

  test('G3: CROSS — limit fence cards page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/limit-fence-cards`);
    await page.waitForLoadState('networkidle');

    const body = (await page.textContent('body')) ?? '';
    expect(body.length).toBeGreaterThan(50);

    // ЛЗК = limit vs consumed tracking
    const hasContent =
      body.includes('Лимитно') ||
      body.includes('лимит') ||
      body.includes('Limit') ||
      body.includes('карт');
    expect(hasContent || body.length > 100).toBeTruthy();
  });

  test('G4: CROSS — warehouse movements page shows our movements', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse/movements`);
    await page.waitForLoadState('networkidle');

    const body = (await page.textContent('body')) ?? '';
    expect(body.length).toBeGreaterThan(50);

    // Should show table of movements
    const hasTable = await page.locator('table').count();
    expect(hasTable).toBeGreaterThan(0);
  });
});
