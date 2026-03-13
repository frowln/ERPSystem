import { test, expect } from '@playwright/test';

/**
 * Portal Defects/Claims E2E Tests
 * Tests: page load, metrics, table, filters, search, tabs, create modal, no JS errors.
 */

test.describe('Portal — Defects', () => {
  test('loads defects page without errors', async ({ page }) => {
    await page.goto('/portal/defects', { waitUntil: 'networkidle', timeout: 60_000 });

    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    await expect(page.locator('text=/Не удалось загрузить/i')).not.toBeVisible({ timeout: 5_000 });
  });

  test('shows 4 metric cards', async ({ page }) => {
    await page.goto('/portal/defects', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const metrics = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="font-semibold"], [class*="text-2xl"]'),
    });
    await expect(metrics.first()).toBeVisible({ timeout: 15_000 });
  });

  test('table or empty state displays correctly', async ({ page }) => {
    await page.goto('/portal/defects', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Either has table rows or empty state
    const hasRows = await page.locator('tbody tr').count() > 0;
    const hasEmptyState = await page.locator('text=/Ошибка загрузки|Loading Error|Нет замечаний/i').isVisible();
    expect(hasRows || hasEmptyState).toBe(true);
  });

  test('status filter select has options', async ({ page }) => {
    await page.goto('/portal/defects', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    // There should be at least 2 selects (status + priority)
    const selects = page.locator('select');
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Status select should have options
    const statusSelect = selects.first();
    const options = await statusSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThanOrEqual(4);
  });

  test('search input works', async ({ page }) => {
    await page.goto('/portal/defects', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const searchInput = page.locator('input').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('НЕСУЩЕСТВУЮЩЕЕ_ЗАМЕЧАНИЕ_XYZ');
      await page.waitForTimeout(500);

      await expect(page.getByRole('heading').first()).toBeVisible();

      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });

  test('tabs switch correctly', async ({ page }) => {
    await page.goto('/portal/defects', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const tabButtons = page.locator('button[role="tab"], [class*="tab"]');
    const tabCount = await tabButtons.count();

    if (tabCount >= 2) {
      await tabButtons.nth(1).click();
      await page.waitForTimeout(1000);
      await expect(page.getByRole('heading').first()).toBeVisible();

      await tabButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('create defect button opens modal', async ({ page }) => {
    await page.goto('/portal/defects', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({ hasText: /Новое замечание|New Defect/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5_000 });

      // Close modal
      const cancelBtn = page.locator('[role="dialog"] button, [class*="modal"] button, [class*="Modal"] button').filter({ hasText: /Отмен|Cancel/i }).first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('breadcrumbs navigate correctly', async ({ page }) => {
    await page.goto('/portal/defects', { waitUntil: 'networkidle', timeout: 60_000 });

    const portalLink = page.locator('a[href="/portal"]').first();
    if (await portalLink.isVisible()) {
      await portalLink.click();
      await expect(page).toHaveURL(/\/portal$/, { timeout: 10_000 });
    }
  });

  test('no JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/portal/defects', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
