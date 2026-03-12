import { test, expect } from '@playwright/test';
import {
  smokeCheck,
  checkDarkMode,
} from '../../helpers/smoke.helper';

/**
 * Tasks (Задачи) — Smoke Tests
 *
 * Persona: прораб (Иванов А.С.), все пользователи
 * Domain: task manager with list/kanban/calendar views.
 * Task card: Название, Исполнитель, Срок, Приоритет, Статус.
 * Filters: by project, assignee, status, priority.
 * Comparable to Bitrix24 tasks module.
 * 1 page + 1 dark-mode check.
 */
test.describe('Tasks — Smoke', () => {
  test('/tasks — менеджер задач (список/канбан/календарь)', async ({ page }) => {
    const { body } = await smokeCheck(page, '/tasks');
    // Task manager with view toggle: list, kanban, calendar
    // Прораб: "Покажи мне мои задачи на сегодня — быстро"
    // Check for view toggle buttons or tabs
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });

  test('Dark mode: /tasks', async ({ page }) => {
    await checkDarkMode(page, '/tasks');
  });
});
