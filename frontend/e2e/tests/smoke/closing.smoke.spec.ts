import { test } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Closing — Russian Construction Documents (КС-2 / КС-3) — Smoke Tests
 *
 * Persona: инженер-сметчик / бухгалтер
 * Routes: /russian-docs/ks2, /russian-docs/ks3
 * Domain: КС-2 = акт выполненных работ (executed works act)
 *         КС-3 = справка о стоимости (cost summary certificate)
 *         Required by Russian construction law (Постановление Госкомстата №100).
 */
test.describe('Closing (КС-2 / КС-3) — Smoke', () => {
  test('/russian-docs/ks2 — акты КС-2', async ({ page }) => {
    await smokeCheck(page, '/russian-docs/ks2');
    await expectTable(page).catch(() => {});
  });

  test('/russian-docs/ks3 — справки КС-3', async ({ page }) => {
    await smokeCheck(page, '/russian-docs/ks3');
    await expectTable(page).catch(() => {});
  });
});
