import { test, expect } from '@playwright/test';
import { smokeCheck } from '../../helpers/smoke.helper';

/**
 * Email (Почта) — Smoke Tests
 *
 * Persona: директор, менеджер проекта
 * Built-in email keeps all project communication in one place.
 * 1 page tested.
 */
test.describe('Email — Smoke', () => {
  test('/mail — почтовый клиент', async ({ page }) => {
    const { body } = await smokeCheck(page, '/mail');
    // Should show inbox/sent/draft folders, message list, compose button
    // Check for compose button or folder structure
    const mailElements = page.locator(
      'button, [class*="inbox"], [class*="folder"], [class*="compose"], [class*="mail"], [class*="message"]',
    );
    const count = await mailElements.count();
    expect(count, 'Mail page should have interactive elements').toBeGreaterThan(0);
    expect(body).not.toContain('Something went wrong');
    expect(body).not.toMatch(/\b[a-z]+\.[a-z]+\.[a-z]+Key\b/);
  });
});
