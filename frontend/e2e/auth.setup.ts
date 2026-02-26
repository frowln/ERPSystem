import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '.auth', 'user.json');

/**
 * Authentication setup.
 *
 * This runs before all test suites to establish an authenticated session.
 * It navigates to the login page, fills in credentials, and stores the
 * resulting localStorage state (JWT token, user object) to a JSON file
 * which is then reused by all subsequent tests.
 *
 * Default credentials match the seed data created by Flyway migration.
 */
setup('authenticate as admin user', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL || 'admin@privod.ru';
  const password = process.env.TEST_USER_PASSWORD || 'admin123';

  // Navigate to login
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // Wait for the login controls to be visible.
  // In some deployments this field is rendered as "Логин" instead of "Email".
  const emailInput = page
    .getByPlaceholder(/логин|login|email|почта/i)
    .or(page.locator('input[name="email"], input[name="username"], input[autocomplete="username"]'))
    .first();
  await expect(emailInput).toBeVisible({ timeout: 20_000 });

  // Fill credentials
  await emailInput.fill(email);
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: 15_000 });
  await passwordInput.fill(password);

  // Submit
  await page.getByRole('button', { name: /sign in|log in|login|войти|вход/i }).click();

  // Some builds keep user on /login page after successful auth.
  // The reliable signal is persisted auth token in localStorage.
  await expect.poll(async () => {
    const token = await page.evaluate(() => {
      const persisted = localStorage.getItem('privod-auth');
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          return parsed?.state?.token ?? parsed?.token ?? null;
        } catch {
          // fall through to legacy key
        }
      }
      return localStorage.getItem('auth_token');
    });
    return Boolean(token);
  }, { timeout: 20_000 }).toBe(true);

  // Save the storage state (localStorage + cookies)
  await page.context().storageState({ path: authFile });
});
