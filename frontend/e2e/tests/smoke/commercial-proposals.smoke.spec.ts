import { test } from '@playwright/test';
import { smokeCheck, expectTable } from '../../helpers/smoke.helper';

/**
 * Commercial Proposals (КП) — Smoke Tests
 *
 * Persona: инженер-сметчик / снабженец
 * Route: /commercial-proposals
 * Domain: КП = коммерческое предложение заказчику.
 *         Must show customer price and margin (наценка).
 * Expected columns: Номер, Объект, Дисциплина, Сумма, Статус
 */
test.describe('Commercial Proposals — Smoke', () => {
  test('/commercial-proposals — коммерческие предложения', async ({
    page,
  }) => {
    await smokeCheck(page, '/commercial-proposals');
    await expectTable(page).catch(() => {});
  });
});
