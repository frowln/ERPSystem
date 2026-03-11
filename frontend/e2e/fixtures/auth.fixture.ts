import { Browser, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type Role = 'admin' | 'manager' | 'engineer' | 'accountant' | 'viewer';

const AUTH_DIR = path.join(__dirname, '..', '.auth');

/** Default credentials per role — override with E2E_{ROLE}_EMAIL / E2E_{ROLE}_PASS */
const DEFAULT_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@privod.ru',
    password: process.env.E2E_ADMIN_PASS || 'admin123',
  },
  manager: {
    email: process.env.E2E_MANAGER_EMAIL || 'manager@privod.ru',
    password: process.env.E2E_MANAGER_PASS || 'manager123',
  },
  engineer: {
    email: process.env.E2E_ENGINEER_EMAIL || 'engineer@privod.ru',
    password: process.env.E2E_ENGINEER_PASS || 'engineer123',
  },
  accountant: {
    email: process.env.E2E_ACCOUNTANT_EMAIL || 'accountant@privod.ru',
    password: process.env.E2E_ACCOUNTANT_PASS || 'accountant123',
  },
  viewer: {
    email: process.env.E2E_VIEWER_EMAIL || 'viewer@privod.ru',
    password: process.env.E2E_VIEWER_PASS || 'viewer123',
  },
};

/**
 * Get the storage state file path for a specific role.
 */
export function getAuthFilePath(role: Role): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

/**
 * Login as a specific role and return an authenticated Page.
 * Saves storageState to e2e/.auth/{role}.json for reuse.
 */
export async function loginAs(
  browser: Browser,
  role: Role,
): Promise<{ context: BrowserContext; page: Page }> {
  const authFile = getAuthFilePath(role);

  // Reuse cached auth if it exists and is fresh (< 30 minutes)
  if (fs.existsSync(authFile)) {
    const stats = fs.statSync(authFile);
    const ageMinutes = (Date.now() - stats.mtimeMs) / 60_000;
    if (ageMinutes < 30) {
      const context = await browser.newContext({ storageState: authFile });
      const page = await context.newPage();
      return { context, page };
    }
  }

  // Perform fresh login
  const context = await browser.newContext();
  const page = await context.newPage();
  const creds = DEFAULT_CREDENTIALS[role];

  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // Find email input
  const emailInput = page
    .getByPlaceholder(/логин|login|email|почта/i)
    .or(page.locator('input[name="email"], input[name="username"], input[autocomplete="username"]'))
    .first();
  await emailInput.waitFor({ state: 'visible', timeout: 20_000 });
  await emailInput.fill(creds.email);

  // Find password input
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
  await passwordInput.fill(creds.password);

  // Submit
  await page.getByRole('button', { name: /sign in|log in|login|войти|вход/i }).click();

  // Wait for auth token to appear in localStorage
  await page.waitForFunction(
    () => {
      const persisted = localStorage.getItem('privod-auth');
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          return Boolean(parsed?.state?.token ?? parsed?.token);
        } catch {
          // fall through
        }
      }
      return Boolean(localStorage.getItem('auth_token'));
    },
    { timeout: 20_000 },
  );

  // Save storage state
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  await context.storageState({ path: authFile });

  return { context, page };
}
