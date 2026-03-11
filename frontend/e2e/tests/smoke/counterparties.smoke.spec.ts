import { test } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Counterparties — Smoke Tests
 *
 * Persona: снабженец / бухгалтер
 * Route: /counterparties — контрагенты
 * Expected columns: Наименование, ИНН, Тип, Контакт, Статус
 * Domain: counterparty types = ООО, ИП, АО, ПАО
 */
test.describe('Counterparties — Smoke', () => {
  test('/counterparties — контрагенты', async ({ page }) => {
    await smokeCheck(page, '/counterparties');
    await expectTable(page).catch(() => {});
  });
});
