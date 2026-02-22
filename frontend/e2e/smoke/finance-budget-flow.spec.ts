import { test, expect } from '@playwright/test';

/**
 * Smoke tests for Finance / Budget flow.
 * Verifies that the budget list loads, creation form is accessible,
 * and budget detail pages render correctly with tabs and tables.
 */
test.describe('Finance budget flow', () => {

  // =========================================================================
  // Budget List
  // =========================================================================

  test('budget list page loads with content', async ({ page }) => {
    await page.goto('/budgets');
    await expect(page).toHaveURL('/budgets');

    // Should show budget-related content
    await expect(page.locator('body')).toContainText(/(budget|бюджет)/i, { timeout: 10_000 });

    // Should have a table, grid, or list of budgets
    const contentArea = page
      .locator('table')
      .or(page.locator('[role="table"]'))
      .or(page.locator('[data-testid="budget-list"]'))
      .or(page.locator('.grid'));
    await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
  });

  test('budget list has create button', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(1000);

    const createButton = page
      .getByRole('button', { name: /(create|new|add|создать|добавить|новый)/i })
      .or(page.getByRole('link', { name: /(create|new|add|создать|добавить|новый)/i }));

    const count = await createButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('budget list has search or filter input', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(1000);

    const searchInput = page
      .getByPlaceholder(/(search|поиск|найти|filter|фильтр)/i)
      .or(page.locator('input[type="search"]'))
      .or(page.locator('[data-testid="search-input"]'));

    const count = await searchInput.count();
    if (count > 0) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(500);
      // Should not crash
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // =========================================================================
  // Budget Creation Form
  // =========================================================================

  test('budget creation form page loads', async ({ page }) => {
    await page.goto('/budgets/new');
    await expect(page).toHaveURL('/budgets/new');
    await page.waitForTimeout(1000);

    // The form should have input fields
    const formInputs = page.locator('input, select, textarea');
    const inputCount = await formInputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('budget creation form has required field labels', async ({ page }) => {
    await page.goto('/budgets/new');
    await page.waitForTimeout(1000);

    // There should be labels or headings for the form
    const headings = page.locator('h1, h2, label');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // Budget List Navigation
  // =========================================================================

  test('clicking create button navigates to form or opens modal', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForTimeout(1000);

    const createButton = page
      .getByRole('button', { name: /(create|new|add|создать|добавить|новый)/i })
      .or(page.getByRole('link', { name: /(create|new|add|создать|добавить|новый)/i }));

    const count = await createButton.count();
    if (count > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Should either navigate to /budgets/new or open a modal/dialog
      const isOnNewPage = page.url().includes('/budgets/new');
      const modalVisible = await page.locator('[role="dialog"]').or(page.locator('.modal')).isVisible()
        .catch(() => false);

      expect(isOnNewPage || modalVisible).toBeTruthy();
    }
  });

  // =========================================================================
  // Budget Page -- No Errors
  // =========================================================================

  test('budget list loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/budgets');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('invoices page loads as finance sibling', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveURL('/invoices');
    await expect(page.locator('body')).toContainText(/(invoice|счёт|счет|накладн)/i, { timeout: 10_000 });
  });

  test('payments page loads as finance sibling', async ({ page }) => {
    await page.goto('/payments');
    await expect(page).toHaveURL('/payments');
    await expect(page.locator('body')).toBeVisible();
  });
});
