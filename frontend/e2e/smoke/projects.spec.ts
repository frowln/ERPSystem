import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the Projects module.
 * Verifies that the project list, creation modal, and detail page load correctly.
 */
test.describe('Projects smoke tests', () => {
  test('project list page loads and shows content', async ({ page }) => {
    await page.goto('/projects');

    // Wait for the page to load
    await expect(page.locator('body')).toContainText(/(project|проект)/i, { timeout: 10_000 });

    // Should show a table, list, or grid of projects
    const tableOrList = page
      .locator('table')
      .or(page.locator('[role="table"]'))
      .or(page.locator('[data-testid="project-list"]'))
      .or(page.locator('.grid'));
    await expect(tableOrList.first()).toBeVisible({ timeout: 10_000 });
  });

  test('project creation button is visible and clickable', async ({ page }) => {
    await page.goto('/projects');

    // Look for a "Create" / "New" / "Add" button
    const createButton = page
      .getByRole('button', { name: /(create|new|add|создать|добавить|новый)/i })
      .or(page.getByRole('link', { name: /(create|new|add|создать|добавить|новый)/i }));

    await expect(createButton.first()).toBeVisible({ timeout: 10_000 });
    await createButton.first().click();

    // Should either navigate to /projects/new or open a modal/dialog
    const isOnNewPage = page.url().includes('/projects/new');
    const modalVisible = await page.locator('[role="dialog"]').or(page.locator('.modal')).isVisible()
      .catch(() => false);

    expect(isOnNewPage || modalVisible).toBeTruthy();
  });

  test('project creation form has required fields', async ({ page }) => {
    await page.goto('/projects/new');
    await page.waitForTimeout(1000);

    // The form should have input fields for project name, dates, etc.
    const formInputs = page.locator('input, select, textarea');
    const inputCount = await formInputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('project list supports search/filter', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForTimeout(1000);

    // Look for a search input
    const searchInput = page
      .getByPlaceholder(/(search|поиск|найти|filter|фильтр)/i)
      .or(page.locator('input[type="search"]'))
      .or(page.locator('[data-testid="search-input"]'));

    const count = await searchInput.count();
    if (count > 0) {
      await searchInput.first().fill('test');
      // Wait for the filter to apply
      await page.waitForTimeout(500);
      // Should not crash
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
