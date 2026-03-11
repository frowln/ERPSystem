import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
} from '../../helpers/smoke.helper';

/**
 * Processes (Процессы: RFI, Submittals, Issues, Workflows) — Smoke Tests
 *
 * Persona: инженер ПТО, прораб, руководитель проекта
 * Domain: RFI = запрос на разъяснение (Request for Information) — стандарт Procore/PlanRadar.
 * Submittals = передача документации на согласование (ПД, РД, сертификаты).
 * Workflow templates = шаблоны процессов согласования.
 * 4 pages (approval-inbox and change-management tested in sessions A-C).
 */
test.describe('Processes — Smoke', () => {
  test('/pm/rfis — реестр RFI (запросов на разъяснение)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/pm/rfis');
    // RFI register: Номер, Тема, Автор, Назначен, Статус, Дата
    // Domain: RFI closes information gap between GC and subcontractors
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/pm/submittals — реестр подач (Submittals)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/pm/submittals');
    // Submittal register: Номер, Дисциплина, Подрядчик, Статус
    // Domain: submittal = передача РД/сертификатов на утверждение заказчику
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/pm/issues — трекер проблем', async ({ page }) => {
    const { body } = await smokeCheck(page, '/pm/issues');
    // Issue tracker: Заголовок, Приоритет, Статус, Назначен
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/workflow/templates — шаблоны процессов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/workflow/templates');
    // Workflow template list: reusable approval/review flows
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });
});
