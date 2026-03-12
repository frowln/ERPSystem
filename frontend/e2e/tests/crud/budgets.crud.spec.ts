/**
 * Session 2.2 — Deep CRUD: Budgets (Бюджеты)
 *
 * Persona focus: Бухгалтер (totals must be exact), Директор (margin/utilization)
 * Domain rules: Budget total = SUM(items), НДС=20%, Освоение % = Факт/План×100
 *
 * API endpoints tested:
 *   POST   /api/budgets              — create budget
 *   GET    /api/budgets              — list budgets
 *   GET    /api/budgets/{id}         — get budget
 *   PUT    /api/budgets/{id}         — update budget
 *   POST   /api/budgets/{id}/items   — add item
 *   PUT    /api/budgets/{id}/items/{itemId} — update item
 *   DELETE /api/budgets/{id}/items/{itemId} — delete item
 *   POST   /api/budgets/{id}/approve — approve
 *   POST   /api/budgets/{id}/activate — activate
 *   POST   /api/budgets/{id}/freeze  — freeze
 *   POST   /api/budgets/{id}/close   — close
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

/* ------------------------------------------------------------------ */
/*  Test Data                                                          */
/* ------------------------------------------------------------------ */
const BUDGET_NAME = 'E2E-Бюджет ЖК Солнечный';

const ITEMS = [
  { category: 'MATERIALS', name: 'Бетон В25', plannedAmount: 3500000, unit: 'м³', quantity: 700, costPrice: 5000 },
  { category: 'MATERIALS', name: 'Арматура А500С', plannedAmount: 2800000, unit: 'т', quantity: 45, costPrice: 62222.22 },
  { category: 'WORKS', name: 'Монтаж каркаса', plannedAmount: 4200000, unit: 'компл', quantity: 1, costPrice: 4200000 },
  { category: 'WORKS', name: 'Электромонтаж', plannedAmount: 2500000, unit: 'компл', quantity: 1, costPrice: 2500000 },
  { category: 'OTHER', name: 'Транспорт', plannedAmount: 2000000, unit: 'усл', quantity: 1, costPrice: 2000000 },
];

const EXPECTED_TOTAL = 3_500_000 + 2_800_000 + 4_200_000 + 2_500_000 + 2_000_000; // 15,000,000
const EXPECTED_MATERIALS = 3_500_000 + 2_800_000; // 6,300,000
const EXPECTED_WORKS = 4_200_000 + 2_500_000; // 6,700,000
const EXPECTED_OTHER = 2_000_000;

/* ------------------------------------------------------------------ */
/*  State shared across serial tests                                   */
/* ------------------------------------------------------------------ */
let budgetId: string;
let projectId: string;
const itemIds: string[] = [];

