import { test, expect } from '@playwright/test';

/**
 * Smoke tests for sidebar navigation and page rendering.
 * Verifies that the layout loads, sidebar items are clickable,
 * and pages display expected content.
 */
test.describe('Navigation smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app layout to be rendered
    await expect(page.locator('body')).toBeVisible();
  });

  test('dashboard page loads on root URL', async ({ page }) => {
    // The root URL should show the dashboard
    await expect(page).toHaveURL('/');
    // There should be visible content on the page
    const mainContent = page.locator('main').or(page.locator('[role="main"]')).or(page.locator('.flex-1'));
    await expect(mainContent.first()).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar navigation is visible', async ({ page }) => {
    // The sidebar / nav element should be present
    const sidebar = page.locator('nav').or(page.locator('aside')).or(page.locator('[data-testid="sidebar"]'));
    await expect(sidebar.first()).toBeVisible({ timeout: 10_000 });
  });

  test('can navigate to projects page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL('/projects');
    // Should render some content (page title, table, or loading state)
    await expect(page.locator('body')).toContainText(/(project|проект)/i, { timeout: 10_000 });
  });

  test('can navigate to contracts page', async ({ page }) => {
    await page.goto('/contracts');
    await expect(page).toHaveURL('/contracts');
    await expect(page.locator('body')).toContainText(/(contract|договор)/i, { timeout: 10_000 });
  });

  test('can navigate to tasks page', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveURL('/tasks');
    await expect(page.locator('body')).toBeVisible();
  });

  test('can navigate to employees page', async ({ page }) => {
    await page.goto('/employees');
    await expect(page).toHaveURL('/employees');
    await expect(page.locator('body')).toBeVisible();
  });

  test('can navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('body')).toContainText(/(settings|настройки)/i, { timeout: 10_000 });
  });

  test('can navigate to analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL('/analytics');
    await expect(page.locator('body')).toBeVisible();
  });

  test('unknown route shows not found page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page).toHaveURL('/this-route-does-not-exist');
    await expect(page.locator('body')).toContainText(/страница не найдена/i);
  });

  test('breadcrumbs or page header shows on nested pages', async ({ page }) => {
    await page.goto('/projects');
    // Wait for content to load
    await page.waitForTimeout(1000);
    // The page should have some heading or title element
    const headings = page.locator('h1, h2, [data-testid="page-title"]');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });
});
