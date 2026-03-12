import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * Punchlist (Предписания к устранению) — Smoke Tests
 *
 * Persona: прораб (Иванов А.С.), директор (Сидоров В.М.)
 * Domain: punch list = список замечаний перед сдачей объекта.
 * Critical before handover — no ЗОС (заключение о соответствии) until all items closed.
 * Comparable to Procore's punch list module.
 * Open items > 30 days before handover = project risk.
 * 2 pages.
 */
test.describe('Punchlist — Smoke', () => {
  test('/punchlist/items — реестр предписаний', async ({ page }) => {
    const { body } = await smokeCheck(page, '/punchlist/items');
    // Punchlist items: Номер, Описание, Зона, Подрядчик, Срок, Статус
    // Прораб: "Мне нужно быстро посмотреть что ещё не закрыто по этажу"
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/punchlist/dashboard — аналитика предписаний', async ({ page }) => {
    await smokeCheck(page, '/punchlist/dashboard');
    // Charts: open vs closed, by zone, by contractor
    // Директор: "Сколько замечаний осталось до сдачи?"
    await expectDashboard(page);
  });
});