test.describe('Budget CRUD — Deep Lifecycle (Бюджет)', () => {
  test.describe.configure({ mode: 'serial' });

  /* ============================================================== */
  /*  SETUP — ensure auth token + project                           */
  /* ============================================================== */
  test.beforeAll(async () => {
    await getToken();

    // Try to find or create E2E project
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
    // Delete budget items then budget
    if (budgetId) {
      for (const itemId of itemIds) {
        await fetch(`${API}/api/budgets/${budgetId}/items/${itemId}`, { method: 'DELETE', headers: headers() });
      }
      // No DELETE /budgets/{id} endpoint — leave for next cleanup
    }
    // Print issue summary
    if (issues.length > 0) {
      console.log('\n═══════════════════════════════════════');
      console.log('  BUDGET CRUD ISSUES');
      console.log('═══════════════════════════════════════');
      for (const i of issues) {
        console.log(`${i.severity} [${i.entity}/${i.operation}] ${i.issue}`);
        console.log(`  Expected: ${i.expected}`);
        console.log(`  Actual:   ${i.actual}`);
      }
    } else {
      console.log('\n✓ BUDGET CRUD: 0 issues found');
    }
  });

  /* ============================================================== */
  /*  A. CREATE                                                     */
  /* ============================================================== */

  test('A1: Create budget via API', async () => {
    const res = await fetch(`${API}/api/budgets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: BUDGET_NAME,
        projectId,
        plannedRevenue: 18_000_000,
        plannedCost: EXPECTED_TOTAL,
        plannedMargin: 3_000_000,
        notes: 'E2E deep CRUD budget test',
      }),
    });

    expect(res.status, 'Budget creation should succeed (2xx)').toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    const json = await res.json();
    budgetId = json.id ?? json.data?.id;
    expect(budgetId, 'Budget ID returned').toBeTruthy();

    // Verify response fields
    const budget = json.data ?? json;
    expect.soft(budget.name).toBe(BUDGET_NAME);
    expect.soft(budget.status).toMatch(/DRAFT/i);
    if (budget.plannedCost !== undefined) {
      expect.soft(Number(budget.plannedCost)).toBe(EXPECTED_TOTAL);
    }
  });

  test('A2: Add 5 budget items via API', async () => {
    for (const item of ITEMS) {
      const res = await fetch(`${API}/api/budgets/${budgetId}/items`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          category: item.category,
          name: item.name,
          plannedAmount: item.plannedAmount,
          unit: item.unit,
          quantity: item.quantity,
          costPrice: item.costPrice,
          itemType: item.category === 'WORKS' ? 'WORKS' : item.category === 'MATERIALS' ? 'MATERIALS' : 'OTHER',
        }),
      });
      expect(res.status, `Item "${item.name}" creation should succeed`).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
      const json = await res.json();
      const id = json.id ?? json.data?.id;
      if (id) itemIds.push(id);
    }
    expect(itemIds.length).toBe(5);
  });

  test('A3: Verify budget items total = 15,000,000', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}/items`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const items = json.content ?? json.data ?? json ?? [];
    const arr = Array.isArray(items) ? items : [];

    // Sum plannedAmount of all items
    const total = arr.reduce((s: number, it: any) => s + Number(it.plannedAmount ?? 0), 0);
    const diff = Math.abs(total - EXPECTED_TOTAL);
    expect.soft(diff, `Total planned = ${total}, expected = ${EXPECTED_TOTAL}`).toBeLessThanOrEqual(1);

    if (diff > 1) {
      trackIssue({
        entity: 'Budget',
        operation: 'CREATE',
        issue: 'Budget items total mismatch',
        severity: '[CRITICAL]',
        expected: String(EXPECTED_TOTAL),
        actual: String(total),
      });
    }

    // Category subtotals
    const materials = arr
      .filter((it: any) => it.category === 'MATERIALS')
      .reduce((s: number, it: any) => s + Number(it.plannedAmount ?? 0), 0);
    const works = arr
      .filter((it: any) => it.category === 'WORKS')
      .reduce((s: number, it: any) => s + Number(it.plannedAmount ?? 0), 0);
    const other = arr
      .filter((it: any) => it.category === 'OTHER')
      .reduce((s: number, it: any) => s + Number(it.plannedAmount ?? 0), 0);

    expect.soft(Math.abs(materials - EXPECTED_MATERIALS), `Materials = ${materials}`).toBeLessThanOrEqual(1);
    expect.soft(Math.abs(works - EXPECTED_WORKS), `Works = ${works}`).toBeLessThanOrEqual(1);
    expect.soft(Math.abs(other - EXPECTED_OTHER), `Other = ${other}`).toBeLessThanOrEqual(1);
  });

  /* ============================================================== */
  /*  B. READ                                                       */
  /* ============================================================== */

  test('B1: Budget appears in /budgets list (API)', async () => {
    const res = await fetch(`${API}/api/budgets?size=50`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const list = json.content ?? json.data ?? json ?? [];
    const found = Array.isArray(list) ? list.find((b: any) => b.id === budgetId || b.name === BUDGET_NAME) : null;
    expect(found, 'Budget should appear in list').toBeTruthy();
    if (found) {
      expect.soft(found.name).toBe(BUDGET_NAME);
      expect.soft(found.status).toMatch(/DRAFT/i);
    }
  });

  test('B2: Budget detail via API returns correct fields', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const budget = (await res.json()).data ?? (await res.json()) ?? {};
    // Re-fetch because json() consumed
    const res2 = await fetch(`${API}/api/budgets/${budgetId}`, { headers: headers() });
    const b = (await res2.json());
    const data = b.data ?? b;

    expect.soft(data.id ?? data.budgetId).toBeTruthy();
    expect.soft(data.name).toBe(BUDGET_NAME);
    if (data.projectId) {
      expect.soft(data.projectId).toBe(projectId);
    }
  });

  test('B3: Budget list page loads in UI', async ({ page }) => {
    await page.goto('http://localhost:4000/budgets', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Page should render (table or cards)
    const body = await page.textContent('body');
    expect.soft(body?.length, 'Page has content').toBeGreaterThan(50);

    // Look for our budget name
    const hasBudget = body?.includes(BUDGET_NAME) || body?.includes('E2E-Бюджет');
    if (!hasBudget) {
      trackIssue({
        entity: 'Budget',
        operation: 'READ',
        issue: 'E2E budget not visible in list UI',
        severity: '[MAJOR]',
        expected: BUDGET_NAME,
        actual: 'Not found in page content',
      });
    }

    await page.screenshot({ path: 'test-results/budget-list.png' });
  });

  test('B4: Budget detail page loads in UI', async ({ page }) => {
    if (!budgetId) return;
    await page.goto(`http://localhost:4000/budgets/${budgetId}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body');
    expect.soft(body?.length, 'Detail page has content').toBeGreaterThan(50);

    // Check for item names
    for (const item of ITEMS) {
      const found = body?.includes(item.name);
      if (!found) {
        trackIssue({
          entity: 'Budget',
          operation: 'READ',
          issue: `Item "${item.name}" not visible in budget detail UI`,
          severity: '[MINOR]',
          expected: item.name,
          actual: 'Not found',
        });
      }
    }

    await page.screenshot({ path: 'test-results/budget-detail.png' });
  });

  /* ============================================================== */
  /*  C. UPDATE                                                     */
  /* ============================================================== */

  test('C1: Update item "Бетон В25" plannedAmount → 4,000,000', async () => {
    const betonItemId = itemIds[0]; // First item = Бетон В25
    const res = await fetch(`${API}/api/budgets/${budgetId}/items/${betonItemId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        category: 'MATERIALS',
        name: 'Бетон В25',
        plannedAmount: 4_000_000,
        unit: 'м³',
        quantity: 800,
        costPrice: 5000,
        itemType: 'MATERIALS',
      }),
    });
    expect(res.status, 'Update should succeed').toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  test('C2: Add new item "Отделочные работы" = 1,500,000', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}/items`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        category: 'WORKS',
        name: 'Отделочные работы',
        plannedAmount: 1_500_000,
        unit: 'компл',
        quantity: 1,
        costPrice: 1_500_000,
        itemType: 'WORKS',
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    const json = await res.json();
    const id = json.id ?? json.data?.id;
    if (id) itemIds.push(id);
  });

  test('C3: Verify new total = 17,000,000 after update + add', async () => {
    // 4,000,000 + 2,800,000 + 4,200,000 + 2,500,000 + 2,000,000 + 1,500,000 = 17,000,000
    const expected = 17_000_000;
    const res = await fetch(`${API}/api/budgets/${budgetId}/items`, { headers: headers() });
    expect(res.ok).toBeTruthy();
    const json = await res.json();
    const items = json.content ?? json.data ?? json ?? [];
    const arr = Array.isArray(items) ? items : [];
    const total = arr.reduce((s: number, it: any) => s + Number(it.plannedAmount ?? 0), 0);

    const diff = Math.abs(total - expected);
    expect.soft(diff, `Updated total = ${total}, expected = ${expected}`).toBeLessThanOrEqual(1);

    if (diff > 1) {
      trackIssue({
        entity: 'Budget',
        operation: 'UPDATE',
        issue: 'Total after update/add does not match',
        severity: '[CRITICAL]',
        expected: String(expected),
        actual: String(total),
      });
    }

    // Verify category totals recalculated
    const materialTotal = arr
      .filter((it: any) => it.category === 'MATERIALS')
      .reduce((s: number, it: any) => s + Number(it.plannedAmount ?? 0), 0);
    // Бетон 4M + Арматура 2.8M = 6.8M
    expect.soft(Math.abs(materialTotal - 6_800_000), `Materials total = ${materialTotal}`).toBeLessThanOrEqual(1);

    const worksTotal = arr
      .filter((it: any) => it.category === 'WORKS')
      .reduce((s: number, it: any) => s + Number(it.plannedAmount ?? 0), 0);
    // Монтаж 4.2M + Электро 2.5M + Отделочные 1.5M = 8.2M
    expect.soft(Math.abs(worksTotal - 8_200_000), `Works total = ${worksTotal}`).toBeLessThanOrEqual(1);
  });

  /* ============================================================== */
  /*  D. STATUS TRANSITIONS                                         */
  /* ============================================================== */

  test('D1: Approve budget (DRAFT → APPROVED)', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}/approve`, {
      method: 'POST',
      headers: headers(),
    });
    // May fail if status flow requires specific conditions
    if (res.ok) {
      const b = (await res.json()).data ?? (await res.json());
      const res2 = await fetch(`${API}/api/budgets/${budgetId}`, { headers: headers() });
      const data = (await res2.json()).data ?? (await res2.json());
      expect.soft(data.status).toMatch(/APPROVED/i);
    } else {
      trackIssue({
        entity: 'Budget',
        operation: 'STATUS',
        issue: `Approve failed with status ${res.status}`,
        severity: '[MAJOR]',
        expected: 'APPROVED',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D2: Activate budget (APPROVED → ACTIVE)', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}/activate`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const res2 = await fetch(`${API}/api/budgets/${budgetId}`, { headers: headers() });
      const data = (await res2.json()).data ?? (await res2.json());
      expect.soft(data.status).toMatch(/ACTIVE/i);
    } else {
      trackIssue({
        entity: 'Budget',
        operation: 'STATUS',
        issue: `Activate failed with status ${res.status}`,
        severity: '[MAJOR]',
        expected: 'ACTIVE',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D3: Freeze budget (ACTIVE → FROZEN)', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}/freeze`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const res2 = await fetch(`${API}/api/budgets/${budgetId}`, { headers: headers() });
      const data = (await res2.json()).data ?? (await res2.json());
      expect.soft(data.status).toMatch(/FROZEN/i);
    } else {
      trackIssue({
        entity: 'Budget',
        operation: 'STATUS',
        issue: `Freeze failed with status ${res.status}`,
        severity: '[MINOR]',
        expected: 'FROZEN',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  test('D4: Close budget (→ CLOSED)', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}/close`, {
      method: 'POST',
      headers: headers(),
    });
    if (res.ok) {
      const res2 = await fetch(`${API}/api/budgets/${budgetId}`, { headers: headers() });
      const data = (await res2.json()).data ?? (await res2.json());
      expect.soft(data.status).toMatch(/CLOSED/i);
    } else {
      // Closing from FROZEN may not be supported — track
      trackIssue({
        entity: 'Budget',
        operation: 'STATUS',
        issue: `Close from current status failed: ${res.status}`,
        severity: '[MINOR]',
        expected: 'CLOSED',
        actual: `HTTP ${res.status}`,
      });
    }
  });

  /* ============================================================== */
  /*  E. DELETE                                                     */
  /* ============================================================== */

  test('E1: Delete a budget item', async () => {
    if (itemIds.length < 6) return; // need the 6th item (Отделочные работы)
    const lastItemId = itemIds[itemIds.length - 1];
    const res = await fetch(`${API}/api/budgets/${budgetId}/items/${lastItemId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    // Accept 200, 204, or 404 (already gone)
    expect.soft([200, 204, 404]).toContain(res.status);

    // Verify item count reduced
    const listRes = await fetch(`${API}/api/budgets/${budgetId}/items`, { headers: headers() });
    const items = (await listRes.json()).content ?? (await listRes.json()).data ?? (await listRes.json()) ?? [];
    const arr = Array.isArray(items) ? items : [];
    const found = arr.find((it: any) => it.id === lastItemId);
    expect.soft(found, 'Deleted item should not be in list').toBeFalsy();
  });

  /* ============================================================== */
  /*  F. VALIDATION                                                 */
  /* ============================================================== */

  test('F1: Cannot create budget without name', async () => {
    const res = await fetch(`${API}/api/budgets`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ projectId, plannedRevenue: 0, plannedCost: 0 }),
    });
    // Should return 400 due to @NotBlank on name
    expect.soft(res.status, 'Missing name should be rejected').toBeGreaterThanOrEqual(400);
  });

  test('F2: Cannot create item with negative plannedAmount', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}/items`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        category: 'OTHER',
        name: 'E2E-Negative test',
        plannedAmount: -100000,
        unit: 'шт',
        quantity: 1,
        costPrice: 1000,
      }),
    });
    if (res.ok) {
      trackIssue({
        entity: 'Budget',
        operation: 'VALIDATION',
        issue: 'Negative plannedAmount accepted — should be rejected',
        severity: '[CRITICAL]',
        expected: 'HTTP 400',
        actual: `HTTP ${res.status}`,
      });
      // Clean up the accidentally created item
      const json = await res.json();
      const id = json.id ?? json.data?.id;
      if (id) {
        await fetch(`${API}/api/budgets/${budgetId}/items/${id}`, { method: 'DELETE', headers: headers() });
      }
    } else {
      expect.soft(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  test('F3: Cannot create item without category', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}/items`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        name: 'E2E-No category',
        plannedAmount: 100000,
        unit: 'шт',
      }),
    });
    // @NotNull on category
    expect.soft(res.status, 'Missing category should be rejected').toBeGreaterThanOrEqual(400);
  });

  /* ============================================================== */
  /*  G. BUDGET vs ACTUAL (бухгалтер perspective)                   */
  /* ============================================================== */

  test('G1: Budget utilization % calculation (API)', async () => {
    const res = await fetch(`${API}/api/budgets/${budgetId}`, { headers: headers() });
    if (!res.ok) return;
    const data = (await res.json()).data ?? (await res.json());

    const planned = Number(data.plannedCost ?? 0);
    const actual = Number(data.actualCost ?? 0);

    if (planned > 0 && actual > 0) {
      const utilization = (actual / planned) * 100;
      console.log(`Budget utilization: ${utilization.toFixed(1)}% (Факт=${actual}, План=${planned})`);

      if (utilization > 100) {
        trackIssue({
          entity: 'Budget',
          operation: 'CALCULATION',
          issue: `Budget utilization ${utilization.toFixed(1)}% exceeds 100% — overspend!`,
          severity: '[CRITICAL]',
          expected: '≤ 100%',
          actual: `${utilization.toFixed(1)}%`,
        });
      }
    } else {
      console.log('Budget has no actual costs yet — utilization = 0%');
    }
  });

  /* ============================================================== */
  /*  H. UI CHECKS (директор perspective)                          */
  /* ============================================================== */

  test('H1: Budget list shows correct columns in UI', async ({ page }) => {
    await page.goto('http://localhost:4000/budgets', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    const body = await page.textContent('body') ?? '';

    // Business columns a director needs to see
    const expectedColumns = ['План', 'Факт', 'Откл', 'Статус'];
    for (const col of expectedColumns) {
      const hasCol = body.toLowerCase().includes(col.toLowerCase());
      if (!hasCol) {
        trackIssue({
          entity: 'Budget',
          operation: 'READ',
          issue: `Column "${col}" not visible — директор needs it`,
          severity: '[UX]',
          expected: `Column "${col}" visible`,
          actual: 'Not found',
        });
      }
    }
  });

  test('H2: Russian number format in budget amounts', async ({ page }) => {
    await page.goto('http://localhost:4000/budgets', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Check that amounts use Russian format (space thousands, comma decimal)
    const cells = await page.locator('td').allTextContents();
    const amountCells = cells.filter(c => c.match(/\d/) && (c.includes('₽') || c.includes(',') || parseFloat(c.replace(/\s/g, '')) > 1000));

    for (const cell of amountCells) {
      // Should NOT have Western format (1,234,567.89)
      if (cell.match(/\d{1,3}(,\d{3})+\.\d{2}/)) {
        trackIssue({
          entity: 'Budget',
          operation: 'READ',
          issue: `Amount "${cell}" uses Western format instead of Russian`,
          severity: '[MINOR]',
          expected: '"1 234 567,89"',
          actual: cell,
        });
      }
    }
  });
});
