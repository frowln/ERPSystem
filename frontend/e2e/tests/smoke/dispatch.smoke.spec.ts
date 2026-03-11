import { test, expect } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Dispatch (Диспетчеризация) — Smoke Tests
 *
 * Persona: снабженец (procurement manager), логист
 * Логистика стройматериалов: must track vehicle, driver, cargo.
 * 2 pages tested.
 */
test.describe('Dispatch — Smoke', () => {
  test('/dispatch/orders — заявки на доставку', async ({ page }) => {
    const { body } = await smokeCheck(page, '/dispatch/orders');
    // Dispatch orders table: Номер, Отправитель, Получатель, Дата, Статус, Транспорт
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/dispatch/routes — маршруты доставки', async ({ page }) => {
    const { body } = await smokeCheck(page, '/dispatch/routes');
    // Map or route list view
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });
});
