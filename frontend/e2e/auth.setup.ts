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

  // Wait for the login controls to be visible (login page has no native <form> wrapper).
  const emailInput = page.getByLabel(/email|почта/i).first();
  await expect(emailInput).toBeVisible({ timeout: 20_000 });

  // Fill credentials
  await emailInput.fill(email);
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await expect(passwordInput).toBeVisible({ timeout: 15_000 });
  await passwordInput.fill(password);

  // Submit
  await page.getByRole('button', { name: /sign in|log in|login|войти|вход/i }).click();

  // Wait for redirect to dashboard (URL should no longer be /login)
  await page.waitForURL('**/', { timeout: 15_000 });

  // Verify we are logged in by checking persisted auth token in localStorage.
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
  expect(token).toBeTruthy();

  // Save the storage state (localStorage + cookies)
  await page.context().storageState({ path: authFile });
});
