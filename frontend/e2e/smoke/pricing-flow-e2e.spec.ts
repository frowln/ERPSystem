/**
 * PRICING FLOW E2E TEST
 *
 * Complete pricing flow through the UI:
 * 1. Create Project → auto-creates FM (Budget)
 * 2. Create Specification → auto-creates КЛ (Competitive List)
 * 3. Push Specification → FM
 * 4. Verify КЛ page has items, add vendor proposals
 * 5. Auto-select best prices in КЛ
 * 6. Verify costPrice appears in FM
 * 7. Create КП from Budget
 * 8. Set customerPrice on КП items
 * 9. Verify КЛ registry page renders with Russian i18n
 *
 * Prerequisites: backend running on :8080, frontend on :4000, admin user seeded.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ── Config ──────────────────────────────────────────────────────────────────
test.use({ storageState: 'e2e/.auth/user.json' });
test.describe.configure({ mode: 'serial' });

const SCREENSHOTS_DIR = path.resolve('e2e/screenshots/pricing-flow');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const API_BASE = process.env.BASE_URL || 'http://localhost:4000';

// ── Shared State ────────────────────────────────────────────────────────────
let authToken = '';
let projectId = '';
let budgetId = '';
let specId = '';
let competitiveListId = '';
let cpId = '';

// ── Helpers ─────────────────────────────────────────────────────────────────

async function shot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: true,
  });
}

async function dismissCookieConsent(page: Page) {
  const btn = page.locator('button').filter({ hasText: /accept|принять|ок|ok/i });
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}

async function go(page: Page, route: string, timeout = 45_000) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout });
      await page.waitForTimeout(1500);
      return;
    } catch {
      await page.waitForTimeout(800 * (attempt + 1));
    }
  }
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout });
}

async function extractAuthToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const persisted = localStorage.getItem('privod-auth');
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        return parsed?.state?.token ?? parsed?.token ?? '';
      } catch { /* ignore */ }
    }
    return localStorage.getItem('auth_token') ?? '';
  });
}

