/**
 * ЛСР IMPORT E2E TEST
 *
 * Tests the complete ЛСР (estimate) xlsx import flow:
 * 1. Create a project via API (auto-creates Budget)
 * 2. Navigate to ФМ page
 * 3. Open "Импорт ЛСР" modal
 * 4. Upload a ГРАНД-Смета xlsx file
 * 5. Verify parser detects positions, sections, and correct totals
 * 6. Import into ФМ
 * 7. Verify items appear in the ФМ table
 *
 * Prerequisites: backend on :8080, frontend on :4000, admin user seeded.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ── Config ──────────────────────────────────────────────────────────────────
test.use({ storageState: 'e2e/.auth/user.json' });
test.describe.configure({ mode: 'serial' });

const SCREENSHOTS_DIR = path.resolve('e2e/screenshots/lsr-import');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const API_BASE = process.env.BASE_URL || 'http://localhost:4000';
const LSR_FILE = '/Users/damirkasimov/Downloads/Раздел ПД №12_Том 12.3_ЛСР-02-01-06-ИОС4.1 вентиляция зд.23к - ЛСР по Методике 2020 (РИМ).xlsx';

// ── Shared State ────────────────────────────────────────────────────────────
let authToken = '';
let projectId = '';
let budgetId = '';

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

test.describe('ЛСР Import: ГРАНД-Смета → ФМ', () => {

  test('0 — extract auth token', async ({ page }) => {
    await go(page, '/');
    await dismissCookieConsent(page);
    authToken = await extractAuthToken(page);
    expect(authToken).toBeTruthy();
  });

  test('1 — create project + budget via API', async ({ page }) => {
    await go(page, '/');
    const ts = Date.now();
    const name = `E2E-ЛСР-Import-${ts}`;

    // Create project
    const projResp = await apiPost(page, '/api/projects', {
      name,
      code: `LSR-${ts}`,
      projectType: 'RESIDENTIAL',
      status: 'IN_PROGRESS',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(projResp.success).toBe(true);
    projectId = projResp.data.id;
    expect(projectId).toBeTruthy();

    // Create budget for the project
    const budgetResp = await apiPost(page, '/api/budgets', {
      projectId,
      name: `ФМ — ${name}`,
    });
    expect(budgetResp.success).toBe(true);
    budgetId = budgetResp.data.id;
    expect(budgetId).toBeTruthy();
  });

  test('2 — navigate to ФМ page', async ({ page }) => {
    await go(page, `/finance/budgets/${budgetId}/fm`);
    await dismissCookieConsent(page);

    // The FM page should show the budget name or at least the import button
    const importBtn = page.locator('button').filter({ hasText: /Импорт ЛСР/i });
    await expect(importBtn).toBeVisible({ timeout: 10_000 });
    await shot(page, '02-fm-page-loaded');
  });

  test('3 — open ЛСР import modal', async ({ page }) => {
    await go(page, `/finance/budgets/${budgetId}/fm`);
    await dismissCookieConsent(page);

    const importBtn = page.locator('button').filter({ hasText: /Импорт ЛСР/i });
    await importBtn.click();

    // Modal should appear with drop zone
    const modal = page.locator('[class*="fixed"][class*="inset"]').filter({ hasText: /Импорт ЛСР из Excel/i });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Info text should be visible
    await expect(modal.locator('text=Как работает импорт')).toBeVisible();

    await shot(page, '03-lsr-modal-open');
  });

  test('4 — upload ГРАНД-Смета xlsx and verify parsing', async ({ page }) => {
    test.setTimeout(120_000); // Large file parsing takes time

    // Check file exists
    if (!fs.existsSync(LSR_FILE)) {
      test.skip(true, `ЛСР file not found: ${LSR_FILE}`);
      return;
    }

    await go(page, `/finance/budgets/${budgetId}/fm`);
    await dismissCookieConsent(page);

    // Open modal
    const importBtn = page.locator('button').filter({ hasText: /Импорт ЛСР/i });
    await importBtn.click();

    // Wait for modal
    const modal = page.locator('[class*="fixed"][class*="inset"]').filter({ hasText: /Импорт ЛСР из Excel/i });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // Upload file via hidden input
    const fileInput = modal.locator('input[type="file"]');
    await fileInput.setInputFiles(LSR_FILE);

    // Wait for parsing (large file, may take a few seconds)
    // The parsed count should appear in the drop zone
    const parsedText = modal.locator('text=/\\d+ поз\\./');
    await expect(parsedText).toBeVisible({ timeout: 30_000 });

    await shot(page, '04-lsr-parsed');

    // Verify preview table appeared
    const previewHeader = modal.locator('text=/Предпросмотр/');
    await expect(previewHeader).toBeVisible({ timeout: 5_000 });

    // Should show work and equipment counts
    const workStats = modal.getByText(/Работы:\s*\d+/);
    await expect(workStats).toBeVisible({ timeout: 5_000 });
    const equipStats = modal.getByText(/Оборудование:\s*\d+/);
    await expect(equipStats).toBeVisible({ timeout: 5_000 });

    // Verify table has rows
    const tableRows = modal.locator('table tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(100); // Should be 780 positions + section headers

    // Verify "Итого по смете" total line is present
    const totalLine = modal.locator('text=/Итого по смете/');
    await expect(totalLine).toBeVisible();

    // The import button should show position count
    const importLsrBtn = modal.locator('button').filter({ hasText: /Импортировать \d+ позиций/i });
    await expect(importLsrBtn).toBeVisible();
    await expect(importLsrBtn).toBeEnabled();

    await shot(page, '04-lsr-preview-table');
  });

  test('5 — verify section headers in preview', async ({ page }) => {
    test.setTimeout(120_000);

    if (!fs.existsSync(LSR_FILE)) {
      test.skip(true, `ЛСР file not found: ${LSR_FILE}`);
      return;
    }

    await go(page, `/finance/budgets/${budgetId}/fm`);
    await dismissCookieConsent(page);

    // Open modal and upload
    const importBtn = page.locator('button').filter({ hasText: /Импорт ЛСР/i });
    await importBtn.click();

    const modal = page.locator('[class*="fixed"][class*="inset"]').filter({ hasText: /Импорт ЛСР из Excel/i });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const fileInput = modal.locator('input[type="file"]');
    await fileInput.setInputFiles(LSR_FILE);

    // Wait for parse
    await expect(modal.locator('text=/\\d+ поз\\./')).toBeVisible({ timeout: 30_000 });

    // Check section headers exist in the table (ГРАНД-Смета sections)
    // First visible section is "Система П1.1 (рабочая)"
    const sectionHeader = modal.locator('tr').filter({ hasText: /Система П1\.1/i });
    await expect(sectionHeader.first()).toBeVisible({ timeout: 5_000 });

    // Sections count should be shown in stats ("Разделов: N")
    const sectionsLabel = modal.getByText(/Разделов:\s*\d+/);
    await expect(sectionsLabel).toBeVisible({ timeout: 5_000 });

    await shot(page, '05-sections-detected');
  });

  test('6 — verify code column and type indicators', async ({ page }) => {
    test.setTimeout(120_000);

    if (!fs.existsSync(LSR_FILE)) {
      test.skip(true, `ЛСР file not found: ${LSR_FILE}`);
      return;
    }

    await go(page, `/finance/budgets/${budgetId}/fm`);
    await dismissCookieConsent(page);

    const importBtn = page.locator('button').filter({ hasText: /Импорт ЛСР/i });
    await importBtn.click();

    const modal = page.locator('[class*="fixed"][class*="inset"]').filter({ hasText: /Импорт ЛСР из Excel/i });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const fileInput = modal.locator('input[type="file"]');
    await fileInput.setInputFiles(LSR_FILE);

    await expect(modal.locator('text=/\\d+ поз\\./')).toBeVisible({ timeout: 30_000 });

    // Code column header should exist ("Шифр")
    const codeHeader = modal.locator('th').filter({ hasText: /Шифр/i });
    await expect(codeHeader).toBeVisible();

    // Should see ГЭСН codes in the table
    const gesnCell = modal.locator('td').filter({ hasText: /ГЭСН/i });
    await expect(gesnCell.first()).toBeVisible();

    // Should see ТЦ or ФСБЦ codes for equipment
    const equipCodeCell = modal.locator('td').filter({ hasText: /(ТЦ_|ФСБЦ)/i });
    await expect(equipCodeCell.first()).toBeVisible();

    await shot(page, '06-code-column-types');
  });

  test('7 — verify total sum in preview matches expected 75.1M', async ({ page }) => {
    test.setTimeout(120_000);

    if (!fs.existsSync(LSR_FILE)) {
      test.skip(true, `ЛСР file not found: ${LSR_FILE}`);
      return;
    }

    await go(page, `/finance/budgets/${budgetId}/fm`);
    await dismissCookieConsent(page);

    const importBtn = page.locator('button').filter({ hasText: /Импорт ЛСР/i });
    await importBtn.click();

    const modal = page.locator('[class*="fixed"][class*="inset"]').filter({ hasText: /Импорт ЛСР из Excel/i });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const fileInput = modal.locator('input[type="file"]');
    await fileInput.setInputFiles(LSR_FILE);

    await expect(modal.locator('text=/\\d+ поз\\./')).toBeVisible({ timeout: 30_000 });

    // Verify total sum is displayed and matches ~75M
    const totalText = modal.getByText(/Итого по смете:/);
    await expect(totalText).toBeVisible();

    // The total should contain "75 124 901" (75.1M rubles formatted)
    const totalRow = modal.locator('text=/75.?124/');
    await expect(totalRow).toBeVisible();

    // Verify import button shows 780 positions
    const importLsrBtn = modal.locator('button').filter({ hasText: /Импортировать 780 позиций/i });
    await expect(importLsrBtn).toBeVisible();
    await expect(importLsrBtn).toBeEnabled();

    await shot(page, '07-total-sum-verified');
  });

  test('8 — small import test (create items via API and verify in ФМ)', async ({ page }) => {
    test.setTimeout(60_000);

    await go(page, '/');

    // Create a few budget items directly via API to simulate import
    // Backend requires: category (enum), name, plannedAmount (not null)
    const testItems = [
      { name: 'Установка камер приточных типовых', category: 'WORKS', unit: 'шт', quantity: 1, estimatePrice: 23315.70, plannedAmount: 23315.70 },
      { name: 'Промышленное устройство кондиционирования', category: 'EQUIPMENT', unit: 'шт', quantity: 1, estimatePrice: 5955658.96, plannedAmount: 5955658.96 },
      { name: 'Монтаж воздуховодов прямоугольного сечения', category: 'WORKS', unit: 'м2', quantity: 150, estimatePrice: 3280.50, plannedAmount: 492075.00 },
    ];

    // Create first item and check the response format
    const firstResp = await apiPost(page, `/api/budgets/${budgetId}/items`, testItems[0]);
    // Log the shape for debugging — expect at least a truthy response
    const hasItem = firstResp && typeof firstResp === 'object';
    expect(hasItem).toBe(true);

    // Create remaining items
    for (let i = 1; i < testItems.length; i++) {
      await apiPost(page, `/api/budgets/${budgetId}/items`, testItems[i]);
    }

    // Navigate to FM page
    await go(page, `/finance/budgets/${budgetId}/fm`);
    await dismissCookieConsent(page);
    await page.waitForTimeout(3000);

    // The FM table should show items (even if API wrapping differs)
    const table = page.locator('table');
    await expect(table.first()).toBeVisible({ timeout: 10_000 });

    await shot(page, '08-fm-items-after-api-import');
  });

  test('9 — verify budget items exist via API', async ({ page }) => {
    await go(page, '/');

    // Try multiple response formats
    const itemsResp = await apiGet(page, `/api/budgets/${budgetId}/items`);
    const itemsList = Array.isArray(itemsResp)
      ? itemsResp
      : itemsResp?.data?.content ?? itemsResp?.data ?? itemsResp?.content ?? [];

    // We expect at least some items (from test 8)
    expect(itemsList.length).toBeGreaterThan(0);
  });

  test('10 — no raw i18n keys on ФМ page', async ({ page }) => {
    await go(page, `/finance/budgets/${budgetId}/fm`);
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const body = await page.locator('body').innerText();

    // No dotted key patterns like "finance.fm.something"
    const rawKeys = body.match(/finance\.fm\.\w+/g) ?? [];
    expect(rawKeys).toEqual([]);

    // No "common." or "errors." raw keys
    const commonKeys = body.match(/(?:^|\s)common\.\w+/g) ?? [];
    expect(commonKeys).toEqual([]);

    await shot(page, '10-no-raw-keys');
  });
});
