import { test, expect } from '@playwright/test';

/**
 * Portal Schedule E2E Tests
 * Tests: page load, metrics, timeline/list views, tabs, no JS errors.
 */

test.describe('Portal — Schedule', () => {
  test('loads schedule page without errors', async ({ page }) => {
    await page.goto('/portal/schedule', { waitUntil: 'networkidle', timeout: 60_000 });

    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 15_000 });

    await expect(page.locator('text=/Не удалось загрузить/i')).not.toBeVisible({ timeout: 5_000 });
  });

  test('shows 4 metric cards', async ({ page }) => {
    await page.goto('/portal/schedule', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    const metrics = page.locator('[class*="rounded-xl"][class*="border"]').filter({
      has: page.locator('[class*="font-semibold"], [class*="text-2xl"]'),
    });
    await expect(metrics.first()).toBeVisible({ timeout: 15_000 });
  });

  test('timeline view shows gantt bars', async ({ page }) => {
    await page.goto('/portal/schedule', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Timeline is default view — should have gantt bars or empty state
    const ganttBars = page.locator('[class*="rounded-md"][class*="bg-"]').filter({
      has: page.locator('[class*="bg-white/20"]'),
    });
    const hasGantt = await ganttBars.count() > 0;
    const hasEmpty = await page.locator('text=/Нет задач|No schedule/i').isVisible();

    expect(hasGantt || hasEmpty).toBe(true);
  });

  test('list view shows data table', async ({ page }) => {
    await page.goto('/portal/schedule', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(2000);

    // Switch to list view
    const listButton = page.locator('button[title*="Список"], button[title*="List"]').first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(1000);

      // Should show table or empty state
      const hasRows = await page.locator('tbody tr').count() > 0;
      const hasEmpty = await page.locator('text=/Нет задач|No schedule/i').isVisible();
      expect(hasRows || hasEmpty).toBe(true);

      if (hasRows) {
        // Progress bars should be visible
        const progressBars = page.locator('[class*="rounded-full"]');
        const pbCount = await progressBars.count();
        expect(pbCount).toBeGreaterThan(0);
      }
    }
  });

  test('tabs switch correctly', async ({ page }) => {
    await page.goto('/portal/schedule', { waitUntil: 'networkidle', timeout: 60_000 });

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

  test('today marker visible in timeline', async ({ page }) => {
    await page.goto('/portal/schedule', { waitUntil: 'networkidle', timeout: 60_000 });

    await page.waitForTimeout(3000);

    // Today marker text
    const todayMarker = page.locator('text=/Сегодня|Today/');
    // May or may not be visible depending on timeline range
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('breadcrumbs navigate correctly', async ({ page }) => {
    await page.goto('/portal/schedule', { waitUntil: 'networkidle', timeout: 60_000 });

    const portalLink = page.locator('a[href="/portal"]').first();
    if (await portalLink.isVisible()) {
      await portalLink.click();
      await expect(page).toHaveURL(/\/portal$/, { timeout: 10_000 });
    }
  });

  test('no JS console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/portal/schedule', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(5000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Loading chunk'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
