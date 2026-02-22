import { test, expect } from '@playwright/test';

test.describe('BIM Models', () => {

  test('BIM models list page loads', async ({ page }) => {
    await page.goto('/bim');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });

  test('BIM model detail page renders viewer area', async ({ page }) => {
    await page.goto('/bim');
    await page.waitForLoadState('networkidle');
    const firstModel = page.getByRole('link').filter({ hasText: /.ifc|BIM|model/i }).first();
    if (await firstModel.isVisible()) {
      await firstModel.click();
      await page.waitForLoadState('networkidle');
      // Viewer container or metadata should be visible
      const viewerOrMetadata = page.locator(
        '[data-testid="bim-viewer"], canvas, [class*="viewer"], table',
      ).first();
      await expect(viewerOrMetadata).toBeVisible({ timeout: 15000 });
    }
  });
});
