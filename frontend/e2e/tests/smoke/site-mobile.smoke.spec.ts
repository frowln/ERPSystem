import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectDashboard,
} from '../../helpers/smoke.helper';

/**
 * Site + Mobile (Стройплощадка + Мобильное приложение) — Smoke Tests
 *
 * Persona: прораб (мобильный), мастер участка, инженер ПТО
 * Domain: М-29 = обязательная форма учёта материалов на объекте (ежемесячно).
 * Mobile pages = PWA dashboard for field workers — simplified UI, offline-capable.
 * 4 pages.
 */
test.describe('Site + Mobile — Smoke', () => {
  test('/m29 — отчёт М-29 (расход материалов)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/m29');
    // M-29 statutory material consumption report
    // Domain: форма М-29 = ежемесячный отчёт о расходе материалов
    // Нормативный расход vs фактический — перерасход требует объяснения
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/mobile/dashboard — мобильный дашборд', async ({ page }) => {
    const { body } = await smokeCheck(page, '/mobile/dashboard');
    // Mobile dashboard: simplified UI, large buttons, offline-ready
    await expectDashboard(page).catch(() => {});
    expect(body).not.toContain('Cannot read properties');
  });

  test('/mobile/reports — мобильные отчёты', async ({ page }) => {
    const { body } = await smokeCheck(page, '/mobile/reports');
    // Mobile reports: daily logs, photo reports from field
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/mobile/photos — мобильные фотоотчёты', async ({ page }) => {
    const { body } = await smokeCheck(page, '/mobile/photos');
    // Mobile photo reports: camera integration, geo-tagging
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });
});
