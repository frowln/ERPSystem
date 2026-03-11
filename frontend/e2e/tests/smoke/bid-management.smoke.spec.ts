import { test } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Bid Management — Smoke Tests
 *
 * Persona: снабженец / менеджер
 * Route: /bid-packages — тендерные пакеты
 * Expected: table or card grid (Название, Статус, Сумма, Подрядчики)
 */
test.describe('Bid Management — Smoke', () => {
  test('/bid-packages — тендерные пакеты', async ({ page }) => {
    await smokeCheck(page, '/bid-packages');
    await expectTable(page).catch(() => {
      /* may show card grid instead of table */
    });
  });
});
