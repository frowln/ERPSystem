import { test, expect } from '@playwright/test';
import {
  smokeCheck,
} from '../../helpers/smoke.helper';

/**
 * Messenger (Мессенджер) — Smoke Tests
 *
 * Persona: все пользователи
 * Domain: внутренний мессенджер — каналы проектов, личные сообщения.
 * Should have: channel list, message area, send button.
 * 1 page.
 */
test.describe('Messenger — Smoke', () => {
  test('/messaging — мессенджер', async ({ page }) => {
    const { body } = await smokeCheck(page, '/messaging');
    // Chat/messenger: channel list, message area, send button
    // Should show at least system channel or empty state
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
    expect(body).not.toContain('Cannot read properties');
  });
});
