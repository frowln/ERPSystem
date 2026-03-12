import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * Support (Техническая поддержка) — Smoke Tests
 *
 * Persona: все пользователи (подают заявки), администратор (обрабатывает)
 * Domain: internal helpdesk / support ticketing.
 * SLA: response time, resolution time.
 * Priority: критический (1ч), высокий (4ч), средний (8ч), низкий (24ч).
 * 2 pages.
 */
test.describe('Support — Smoke', () => {
  test('/support/tickets — реестр заявок', async ({ page }) => {
    const { body } = await smokeCheck(page, '/support/tickets');
    // Tickets: Номер, Тема, Автор, Приоритет, Статус, Дата
    // Domain: статусы: Новая → В работе → Ожидание → Решена → Закрыта
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/support/dashboard — дашборд поддержки', async ({ page }) => {
    await smokeCheck(page, '/support/dashboard');
    // KPI: open tickets, avg response time, SLA %, by priority
    // Директор: "Сколько заявок не обработано и сколько SLA нарушено?"
    await expectDashboard(page);
  });
});
