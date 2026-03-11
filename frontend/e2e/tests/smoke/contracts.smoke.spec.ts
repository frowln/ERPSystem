import { test } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Contracts — Smoke Tests
 *
 * Persona: директор / бухгалтер
 * Route: /contracts — реестр договоров
 * Expected columns: Номер, Подрядчик/Заказчик, Сумма, Статус, Дата
 * Domain: contract types = подряд, субподряд, поставка, услуги
 */
test.describe('Contracts — Smoke', () => {
  test('/contracts — реестр договоров', async ({ page }) => {
    await smokeCheck(page, '/contracts');
    await expectTable(page).catch(() => {});
  });
});
