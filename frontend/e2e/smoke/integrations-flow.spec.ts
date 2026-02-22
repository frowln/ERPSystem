import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the Integrations hub.
 * Verifies that the integrations dashboard renders cards, individual
 * integration pages load, and the Gov Registries sub-page works.
 */
test.describe('Integrations flow', () => {

  // =========================================================================
  // Integrations Dashboard
  // =========================================================================

  test('integrations dashboard page loads with cards', async ({ page }) => {
    await page.goto('/integrations');
    await expect(page).toHaveURL('/integrations');

    // Should show integration-related content
    await expect(page.locator('body')).toContainText(/(integrat|интеграц)/i, { timeout: 10_000 });

    // Cards are rendered in a grid
    const cards = page.locator('[class*="card"]').or(page.locator('[class*="grid"] > div'));
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('integrations dashboard shows status badges', async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForTimeout(1500);

    // Each card should have a status indicator (StatusBadge or similar)
    const statusElements = page
      .locator('[class*="badge"]')
      .or(page.locator('[class*="status"]'))
      .or(page.locator('[class*="chip"]'));
    const count = await statusElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('integrations dashboard shows metric summary cards', async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForTimeout(1500);

    // Metric/summary area at the top
    const metricArea = page
      .locator('[data-testid="metric-card"]')
      .or(page.locator('[class*="metric"]'))
      .or(page.locator('.grid.grid-cols-1.sm\\:grid-cols-3'));
    const count = await metricArea.count();
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // Navigate into Gov Registries
  // =========================================================================

  test('can navigate to Gov Registries page', async ({ page }) => {
    await page.goto('/integrations/gov-registries');
    await expect(page).toHaveURL('/integrations/gov-registries');
    await expect(page.locator('body')).toContainText(/(реестр|registr|проверк|check)/i, { timeout: 10_000 });
  });

  test('Gov Registries page shows data table or content area', async ({ page }) => {
    await page.goto('/integrations/gov-registries');
    await page.waitForTimeout(1500);

    const contentArea = page
      .locator('table')
      .or(page.locator('[role="table"]'))
      .or(page.locator('[data-testid="registry-list"]'))
      .or(page.locator('.grid'));
    await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
  });

  test('Gov Registries page has metric cards or summary', async ({ page }) => {
    await page.goto('/integrations/gov-registries');
    await page.waitForTimeout(1500);

    const metricElements = page
      .locator('[data-testid="metric-card"]')
      .or(page.locator('[class*="metric"]'))
      .or(page.locator('[class*="card"]'));
    const count = await metricElements.count();
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // Navigate into other integration pages
  // =========================================================================

  test('Telegram integration page loads', async ({ page }) => {
    await page.goto('/integrations/telegram');
    await expect(page).toHaveURL('/integrations/telegram');
    await expect(page.locator('body')).toContainText(/(telegram|телеграм|бот|bot)/i, { timeout: 10_000 });
  });

  test('1C integration page loads', async ({ page }) => {
    await page.goto('/integrations/1c');
    await expect(page).toHaveURL('/integrations/1c');
    await expect(page.locator('body')).toBeVisible();
  });

  test('SMS integration page loads', async ({ page }) => {
    await page.goto('/integrations/sms');
    await expect(page).toHaveURL('/integrations/sms');
    await expect(page.locator('body')).toBeVisible();
  });
});
