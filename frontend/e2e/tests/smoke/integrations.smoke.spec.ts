import { test, expect } from '@playwright/test';
import {
  smokeCheck,
} from '../../helpers/smoke.helper';

/**
 * Integrations + Marketplace — Smoke Tests
 *
 * Persona: администратор, IT-специалист
 * Domain: интеграции с внешними системами (1С, СБИС, email, Telegram).
 * Marketplace = каталог плагинов/расширений (future feature).
 * 2 pages.
 */
test.describe('Integrations — Smoke', () => {
  test('/integrations — хаб интеграций', async ({ page }) => {
    const { body } = await smokeCheck(page, '/integrations');
    // Integration hub: list of available integrations (1С, СБИС, email, etc.)
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Something went wrong');
  });

  test('/marketplace — маркетплейс плагинов', async ({ page }) => {
    const { body } = await smokeCheck(page, '/marketplace');
    // Plugin marketplace: extension cards with install/configure
    expect(body.length).toBeGreaterThan(50);
    expect(body).not.toContain('Cannot read properties');
  });
});
