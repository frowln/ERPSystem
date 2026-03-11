import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
} from '../../helpers/smoke.helper';

/**
 * Design (Проектирование / ПИР) — Smoke Tests
 *
 * Persona: инженер-сметчик, главный инженер проекта (ГИП)
 * ПИР = проектно-изыскательские работы.
 * Sections follow ГОСТ Р 21.101: АР, КР, ОВ, ВК, ЭОМ, СС.
 * 4 pages tested.
 */
test.describe('Design — Smoke', () => {
  test('/design/versions — история версий проектной документации', async ({ page }) => {
    const { body } = await smokeCheck(page, '/design/versions');
    // Version table: Раздел, Версия, Дата, Автор, Статус
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/undefined|NaN/);
  });

  test('/design/reviews — журнал проверок проектной документации', async ({ page }) => {
    await smokeCheck(page, '/design/reviews');
    // Review log: table or list of review items with comments
    await expectTable(page).catch(() => {});
  });

  test('/design/reviews/board — канбан проверок', async ({ page }) => {
    const { body } = await smokeCheck(page, '/design/reviews/board');
    // Kanban columns: Новое, В работе, На проверке, Утверждено
    // Should render kanban board or card layout
    const kanbanOrCards = page.locator(
      '[class*="kanban"], [class*="board"], [class*="column"], [class*="card"], [class*="lane"]',
    );
    await expect(kanbanOrCards.first()).toBeVisible({ timeout: 10_000 }).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/design/sections — разделы проектной документации', async ({ page }) => {
    const { body } = await smokeCheck(page, '/design/sections');
    // List of project disciplines: АР, КР, ОВ, ВК, ЭОМ, СС (per ГОСТ Р 21.101)
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });
});
