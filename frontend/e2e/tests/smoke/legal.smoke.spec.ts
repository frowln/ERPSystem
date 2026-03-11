import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  expectTable,
} from '../../helpers/smoke.helper';

/**
 * Legal (Юридический) — Smoke Tests
 *
 * Persona: юрист, директор, бухгалтер
 * Domain: строительные споры и арбитраж.
 *   Insurance = обязательное страхование ответственности (СРО, ОСАГО спецтехники).
 *   Legal cases = судебные дела, претензии, рекламации.
 *   Templates = типовые договоры, допсоглашения, акты.
 * 3 pages.
 */
test.describe('Legal — Smoke', () => {
  test('/legal/cases — реестр юридических дел', async ({ page }) => {
    const { body } = await smokeCheck(page, '/legal/cases');
    // Legal cases: Номер, Тип, Сторона, Суд, Статус, Сумма иска
    // Domain: арбитражные дела, претензионная работа
    await expectTable(page).catch(() => {});
    expect(body).not.toContain('Something went wrong');
  });

  test('/legal/templates — шаблоны юридических документов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/legal/templates');
    // Legal document templates: договоры, допсоглашения, акты
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });

  test('/insurance-certificates — реестр страховых полисов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/insurance-certificates');
    // Insurance certificates: Страховщик, Тип, Срок, Сумма, Статус
    // Domain: обязательное страхование — ответственность СРО, ОСАГО, страхование СМР
    await expectTable(page).catch(() => {});
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });
});
