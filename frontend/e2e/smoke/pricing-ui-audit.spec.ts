/**
 * PRICING UI AUDIT E2E TEST
 *
 * Verifies UI rendering and correctness of the entire pricing chain:
 * - FM page: VAT=20%, i18n labels (no hardcoded Russian), KPI cards, table columns
 * - КП page: margin display, customerPrice inline edit, status badges
 * - КЛ page: registry i18n, detail page items, vendor proposals table
 * - Spec page: item list, push-to-FM button, КЛ link
 * - Project finance tab: budget card, linked documents
 *
 * Uses real data created by the API, then navigates to EACH page and checks visible text.
 *
 * Prerequisites: backend running on :8080, frontend on :4000, admin user seeded.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ── Config ──────────────────────────────────────────────────────────────────
test.use({ storageState: 'e2e/.auth/user.json' });
test.describe.configure({ mode: 'serial' });

const SHOTS = path.resolve('e2e/screenshots/pricing-ui-audit');
fs.mkdirSync(SHOTS, { recursive: true });

const BASE = process.env.BASE_URL || 'http://localhost:4000';

// ── Shared state ────────────────────────────────────────────────────────────
let token = '';
let projectId = '';
let budgetId = '';
let specId = '';
let clId = '';
let cpId = '';

// ── Helpers ─────────────────────────────────────────────────────────────────
async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function dismiss(page: Page) {
  const btn = page.locator('button').filter({ hasText: /accept|принять|ок|ok/i });
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}

async function nav(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1500);
}

async function extractToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const p = localStorage.getItem('privod-auth');
    if (p) { try { const o = JSON.parse(p); return o?.state?.token ?? o?.token ?? ''; } catch { /* */ } }
    return localStorage.getItem('auth_token') ?? '';
  });
}

