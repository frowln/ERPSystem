import { expect, test } from '@playwright/test';

test.describe('DataTable accessibility smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('table')).toBeVisible({ timeout: 15_000 });
  });

  test('toolbar controls expose accessible labels', async ({ page }) => {
    await expect(page.getByLabel('Изменить плотность таблицы')).toBeVisible();
    await expect(page.getByLabel('Показать выбор столбцов')).toBeVisible();
    await expect(page.getByLabel('Экспортировать таблицу в CSV')).toBeVisible();

    await page.getByLabel('Показать выбор столбцов').click();
    await expect(page.locator('body')).toContainText('Столбцы');
    await expect(page.getByLabel('Скрыть выбор столбцов')).toBeVisible();
  });

  test('row selection checkboxes and bulk toolbar are keyboard/screen-reader friendly', async ({ page }) => {
    const rowCheckbox = page.locator('input[type="checkbox"][aria-label^="Выбрать строку"]').first();
    await expect(rowCheckbox).toBeVisible();
    await rowCheckbox.check();

    await expect(page.locator('body')).toContainText('Выбрано: 1');
    await expect(page.getByLabel('Снять выделение со строк')).toBeVisible();
  });

  test('sortable headers expose and update aria-sort state', async ({ page }) => {
    const sortableHeader = page.locator('th[aria-sort]').first();
    await expect(sortableHeader).toHaveAttribute('aria-sort', /(none|ascending|descending)/);

    await sortableHeader.click();
    await expect(sortableHeader).toHaveAttribute('aria-sort', /(ascending|descending)/);
  });
});
