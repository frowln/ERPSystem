import { expect, test } from '@playwright/test';

test.describe('Confirm dialog accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/operations/work-orders/1');
    await expect(page.getByRole('button', { name: 'Удалить' })).toBeVisible();
  });

  test('opens with proper dialog semantics', async ({ page }) => {
    await page.getByRole('button', { name: 'Удалить' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Удалить наряд?');
    await expect(dialog).toContainText('Затрагиваемые объекты');
    await expect(dialog).toContainText('WO-2026-0078');
    await expect(dialog.getByRole('button', { name: 'Отмена' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Удалить наряд' })).toBeVisible();
  });

  test('traps keyboard focus inside dialog and restores trigger focus on close', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: 'Удалить' });
    await deleteButton.focus();
    await expect(deleteButton).toBeFocused();

    await deleteButton.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const isFocusInsideDialog = await page.evaluate(() => {
        const active = document.activeElement;
        const modal = document.querySelector('[role="dialog"]');
        return Boolean(active && modal && modal.contains(active));
      });
      expect(isFocusInsideDialog).toBeTruthy();
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(deleteButton).toBeFocused();
  });
});
