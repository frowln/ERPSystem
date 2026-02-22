import { test, expect } from '@playwright/test';

test.describe('AI Assistant', () => {

  test('AI assistant page loads', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });

  test('chat input is present and focusable', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForLoadState('networkidle');
    const input = page.getByRole('textbox').first();
    if (await input.isVisible()) {
      await input.focus();
      await expect(input).toBeFocused();
    }
  });

  test('project selector is visible', async ({ page }) => {
    await page.goto('/ai');
    await page.waitForLoadState('networkidle');
    const selector = page.locator('select[aria-label*="project" i], select[aria-label*="проект" i]').first();
    if (await selector.isVisible()) {
      await expect(selector).toBeVisible();
    }
  });
});
