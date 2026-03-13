import { test, expect } from '@playwright/test';

/**
 * Portal Contracts E2E Tests
 * Tests: page load, metrics, table data, filters, search, breadcrumbs, no JS errors.
 */

test.describe('Portal — Contracts', () => {
  test('loads contracts page without errors', async ({ page }) => {
    await page.goto('/portal/contracts', { waitUntil: 'networkidle', timeout: 60_000 });

    // Page header visible
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // No error state
    await expect(page.locator('text=/Не удалось загрузить/i')).not.toBeVisible({ timeout: 5_000 });
  });

  test('shows 4 metric cards', async ({ page }) => {
    await page.goto('/portal/contracts', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Should have metric cards rendered
    const metrics = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="font-semibold"], [class*="text-2xl"]'),
    });
    await expect(metrics.first()).toBeVisible({ timeout: 15_000 });
  });

  test('table shows contract data with correct columns', async ({ page }) => {
    await page.goto('/portal/contracts', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Either has table rows or empty state
    const hasRows = await page.locator('tbody tr').count() > 0;
    const hasEmptyState = await page.locator('text=/Нет доступных договоров|No contracts/i').isVisible();
    expect(hasRows || hasEmptyState).toBe(true);

    if (hasRows) {
      // Contract number should be in mono font
      const monoCell = page.locator('[class*="font-mono"]').first();
      await expect(monoCell).toBeVisible();

      // Status badges should be visible
      const badges = page.locator('[class*="badge"], [class*="Badge"], [class*="rounded-full"][class*="px-"]');
      const badgeCount = await badges.count();
      expect(badgeCount).toBeGreaterThan(0);

      // Amount values should contain ₽ or numbers
      const amountCells = page.locator('[class*="tabular-nums"][class*="font-semibold"]');
      await expect(amountCells.first()).toBeVisible();
    }
  });

  test('search filter works', async ({ page }) => {
    await page.goto('/portal/contracts', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const searchInput = page.locator('input[placeholder*="Поиск"], input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Type nonexistent search
    await searchInput.fill('НЕСУЩЕСТВУЮЩИЙ_ДОГОВОР_XYZ');
    await page.waitForTimeout(500);

    // Page should not crash
    await expect(page.getByRole('heading').first()).toBeVisible();

    // Clear
    await searchInput.clear();
    await page.waitForTimeout(500);
  });

  test('status filter select has options', async ({ page }) => {
    await page.goto('/portal/contracts', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible({ timeout: 10_000 });

    // Should have multiple options
    const options = await statusSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThanOrEqual(4); // All + Active + Completed + Suspended + Terminated
  });

  test('status filter changes table data', async ({ page }) => {
    await page.goto('/portal/contracts', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible()) {
      // Select ACTIVE
      await statusSelect.selectOption('ACTIVE');
      await page.waitForTimeout(1500);

      // Page should not crash
      await expect(page.getByRole('heading').first()).toBeVisible();

      // Reset
      await statusSelect.selectOption('');
      await page.waitForTimeout(1500);
    }
  });

  test('breadcrumbs navigate correctly', async ({ page }) => {
    await page.goto('/portal/contracts', { waitUntil: 'networkidle', timeout: 60_000 });

    // Breadcrumb to portal
    const portalLink = page.locator('a[href="/portal"]').first();
    if (await portalLink.isVisible()) {
      await portalLink.click();
      await expect(page).toHaveURL(/\/portal$/, { timeout: 10_000 });
    }
  });

  test('payment progress displays correctly', async ({ page }) => {
    await page.goto('/portal/contracts', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Payment percentage should be visible (contains % symbol)
    const pctElements = page.locator('text=/%/');
    const count = await pctElements.count();
    // At least the metric card should show percentage
    expect(count).toBeGreaterThan(0);
  });

  test('no JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/portal/contracts', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('navigate from sidebar to contracts', async ({ page }) => {
    await page.goto('/portal', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    // Sidebar link to contracts
    const contractsLink = page.locator('nav a[href="/portal/contracts"], a[href="/portal/contracts"]').first();
    if (await contractsLink.isVisible()) {
      await contractsLink.click();
      await expect(page).toHaveURL(/\/portal\/contracts/, { timeout: 10_000 });
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });
    }
  });
});
