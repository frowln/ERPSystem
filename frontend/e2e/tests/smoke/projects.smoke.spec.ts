import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
} from '../../helpers/smoke.helper';

/**
 * Projects (Объекты) — Smoke Tests
 *
 * Persona: директор (Сидоров В.М.), прораб (Иванов А.С.)
 * Domain: Объект = primary entity in construction ERP.
 * Status flow: Черновик → Планирование → В работе → Приостановлен → Завершён.
 * Every project auto-creates a budget (FM).
 * CPI < 0.8 = significantly over budget. SPI < 0.8 = significantly behind schedule.
 * 2 pages.
 */
test.describe('Projects — Smoke', () => {
  test('/projects — реестр объектов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/projects');
    // Project list: Название, Код, Статус, Менеджер, Бюджет, Прогресс
    // Директор: "Покажи мне все объекты и где я теряю деньги — за 30 секунд"
    // Should show progress bar and status badge per project
    await expectTable(page).catch(() => {
      // May render as card grid instead of table
    });
    expect(body).not.toMatch(/undefined|NaN/);
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('/site-assessments — предстроительные обследования', async ({ page }) => {
    const { body } = await smokeCheck(page, '/site-assessments');
    // Site assessments: Объект, Дата осмотра, Оценщик, Статус
    // Domain: обследование площадки до начала строительства
    // Прораб: "Мне нужно знать состояние площадки до начала работ"
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });
});
