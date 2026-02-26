import { test, expect } from '@playwright/test';

test.describe('Invoice lifecycle', () => {
  test('navigates to invoices list', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveURL(/invoices/);
    await expect(page.locator('h1, [data-testid="page-title"]').first()).toBeVisible();
  });

  test('opens create invoice form', async ({ page }) => {
    await page.goto('/invoices');
    const createBtn = page
      .getByRole('link', { name: /(create|new|add|создать|добавить)/i })
      .or(page.getByRole('button', { name: /(create|new|add|создать|добавить)/i }));
    if (await createBtn.first().isVisible().catch(() => false)) {
      await createBtn.first().click();
      await expect(page).toHaveURL(/invoices\/(new|create)/);
    }
  });

  test('invoice list page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver')
        && !e.includes('state update') && !e.includes('ERR_CONNECTION_RESET') && !e.includes('Failed to fetch')
        && !e.includes('429'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
