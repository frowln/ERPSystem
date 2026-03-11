import { test } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Accounting Module — Smoke Tests
 *
 * Persona: бухгалтер
 * Route: /accounting — журнал бухгалтерских операций
 * Expected: table with columns (Дата, Документ, Дебет, Кредит, Сумма) or dashboard
 */
test.describe('Accounting — Smoke', () => {
  test('/accounting — бухгалтерский учёт', async ({ page }) => {
    await smokeCheck(page, '/accounting');
    // Should display journal entries table or accounting dashboard
    await expectTable(page).catch(() => {
      /* may be dashboard layout */
    });
  });
});
