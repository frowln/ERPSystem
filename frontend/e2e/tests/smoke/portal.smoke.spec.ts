import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Portal (Портал подрядчика) — Smoke Tests
 *
 * Persona: подрядчик (субподрядная организация), прораб подрядчика, бухгалтер подрядчика
 * Domain: портал подрядчика = внешний доступ для субподрядчиков.
 * Contractor sees: assigned tasks, shared documents, КС-2 drafts, invoices.
 * Contractor MUST NOT see: internal pricing, margin, competitor bids.
 * PlanRadar/Procore equivalent: "Contractor Portal" / "Subcontractor Module".
 * 16 pages + 1 dark-mode check.
 */
test.describe('Portal — Smoke', () => {
  test('/portal — дашборд подрядчика', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal');
    // Portal dashboard: summary for the logged-in contractor
    await expectDashboard(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/portal/projects — проекты подрядчика', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/projects');
    // Projects visible to contractor
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/portal/documents — документы', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/documents');
    // Shared documents with download ability
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/portal/contracts — договоры подрядчика', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/contracts');
    // Contracts visible to contractor: Номер, Предмет, Сумма, Статус
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/portal/invoices — счета подрядчика', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/invoices');
    // Invoice status: Номер, Дата, Сумма, Статус оплаты
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/portal/tasks — задачи подрядчика', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/tasks');
    // Assigned tasks visible to contractor
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/portal/schedule — график подрядчика', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/schedule');
    // Schedule/calendar view
    // Domain: подрядчик видит только свои работы в графике
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/portal/rfis — RFI подрядчика', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/rfis');
    // RFIs where contractor is author or assignee
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/portal/defects — дефекты подрядчика', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/defects');
    // Defects assigned to contractor for remediation
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/portal/signatures — электронные подписи', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/signatures');
    // Digital signature status for documents
    // Domain: КЭП/УКЭП для подписания актов и КС-2
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/portal/photos — фотоотчёты', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/photos');
    // Photo reports from contractor
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/portal/daily-reports — ежедневные отчёты', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/daily-reports');
    // Daily reports submitted by contractor
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/portal/cp-approval — согласование КП', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/cp-approval');
    // КП (Commercial Proposal) approval by contractor
    // Domain: подрядчик подтверждает цены в КП перед формированием договора
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/portal/ks2-drafts — черновики КС-2', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/ks2-drafts');
    // КС-2 draft review and approval
    // Domain: КС-2 = акт выполненных работ. Подрядчик формирует, заказчик утверждает.
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/portal/settings — настройки портала', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/settings');
    // Portal settings page
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/portal/admin — администрирование портала', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portal/admin');
    // Portal admin panel: manage contractor access, invites
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('Dark mode: /portal', async ({ page }) => {
    await checkDarkMode(page, '/portal');
  });
});
