import { test, expect } from '@playwright/test';

test.describe('Estimates normative and pricing flow', () => {
  test('pricing routes and minstroy page are accessible', async ({ page }) => {
    await page.goto('/estimates/pricing/databases');
    await expect(page).toHaveURL('/estimates/pricing/databases');
    await expect(page.locator('body')).toContainText(/pricing|расцен|баз/i, { timeout: 10_000 });

    await page.goto('/estimates/pricing/rates');
    await expect(page).toHaveURL('/estimates/pricing/rates');
    await expect(page.locator('body')).toContainText(/rates|расцен/i, { timeout: 10_000 });

    await page.goto('/estimates/pricing/calculate');
    await expect(page).toHaveURL('/estimates/pricing/calculate');
    await expect(page.locator('body')).toContainText(/calculator|калькулятор|indices|индекс/i, { timeout: 10_000 });

    await page.goto('/estimates/minstroy');
    await expect(page).toHaveURL('/estimates/minstroy');
    await expect(page.locator('body')).toContainText(/minstroy|минстрой|индекс/i, { timeout: 10_000 });
  });

  test('legacy pricing aliases redirect to estimates pricing module', async ({ page }) => {
    await page.goto('/pricing/databases');
    await expect(page).toHaveURL('/estimates/pricing/databases');

    await page.goto('/pricing/rates');
    await expect(page).toHaveURL('/estimates/pricing/rates');

    await page.goto('/pricing/calculate');
    await expect(page).toHaveURL('/estimates/pricing/calculate');
  });
});
