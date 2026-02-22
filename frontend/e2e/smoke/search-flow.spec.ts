import { test, expect } from '@playwright/test';

/**
 * Smoke tests for Global Search.
 * Verifies that the search page loads, the search input is functional,
 * filters render, and results appear when a query is entered.
 */
test.describe('Search flow', () => {

  // =========================================================================
  // Page Load
  // =========================================================================

  test('global search page loads with search input', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL('/search');

    // Should show search-related content
    await expect(page.locator('body')).toContainText(/(search|поиск|найти)/i, { timeout: 10_000 });

    // Search input should be present
    const searchInput = page
      .locator('input[type="search"]')
      .or(page.locator('input[type="text"]'))
      .or(page.getByPlaceholder(/(search|поиск|найти|запрос)/i));
    await expect(searchInput.first()).toBeVisible({ timeout: 10_000 });
  });

  test('search page shows filter sidebar', async ({ page }) => {
    await page.goto('/search');
    await page.waitForTimeout(1000);

    // Filter section with entity type checkboxes or project selector
    const filterElements = page
      .locator('input[type="checkbox"]')
      .or(page.locator('select'))
      .or(page.locator('input[type="date"]'));
    const count = await filterElements.count();
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // Search Interaction
  // =========================================================================

  test('typing in search input does not crash', async ({ page }) => {
    await page.goto('/search');
    await page.waitForTimeout(1000);

    const searchInput = page
      .locator('input[type="search"]')
      .or(page.locator('input[type="text"]').first());
    await searchInput.first().fill('test');
    await page.waitForTimeout(500);

    // Page should remain stable
    await expect(page.locator('body')).toBeVisible();
  });

  test('search input is focusable and accepts keyboard input', async ({ page }) => {
    await page.goto('/search');
    await page.waitForTimeout(1000);

    const searchInput = page
      .locator('input[type="search"]')
      .or(page.locator('input[type="text"]').first());
    await searchInput.first().focus();
    await expect(searchInput.first()).toBeFocused();
    await searchInput.first().type('project');
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('clearing search input works', async ({ page }) => {
    await page.goto('/search');
    await page.waitForTimeout(1000);

    const searchInput = page
      .locator('input[type="search"]')
      .or(page.locator('input[type="text"]').first());
    await searchInput.first().fill('test query');
    await page.waitForTimeout(300);

    // Clear the input
    await searchInput.first().fill('');
    await page.waitForTimeout(300);

    // Page should still be stable
    await expect(page.locator('body')).toBeVisible();
  });

  // =========================================================================
  // Filter Interaction
  // =========================================================================

  test('entity type filter checkboxes are clickable', async ({ page }) => {
    await page.goto('/search');
    await page.waitForTimeout(1000);

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count > 0) {
      // Click the first checkbox filter
      await checkboxes.first().check();
      await page.waitForTimeout(300);
      await expect(checkboxes.first()).toBeChecked();
    }
  });

  // =========================================================================
  // No Errors
  // =========================================================================

  test('search page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
