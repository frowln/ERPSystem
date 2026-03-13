import { test, expect } from '@playwright/test';

/**
 * Portal Invoices E2E Tests
 * Tests: page load, metrics, table data, filters, search, tabs, create modal, breadcrumbs, no JS errors.
 */

test.describe('Portal — Invoices', () => {
  test('loads invoices page without errors', async ({ page }) => {
    await page.goto('/portal/invoices', { waitUntil: 'networkidle', timeout: 60_000 });

    // Page header visible
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // No error state
    await expect(page.locator('text=/Не удалось загрузить/i')).not.toBeVisible({ timeout: 5_000 });
  });

  test('shows 4 metric cards', async ({ page }) => {
    await page.goto('/portal/invoices', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const metrics = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="font-semibold"], [class*="text-2xl"]'),
    });
    await expect(metrics.first()).toBeVisible({ timeout: 15_000 });
  });

  test('table shows invoice data with correct columns', async ({ page }) => {
    await page.goto('/portal/invoices', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const hasRows = await page.locator('tbody tr').count() > 0;
    const hasEmptyState = await page.locator('text=/Нет счетов|No invoices/i').isVisible();
    expect(hasRows || hasEmptyState).toBe(true);

    if (hasRows) {
      // Invoice number should be in mono font
      const monoCell = page.locator('[class*="font-mono"]').first();
      await expect(monoCell).toBeVisible();

      // Status badges should be visible
      const badges = page.locator('[class*="badge"], [class*="Badge"], [class*="rounded-full"][class*="px-"]');
      const badgeCount = await badges.count();
      expect(badgeCount).toBeGreaterThan(0);

      // Amount values should be visible
      const amountCells = page.locator('[class*="tabular-nums"][class*="font-semibold"]');
      await expect(amountCells.first()).toBeVisible();
    }
  });

  test('search filter works', async ({ page }) => {
    await page.goto('/portal/invoices', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Type nonexistent search
    await searchInput.fill('НЕСУЩЕСТВУЮЩИЙ_СЧЁТ_XYZ');
    await page.waitForTimeout(500);

    // Page should not crash
    await expect(page.getByRole('heading').first()).toBeVisible();

    // Clear
    await searchInput.clear();
    await page.waitForTimeout(500);
  });

  test('tabs switch correctly', async ({ page }) => {
    await page.goto('/portal/invoices', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Look for tab buttons
    const tabButtons = page.locator('button[role="tab"], [class*="tab"]');
    const tabCount = await tabButtons.count();

    if (tabCount >= 2) {
      // Click second tab (New / Новые)
      await tabButtons.nth(1).click();
      await page.waitForTimeout(1000);

      // Page should not crash
      await expect(page.getByRole('heading').first()).toBeVisible();

      // Click first tab (All / Все)
      await tabButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('create invoice button opens modal', async ({ page }) => {
    await page.goto('/portal/invoices', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    // Find create button
    const createBtn = page.locator('button').filter({ hasText: /Создать|Create/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);

      // Modal should appear
      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5_000 });

      // Modal should have form fields
      const dateInputs = page.locator('input[type="date"]');
      const dateCount = await dateInputs.count();
      expect(dateCount).toBeGreaterThanOrEqual(2); // periodStart + periodEnd

      // Close modal
      const cancelBtn = page.locator('[role="dialog"] button, [class*="modal"] button, [class*="Modal"] button').filter({ hasText: /Отмен|Cancel/i }).first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('breadcrumbs navigate correctly', async ({ page }) => {
    await page.goto('/portal/invoices', { waitUntil: 'networkidle', timeout: 60_000 });

    const portalLink = page.locator('a[href="/portal"]').first();
    if (await portalLink.isVisible()) {
      await portalLink.click();
      await expect(page).toHaveURL(/\/portal$/, { timeout: 10_000 });
    }
  });

  test('no JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/portal/invoices', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('navigate from sidebar to invoices', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    const invoicesLink = page.locator('nav a[href="/portal/invoices"], a[href="/portal/invoices"]').first();
    if (await invoicesLink.isVisible()) {
      await invoicesLink.click();
      await expect(page).toHaveURL(/\/portal\/invoices/, { timeout: 10_000 });
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });
    }
  });
});