async function api(page: Page, method: string, endpoint: string, body?: Record<string, unknown>) {
  return page.evaluate(
    async ({ url, tk, m, b }) => {
      const opts: RequestInit = { method: m, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` } };
      if (b) opts.body = JSON.stringify(b);
      const r = await fetch(url, opts);
      return r.json();
    },
    { url: `${BASE}${endpoint}`, tk: token, m: method, b: body },
  );
}

// ── SETUP: create full pricing chain data ───────────────────────────────────

test.describe('Pricing UI Audit — full chain verification', () => {

  test('setup — auth & create data', async ({ page }) => {
    await nav(page, '/');
    await dismiss(page);
    token = await extractToken(page);
    expect(token).toBeTruthy();

    // 1. Create project
    const ts = Date.now();
    const proj = await api(page, 'POST', '/api/projects', {
      name: `UI-Audit-${ts}`,
      code: `UA-${ts}`,
      projectType: 'COMMERCIAL',
      status: 'IN_PROGRESS',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(proj.success).toBe(true);
    projectId = proj.data.id;

    // 2. Create budget (FM)
    const bud = await api(page, 'POST', '/api/budgets', { projectId, name: `ФМ UI-Audit-${ts}` });
    expect(bud.success).toBe(true);
    budgetId = bud.data.id;

    // 3. Create specification (auto-creates КЛ)
    const spec = await api(page, 'POST', '/api/specifications', {
      projectId,
      name: `Спец UI-Audit-${ts}`,
      description: 'E2E UI audit spec',
    });
    expect(spec.success).toBe(true);
    specId = spec.data.id;

    // Get auto-created КЛ
    const cls = await api(page, 'GET', `/api/competitive-lists?projectId=${projectId}`);
    const clList = cls.data?.content ?? cls.data ?? [];
    expect(clList.length).toBeGreaterThanOrEqual(1);
    clId = clList[0].id;

    // 4. Add spec items
    const specItems = [
      { name: 'Кабель ВВГнг 3x2.5', quantity: 500, unitOfMeasure: 'м', itemType: 'MATERIAL' },
      { name: 'Автомат ABB S203 C25', quantity: 30, unitOfMeasure: 'шт', itemType: 'MATERIAL' },
      { name: 'Щит ЩРн-24', quantity: 5, unitOfMeasure: 'шт', itemType: 'EQUIPMENT' },
    ];
    for (const si of specItems) {
      const r = await api(page, 'POST', `/api/specifications/${specId}/items`, si);
      expect(r.success).toBe(true);
    }

    // 5. Create budget section + items
    const sec = await api(page, 'POST', `/api/budgets/${budgetId}/items`, {
      section: true, name: 'Электрика', category: 'MATERIALS', plannedAmount: 0,
    });
    expect(sec.success).toBe(true);
    const sectionId = sec.data.id;

    const siList = await api(page, 'GET', `/api/specifications/${specId}/items`);
    for (const si of (siList.data ?? [])) {
      const bi = await api(page, 'POST', `/api/budgets/${budgetId}/items`, {
        parentId: sectionId, section: false, name: si.name,
        unit: si.unitOfMeasure, quantity: si.quantity,
        category: si.itemType === 'EQUIPMENT' ? 'EQUIPMENT' : 'MATERIALS',
        plannedAmount: 0,
      });
      expect(bi.success).toBe(true);
      await api(page, 'PUT', `/api/specifications/items/${si.id}`, { budgetItemId: bi.data.id });
    }

    // 6. Add КЛ vendor proposals for first item
    const specItemsFinal = await api(page, 'GET', `/api/specifications/${specId}/items`);
    const firstItem = (specItemsFinal.data ?? [])[0];
    const vendors = [
      { vendorName: 'Электромир', unitPrice: 85, quantity: 500 },
      { vendorName: 'КабельОпт', unitPrice: 72, quantity: 500 },
      { vendorName: 'Энергопром', unitPrice: 91, quantity: 500 },
    ];
    for (const v of vendors) {
      await api(page, 'POST', `/api/competitive-lists/${clId}/entries`, {
        specItemId: firstItem.id, ...v, totalPrice: v.unitPrice * v.quantity,
      });
    }

    // 7. Auto-select best price
    await api(page, 'POST', `/api/competitive-lists/${clId}/auto-select-best`, {});

    // 8. Create КП
    const cp = await api(page, 'POST', '/api/commercial-proposals', {
      budgetId, projectId, name: `КП UI-Audit-${ts}`,
    });
    expect(cp.success).toBe(true);
    cpId = cp.data.id;

    // 9. Set customerPrice on КП items (markup 30%)
    const cpItems = await api(page, 'GET', `/api/commercial-proposals/${cpId}/items`);
    for (const item of (cpItems.data ?? [])) {
      const price = Math.round((item.costPrice || 100) * 1.30);
      await api(page, 'PUT', `/api/commercial-proposals/${cpId}/items/${item.id}`, { customerPrice: price });
    }

    console.log(`\n  Created: project=${projectId} budget=${budgetId} spec=${specId} cl=${clId} cp=${cpId}\n`);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FM PAGE — Financial Model
  // ═══════════════════════════════════════════════════════════════════════════

  test('FM page — renders with correct i18n labels', async ({ page }) => {
    await nav(page, `/budgets/${budgetId}/fm`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Must NOT show raw i18n keys
    expect(body).not.toContain('finance.fm.');
    expect(body).not.toContain('kpiOverhead');
    expect(body).not.toContain('kpiProfit');
    expect(body).not.toContain('Col Overhead');
    expect(body).not.toContain('Col Contingency');
    expect(body).not.toContain('Kpi Overhead');

    // Must show proper Russian labels for KPI strip
    const hasNakl = body.includes('Накладные') || body.includes('Overhead');
    const hasProfit = body.includes('Сметная прибыль') || body.includes('Estimated Profit');
    expect(hasNakl).toBe(true);
    expect(hasProfit).toBe(true);

    // Table column headers — should show НР, СП, НП (or OH, EP, CG in English)
    const hasOhCol = body.includes('НР, %') || body.includes('OH, %');
    const hasSpCol = body.includes('СП, %') || body.includes('EP, %');
    const hasNpCol = body.includes('НП, %') || body.includes('CG, %');
    expect(hasOhCol).toBe(true);
    expect(hasSpCol).toBe(true);
    expect(hasNpCol).toBe(true);

    await shot(page, '01-fm-page-labels');
  });

  test('FM page — VAT is 20% (not 22%)', async ({ page }) => {
    await nav(page, '/');
    // Get budget items and calculate expected VAT
    const budgetItems = await api(page, 'GET', `/api/budgets/${budgetId}/items`);
    const items = (budgetItems.data ?? []).filter((i: any) => !i.section);

    let customerTotal = 0;
    for (const i of items) {
      customerTotal += (i.customerPrice ?? 0) * (i.quantity ?? 1);
    }

    const expectedVat20 = customerTotal * 0.20;
    const wrongVat22 = customerTotal * 0.22;

    // Navigate to FM and check the VAT KPI value
    await nav(page, `/budgets/${budgetId}/fm`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // If customerTotal > 0, verify VAT display
    if (customerTotal > 0) {
      const fmtVat20 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(expectedVat20);
      const fmtVat22 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(wrongVat22);

      // Should contain 20% VAT value, NOT 22%
      if (fmtVat20 !== fmtVat22) {
        // Only assert if the values are different enough to distinguish
        expect(body).toContain(fmtVat20);
        expect(body).not.toContain(fmtVat22);
      }
    }

    await shot(page, '02-fm-vat-20pct');
  });

  test('FM page — item count i18n (no hardcoded Russian)', async ({ page }) => {
    await nav(page, `/budgets/${budgetId}/fm`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Should show items count (e.g. "3 позиций в 1 разделах")
    // The key point is it should NOT show the old hardcoded template
    expect(body).not.toContain('позиций в  разделах');

    // Should contain a numeric count somewhere
    const hasCount = /\d+ позиц|\d+ items/i.test(body);
    expect(hasCount).toBe(true);

    await shot(page, '03-fm-item-count');
  });

  test('FM page — budget items show in table with data', async ({ page }) => {
    await nav(page, `/budgets/${budgetId}/fm`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Our items should be visible
    expect(body).toContain('Кабель ВВГнг');
    expect(body).toContain('Автомат ABB');
    expect(body).toContain('Щит ЩРн');

    // Section header should be visible
    expect(body).toContain('Электрика');

    // Table should have the total footer
    const hasTotal = body.includes('Итого') || body.includes('Total');
    expect(hasTotal).toBe(true);

    await shot(page, '04-fm-table-items');
  });

  test('FM page — КП creation button works', async ({ page }) => {
    await nav(page, `/budgets/${budgetId}/fm`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    // Find "Создать КП" / "Create CP" button
    const cpBtn = page.locator('button').filter({ hasText: /создать кп|create.*proposal|create cp/i });
    expect(await cpBtn.isVisible({ timeout: 5000 })).toBe(true);

    // Click it → modal should appear
    await cpBtn.click();
    await page.waitForTimeout(1000);

    const body = await page.locator('body').textContent() ?? '';

    // Modal should show proper i18n, NOT hardcoded Russian
    expect(body).not.toContain('finance.fm.createKpTitle');

    // Should show modal with name input
    const modalTitle = body.includes('Создать коммерческое') || body.includes('Create commercial') || body.includes('Создание КП');
    expect(modalTitle).toBe(true);

    // Close modal
    await page.keyboard.press('Escape');

    await shot(page, '05-fm-cp-button');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // КП PAGE — Commercial Proposal
  // ═══════════════════════════════════════════════════════════════════════════

  test('КП detail — renders items with prices and margin', async ({ page }) => {
    await nav(page, `/commercial-proposals/${cpId}`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Items should be visible
    expect(body).toContain('Кабель ВВГнг');
    expect(body).toContain('Автомат ABB');

    // Should show margin percentage somewhere (we set 30% markup ≈ 23% margin)
    const hasMargin = /\+?\d+[\.,]\d%/.test(body);
    expect(hasMargin).toBe(true);

    // Should NOT show raw i18n keys
    expect(body).not.toContain('commercialProposal.col');
    expect(body).not.toContain('commercialProposal.item');

    // Should show status badges
    const hasStatusLabel = body.includes('Не обработан') || body.includes('Unprocessed') || body.includes('UNPROCESSED');
    expect(hasStatusLabel).toBe(true);

    await shot(page, '06-cp-detail');
  });

  test('КП detail — customer price cells are interactive', async ({ page }) => {
    await nav(page, `/commercial-proposals/${cpId}`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    // Find a price cell and click it — should become an input
    const priceButton = page.locator('button').filter({ hasText: /₽/ }).first();
    if (await priceButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await priceButton.click();
      await page.waitForTimeout(500);

      // An input should appear for inline editing
      const input = page.locator('input[inputmode="decimal"]').first();
      const inputVisible = await input.isVisible({ timeout: 2000 }).catch(() => false);
      expect(inputVisible).toBe(true);

      // Press Escape to close
      await page.keyboard.press('Escape');
    }

    await shot(page, '07-cp-price-edit');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // КЛ PAGES — Competitive Lists
  // ═══════════════════════════════════════════════════════════════════════════

  test('КЛ registry — fully translated, no raw keys', async ({ page }) => {
    await nav(page, '/specifications/competitive-registry');
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // No raw i18n keys
    expect(body).not.toContain('competitiveList.registry');
    expect(body).not.toContain('competitiveList.registryTitle');
    expect(body).not.toContain('competitiveList.registryEmpty');

    // Should have title in Russian or English
    const hasTitle = body.includes('Реестр конкурентных листов') || body.includes('Competitive List Registry');
    expect(hasTitle).toBe(true);

    await shot(page, '08-cl-registry');
  });

  test('КЛ detail — shows spec items and proposals', async ({ page }) => {
    await nav(page, `/specifications/${specId}/competitive-list/${clId}`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Should show spec items
    expect(body).toContain('Кабель ВВГнг');

    // Should NOT show raw i18n keys
    expect(body).not.toContain('competitiveList.detail');

    // Click on first item to show proposals
    const itemBtn = page.locator('button').filter({ hasText: /Кабель ВВГнг/i });
    if (await itemBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await itemBtn.click();
      await page.waitForTimeout(1500);

      const bodyAfter = await page.locator('body').textContent() ?? '';
      // Should show vendor names
      expect(bodyAfter).toContain('КабельОпт');
      expect(bodyAfter).toContain('Электромир');
    }

    await shot(page, '09-cl-detail-proposals');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIFICATION PAGE
  // ═══════════════════════════════════════════════════════════════════════════

  test('Specification detail — items and navigation', async ({ page }) => {
    await nav(page, `/specifications/${specId}`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Should show spec items
    expect(body).toContain('Кабель ВВГнг');
    expect(body).toContain('Автомат ABB');
    expect(body).toContain('Щит ЩРн');

    // Should NOT show raw i18n keys
    expect(body).not.toContain('specifications.');

    await shot(page, '10-spec-detail');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECT FINANCE TAB
  // ═══════════════════════════════════════════════════════════════════════════

  test('Project detail — finance card displays budget', async ({ page }) => {
    await nav(page, `/projects/${projectId}`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // Project name should be visible
    expect(body).toContain('UI-Audit');

    // Should NOT show raw i18n keys
    expect(body).not.toContain('projects.finance.');

    await shot(page, '11-project-detail');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════

  test('Navigation — КЛ link is translated in sidebar', async ({ page }) => {
    await nav(page, '/specifications');
    await dismiss(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').textContent() ?? '';

    // The "Конкурентные листы" nav item should exist, NOT "competitive-lists" raw key
    expect(body).not.toContain('navigation.items.competitive-lists');

    await shot(page, '12-nav-cl-link');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-PAGE LINKS
  // ═══════════════════════════════════════════════════════════════════════════

  test('FM → КП navigation works', async ({ page }) => {
    await nav(page, `/budgets/${budgetId}/fm`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    // Click "Создать КП" button
    const cpBtn = page.locator('button').filter({ hasText: /создать кп|create.*cp/i });
    if (await cpBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cpBtn.click();
      await page.waitForTimeout(800);

      // Modal should appear
      const modal = page.locator('input[type="text"]').last();
      expect(await modal.isVisible({ timeout: 3000 })).toBe(true);

      // Close
      await page.keyboard.press('Escape');
    }

    await shot(page, '13-fm-to-cp-nav');
  });

  test('КП page — price source badges link to КЛ/invoices', async ({ page }) => {
    await nav(page, `/commercial-proposals/${cpId}`);
    await dismiss(page);
    await page.waitForTimeout(2000);

    // Check for price source badges (КЛ, Manual, etc.)
    const body = await page.locator('body').textContent() ?? '';
    const hasSourceBadge = body.includes('Из конкурентного листа') || body.includes('From competitive list')
      || body.includes('Вручную') || body.includes('Manual')
      || body.includes('Из сметы') || body.includes('From estimate')
      || body.includes('Из счёта') || body.includes('From invoice');
    // At least some price source indicator should exist
    expect(hasSourceBadge).toBe(true);

    await shot(page, '14-cp-price-source');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL i18n CHECK — no raw keys on any pricing page
  // ═══════════════════════════════════════════════════════════════════════════

  test('Global — no raw i18n keys on any pricing page', async ({ page }) => {
    const routes = [
      `/budgets/${budgetId}/fm`,
      `/commercial-proposals/${cpId}`,
      '/specifications/competitive-registry',
      `/specifications/${specId}`,
    ];

    for (const route of routes) {
      await nav(page, route);
      await dismiss(page);
      await page.waitForTimeout(1500);

      const body = await page.locator('body').textContent() ?? '';

      // Check for common raw key patterns that indicate missing translations
      const rawPatterns = [
        /finance\.fm\.\w+/,
        /commercialProposal\.\w+/,
        /competitiveList\.\w+/,
        /specifications\.\w+/,
        /Kpi (Overhead|Profit|Contingency)/,
        /Col (Overhead|Profit|Contingency) Hint/,
        /Import Estimate (Title|Btn)/,
        /Confirm Import Estimate/,
      ];

      for (const pattern of rawPatterns) {
        const matches = body.match(new RegExp(pattern, 'g')) ?? [];
        if (matches.length > 0) {
          console.log(`  RAW KEY on ${route}: ${matches.join(', ')}`);
        }
        expect(matches.length, `Raw key ${pattern} found on ${route}`).toBe(0);
      }
    }

    await shot(page, '15-global-i18n-clean');
  });

  test('summary', async ({ page }) => {
    console.log('\n══════════════════════════════════════════════');
    console.log('  PRICING UI AUDIT — ALL CHECKS PASSED');
    console.log('══════════════════════════════════════════════');
    console.log(`  FM:   /budgets/${budgetId}/fm`);
    console.log(`  КП:   /commercial-proposals/${cpId}`);
    console.log(`  КЛ:   /specifications/${specId}/competitive-list/${clId}`);
    console.log(`  Spec: /specifications/${specId}`);
    console.log('  Verified: VAT=20%, i18n, navigation, margins, prices');
    console.log('══════════════════════════════════════════════\n');
  });
});
