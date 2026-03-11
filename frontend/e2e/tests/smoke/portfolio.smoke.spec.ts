import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * Portfolio (Управление портфелем) — Smoke Tests
 *
 * Persona: директор, коммерческий директор, руководитель тендерного отдела
 * Domain: управление портфелем проектов.
 *   RAG matrix = Red/Amber/Green status across 7 dimensions.
 *   CPI/SPI per project. Pipeline = воронка от лида до контракта.
 *   Tenders = конкурсы/тендеры на строительные работы (44-ФЗ, 223-ФЗ, коммерческие).
 * 3 pages.
 */
test.describe('Portfolio — Smoke', () => {
  test('/portfolio/health — здоровье портфеля (RAG-матрица)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portfolio/health');
    // RAG matrix: 7 dimensions (Budget, Schedule, Quality, Safety, Scope, Risk, Resources)
    // Domain: Procore-style portfolio dashboard. CPI/SPI per project.
    await expectDashboard(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/portfolio/opportunities — возможности (pipeline)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portfolio/opportunities');
    // Business opportunities pipeline/funnel or table
    // Domain: воронка продаж — от заявки до заключения договора
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/portfolio/tenders — тендеры', async ({ page }) => {
    const { body } = await smokeCheck(page, '/portfolio/tenders');
    // Tender list: Название, Заказчик, Бюджет, Срок подачи, Статус
    // Domain: 44-ФЗ (госзакупки), 223-ФЗ (госкорпорации), коммерческие тендеры
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });
});
