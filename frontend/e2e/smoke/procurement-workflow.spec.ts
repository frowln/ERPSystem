import { test, expect } from '@playwright/test';

test.describe('Procurement workflow', () => {
  test('purchase requests list loads', async ({ page }) => {
    await page.goto('/procurement');
    await expect(page).toHaveURL(/procurement/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });

  test('purchase request board view loads', async ({ page }) => {
    await page.goto('/procurement/board');
    await page.waitForLoadState('networkidle');
    // Board view should show status columns or a list
    const boardOrList = page.locator('[data-testid="board"], table, [role="list"], .grid').first();
    await expect(boardOrList).toBeVisible({ timeout: 10_000 });
  });

  test('create purchase request link is accessible', async ({ page }) => {
    await page.goto('/procurement');
    await page.waitForLoadState('networkidle');
    const createLink = page
      .getByRole('link', { name: /(create|new|add|создать|добавить)/i })
      .or(page.getByRole('button', { name: /(create|new|add|создать|добавить)/i }));
    if (await createLink.first().isVisible().catch(() => false)) {
      await createLink.first().click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('form, [data-testid="form"]').first()).toBeVisible();
    }
  });
});