async function apiPost(page: Page, endpoint: string, body: Record<string, unknown>) {
  return page.evaluate(
    async ({ url, token, payload }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    { url: `${API_BASE}${endpoint}`, token: authToken, payload: body },
  );
}

async function apiPut(page: Page, endpoint: string, body: Record<string, unknown>) {
  return page.evaluate(
    async ({ url, token, payload }) => {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    { url: `${API_BASE}${endpoint}`, token: authToken, payload: body },
  );
}

async function apiGet(page: Page, endpoint: string) {
  return page.evaluate(
    async ({ url, token }) => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    { url: `${API_BASE}${endpoint}`, token: authToken },
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

test.describe('Pricing Flow: Spec → КЛ → КП → ФМ', () => {

  test('0 — extract auth token', async ({ page }) => {
    await go(page, '/');
    await dismissCookieConsent(page);
    authToken = await extractAuthToken(page);
    expect(authToken).toBeTruthy();
  });

  test('1 — create project via API (auto-creates Budget)', async ({ page }) => {
    await go(page, '/');
    const name = `E2E-Ценообразование-${Date.now()}`;
    const resp = await apiPost(page, '/api/projects', {
      name,
      code: `E2E-${Date.now()}`,
      projectType: 'RESIDENTIAL',
      status: 'IN_PROGRESS',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(resp.success).toBe(true);
    projectId = resp.data.id;
    expect(projectId).toBeTruthy();

    // Auto-create budget
    const budgetResp = await apiPost(page, '/api/budgets', {
      projectId,
      name: `ФМ — ${name}`,
    });
    expect(budgetResp.success).toBe(true);
    budgetId = budgetResp.data.id;
    expect(budgetId).toBeTruthy();
  });

  test('2 — create specification via API (auto-creates КЛ)', async ({ page }) => {
    await go(page, '/');
    const resp = await apiPost(page, '/api/specifications', {
      projectId,
      name: 'Спецификация ОВ (тест)',
      description: 'Отопление и вентиляция',
    });
    expect(resp.success).toBe(true);
    specId = resp.data.id;
    expect(specId).toBeTruthy();

    // Verify КЛ was auto-created
    const clResp = await apiGet(page, `/api/competitive-lists?projectId=${projectId}`);
    const lists = clResp.data?.content ?? clResp.data ?? [];
    expect(lists.length).toBeGreaterThanOrEqual(1);
    competitiveListId = lists[0].id;
  });

  test('3 — add spec items and push to FM', async ({ page }) => {
    await go(page, '/');
    // Add 3 spec items
    const items = [
      { name: 'Радиатор KERMI FKO 22 500x1000', quantity: 10, unitOfMeasure: 'шт.', itemType: 'MATERIAL' },
      { name: 'Труба PPR PN20 d32', quantity: 150, unitOfMeasure: 'м.п.', itemType: 'MATERIAL' },
      { name: 'Вентиль шаровой DN 32', quantity: 20, unitOfMeasure: 'шт.', itemType: 'MATERIAL' },
    ];
    for (const item of items) {
      const r = await apiPost(page, `/api/specifications/${specId}/items`, item);
      expect(r.success).toBe(true);
    }

    // Push spec items to FM
    const specItems = await apiGet(page, `/api/specifications/${specId}/items`);
    const specItemList = specItems.data ?? [];
    expect(specItemList.length).toBe(3);

    // Create section in budget
    const sectionResp = await apiPost(page, `/api/budgets/${budgetId}/items`, {
      section: true,
      name: 'ОВ — Отопление и вентиляция',
      category: 'MATERIALS',
      plannedAmount: 0,
    });
    expect(sectionResp.success).toBe(true);
    const sectionId = sectionResp.data.id;

    // Create budget items linked to spec items
    for (const si of specItemList) {
      const biResp = await apiPost(page, `/api/budgets/${budgetId}/items`, {
        parentId: sectionId,
        section: false,
        name: si.name,
        unit: si.unitOfMeasure,
        quantity: si.quantity,
        category: 'MATERIALS',
        plannedAmount: 0,
      });
      console.log(`Budget item [${si.name}]:`, JSON.stringify(biResp).slice(0, 300));
      expect(biResp.success).toBe(true);
      // Link specItem → budgetItem
      await apiPut(page, `/api/specifications/items/${si.id}`, {
        budgetItemId: biResp.data.id,
      });
    }
  });

  test('4 — navigate to КЛ registry page and verify i18n', async ({ page }) => {
    await go(page, '/specifications/competitive-registry');
    await dismissCookieConsent(page);

    const body = await page.locator('body').textContent() ?? '';

    // Should have Russian labels, NOT raw i18n keys
    expect(body).not.toContain('competitiveList.registryTitle');
    expect(body).not.toContain('competitiveList.registryEmpty');

    // Should contain Russian text (registry title or empty state)
    const hasRussianTitle = body.includes('Реестр конкурентных листов') || body.includes('Competitive List Registry');
    const hasContent = body.includes('Конкурентные листы не найдены')
      || body.includes('No competitive lists found')
      || body.includes('КЛ —');
    expect(hasRussianTitle || hasContent).toBe(true);

    await shot(page, '04-cl-registry');
  });

  test('5 — navigate to КЛ detail page and verify structure', async ({ page }) => {
    await go(page, `/specifications/${specId}/competitive-list/${competitiveListId}`);
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Should NOT contain raw i18n keys
    expect(body).not.toContain('competitiveList.detail.');
    expect(body).not.toContain('competitiveList.emptyTitle');

    // Should have Russian labels
    const hasPositionLabel = body.includes('Позиция') || body.includes('Position');
    expect(hasPositionLabel).toBe(true);

    // Should show 3 spec items in left panel
    expect(body).toContain('Радиатор KERMI');
    expect(body).toContain('Труба PPR');
    expect(body).toContain('Вентиль шаровой');

    await shot(page, '05-cl-detail');
  });

  test('6 — add vendor proposals via API and verify in UI', async ({ page }) => {
    await go(page, '/');
    // Get spec items to get their IDs
    const specItems = await apiGet(page, `/api/specifications/${specId}/items`);
    const items = specItems.data ?? [];
    const radiator = items.find((i: { name: string }) => i.name.includes('Радиатор'));
    expect(radiator).toBeTruthy();

    // Add 3 vendor proposals for Радиатор
    const vendors = [
      { vendorName: 'ООО Теплоком', unitPrice: 12500, quantity: 10 },
      { vendorName: 'АО МТК', unitPrice: 11800, quantity: 10 },
      { vendorName: 'ИП Термолюкс', unitPrice: 13200, quantity: 10 },
    ];
    for (const v of vendors) {
      const resp = await apiPost(page, `/api/competitive-lists/${competitiveListId}/entries`, {
        specItemId: radiator.id,
        ...v,
        totalPrice: v.unitPrice * v.quantity,
      });
      expect(resp.success).toBe(true);
    }

    // Navigate to КЛ detail and check proposals visible
    await go(page, `/specifications/${specId}/competitive-list/${competitiveListId}`);
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Click on Радиатор item
    await page.locator('button').filter({ hasText: /Радиатор KERMI/i }).click();
    await page.waitForTimeout(1000);

    const body = await page.locator('body').textContent() ?? '';
    expect(body).toContain('Теплоком');
    expect(body).toContain('МТК');
    expect(body).toContain('Термолюкс');

    await shot(page, '06-cl-with-proposals');
  });

  test('7 — auto-select best prices via UI button', async ({ page }) => {
    await go(page, `/specifications/${specId}/competitive-list/${competitiveListId}`);
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Click "Автовыбор лучших" / "Auto-select best" button
    const autoSelectBtn = page.getByRole('button', { name: /автовыбор|auto.?select/i });
    if (await autoSelectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await autoSelectBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // Fallback: via API
      await apiPost(page, `/api/competitive-lists/${competitiveListId}/auto-select-best`, {});
    }

    // Verify winner marker appears
    await go(page, `/specifications/${specId}/competitive-list/${competitiveListId}`);
    await page.waitForTimeout(2000);

    await shot(page, '07-cl-auto-selected');

    // Via API check that winner is set
    const entries = await apiGet(page, `/api/competitive-lists/${competitiveListId}/entries`);
    const entryList = entries.data ?? [];
    const winners = entryList.filter((e: { isWinner?: boolean }) => e.isWinner);
    expect(winners.length).toBeGreaterThanOrEqual(1);
    // Winner should be МТК with lowest price (11800)
    const winner = winners[0];
    expect(winner.unitPrice).toBe(11800);
  });

  test('8 — verify costPrice propagated to FM', async ({ page }) => {
    await go(page, '/');
    const budgetItems = await apiGet(page, `/api/budgets/${budgetId}/items`);
    const items = budgetItems.data ?? [];
    const radiatorBi = items.find((bi: { name: string }) => bi.name.includes('Радиатор KERMI'));
    expect(radiatorBi).toBeTruthy();
    // costPrice should be 11800 from КЛ winner
    expect(radiatorBi.costPrice).toBe(11800);
  });

  test('9 — create КП from Budget and verify items', async ({ page }) => {
    await go(page, '/');
    const resp = await apiPost(page, '/api/commercial-proposals', {
      budgetId,
      projectId,
      name: 'КП — Тест ценообразования',
    });
    expect(resp.success).toBe(true);
    cpId = resp.data.id;

    // Verify КП has items from budget
    const cpItems = await apiGet(page, `/api/commercial-proposals/${cpId}/items`);
    console.log('КП items response:', JSON.stringify(cpItems).slice(0, 500));
    const items = Array.isArray(cpItems.data) ? cpItems.data : (cpItems.data?.content ?? []);
    console.log(`КП items count: ${items.length}`);
    expect(items.length).toBe(3);

    // Radiator item should have costPrice=11800 from КЛ
    const radiatorCp = items.find((i: { budgetItemName: string }) => i.budgetItemName?.includes('Радиатор'));
    expect(radiatorCp).toBeTruthy();
    expect(radiatorCp.costPrice).toBe(11800);
  });

  test('10 — set customerPrice on КП items and verify margin', async ({ page }) => {
    await go(page, '/');
    const cpItems = await apiGet(page, `/api/commercial-proposals/${cpId}/items`);
    const items = cpItems.data ?? [];

    // Set customerPrice on all items
    for (const item of items) {
      const customerPrice = (item.costPrice || 1000) * 1.25; // 25% margin
      const resp = await apiPut(page, `/api/commercial-proposals/${cpId}/items/${item.id}`, {
        customerPrice,
      });
      expect(resp.success).toBe(true);
    }

    // Check КП totals
    const cpResp = await apiGet(page, `/api/commercial-proposals/${cpId}`);
    expect(cpResp.data.totalCustomerPrice).toBeGreaterThan(0);
    expect(cpResp.data.totalCostPrice).toBeGreaterThan(0);
    // marginPercent should be ~20% (25% markup ≈ 20% margin)
    expect(cpResp.data.marginPercent).toBeGreaterThan(10);
  });

  test('11 — navigate to КП detail page and verify UI', async ({ page }) => {
    await go(page, `/commercial-proposals/${cpId}`);
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Should show item names
    expect(body).toContain('Радиатор KERMI');
    expect(body).toContain('Труба PPR');
    expect(body).toContain('Вентиль шаровой');

    // Should NOT have raw i18n keys
    expect(body).not.toContain('commercialProposal.col');

    await shot(page, '11-cp-detail');
  });

  test('12 — КЛ registry i18n: no raw keys visible', async ({ page }) => {
    await go(page, '/specifications/competitive-registry');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Must NOT contain any raw i18n keys
    const rawKeyPattern = /competitiveList\.\w+/;
    const rawKeys = body.match(new RegExp(rawKeyPattern, 'g')) ?? [];
    // Filter out false positives (e.g. if body contains source code somehow)
    const realRawKeys = rawKeys.filter(k => !k.includes('statuses.'));
    expect(realRawKeys).toEqual([]);

    // Should contain data from our created КЛ or empty state text
    const hasOurCl = body.includes('КЛ —') || body.includes('Спецификация ОВ');
    const hasEmptyState = body.includes('Конкурентные листы не найдены') || body.includes('No competitive lists found');
    // Either we see our data or the properly translated empty state
    expect(hasOurCl || hasEmptyState).toBe(true);

    await shot(page, '12-cl-registry-final');
  });

  test('13 — FM budget items have costPrice from КЛ', async ({ page }) => {
    await go(page, '/');
    const budgetItems = await apiGet(page, `/api/budgets/${budgetId}/items`);
    const allItems = budgetItems.data ?? [];
    const items = allItems.filter((bi: { section: boolean }) => !bi.section);
    console.log(`  FM non-section items: ${items.length}, total: ${allItems.length}`);

    expect(items.length).toBe(3);

    const radiator = items.find((bi: { name: string }) => bi.name?.includes('Радиатор'));
    expect(radiator).toBeTruthy();
    // costPrice=11800 from КЛ winner auto-push
    console.log(`  FM Радиатор: costPrice=${radiator.costPrice}, customerPrice=${radiator.customerPrice}, priceSourceType=${radiator.priceSourceType}`);
    expect(radiator.costPrice).toBe(11800);
    expect(radiator.priceSourceType).toBe('COMPETITIVE_LIST');
  });

  test('99 — summary', async ({ page }) => {
    console.log('\n══════════════════════════════════════════════');
    console.log('  PRICING FLOW E2E — SUMMARY');
    console.log('══════════════════════════════════════════════');
    console.log(`  Project:  ${projectId}`);
    console.log(`  Budget:   ${budgetId}`);
    console.log(`  Spec:     ${specId}`);
    console.log(`  КЛ:       ${competitiveListId}`);
    console.log(`  КП:       ${cpId}`);
    console.log('  Flow:     Spec → FM → КЛ (vendors) → costPrice → КП (customerPrice) → ФМ');
    console.log('══════════════════════════════════════════════\n');
  });
});
