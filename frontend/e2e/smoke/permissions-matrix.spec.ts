import { test, expect, type Page } from '@playwright/test';

/**
 * Permission matrix E2E tests.
 *
 * Tests that:
 * 1. Admin sees all action buttons
 * 2. Accountant (with "Бухгалтерия" group) sees create buttons only where allowed
 * 3. Accountant cannot see create buttons where denied
 * 4. API actually blocks forbidden operations (403)
 */

const BASE = process.env.BASE_URL || 'https://struo.ru';

// Credentials
const ADMIN = { email: 'd.kasimov@privod.ru', password: 'Privod2025!' };
const ACCOUNTANT = { email: 'acc-test@struo.ru', password: 'Struo2025' };

async function login(page: Page, creds: { email: string; password: string }) {
  // Clear state completely
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(1000);

  // Dismiss cookie banner if present
  const declineBtn = page.getByRole('button', { name: /decline|accept|принять|отклонить/i }).first();
  if (await declineBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await declineBtn.click();
    await page.waitForTimeout(500);
  }

  const emailInput = page
    .getByPlaceholder(/логин|login|email|почта|name@company/i)
    .or(page.locator('input[name="email"], input[name="username"]'))
    .first();
  await expect(emailInput).toBeVisible({ timeout: 15_000 });
  await emailInput.fill(creds.email);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(creds.password);

  await page.getByRole('button', { name: /sign in|log in|login|войти|вход/i }).click();

  // Wait for auth to complete
  await expect.poll(async () => {
    const token = await page.evaluate(() => {
      const persisted = localStorage.getItem('privod-auth');
      if (persisted) {
        try { return JSON.parse(persisted)?.state?.token ?? null; } catch { return null; }
      }
      return null;
    });
    return Boolean(token);
  }, { timeout: 25_000 }).toBe(true);

  // Wait for dashboard/redirect
  await page.waitForTimeout(2000);
}

test.describe('Permission Matrix — Admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
  });

  test('admin sees "Create" button on projects page', async ({ page }) => {
    await page.goto(`${BASE}/projects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Look for create/add button
    const createBtn = page.getByRole('button', { name: /создать|новый|добавить|create|new|add/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
  });

  test('admin sees "Create" button on invoices page', async ({ page }) => {
    await page.goto(`${BASE}/invoices`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const createBtn = page.getByRole('button', { name: /создать|новый|добавить|create|new|add/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
  });

  test('admin sees "Create" button on employees page', async ({ page }) => {
    await page.goto(`${BASE}/employees`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const createBtn = page.getByRole('button', { name: /создать|новый|добавить|create|new|add/i }).first()
      .or(page.getByRole('link', { name: /создать|новый|добавить|create|new|add/i }).first());
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
  });

  test('admin /me/permissions returns _admin flag', async ({ page }) => {
    const token = await page.evaluate(() => {
      const persisted = localStorage.getItem('privod-auth');
      return persisted ? JSON.parse(persisted)?.state?.token : null;
    });

    const response = await page.request.get(`${BASE}/api/auth/me/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty('_admin');
  });
});

test.describe('Permission Matrix — Accountant (restricted)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTANT);
  });

  test('accountant can access projects page (read allowed)', async ({ page }) => {
    await page.goto(`${BASE}/projects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Page should load (not 403 redirect)
    await expect(page).not.toHaveURL(/login/);
  });

  test('accountant does NOT see "Create" button on projects page', async ({ page }) => {
    await page.goto(`${BASE}/projects`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Create button should NOT be visible
    const createBtns = page.getByRole('button', { name: /создать проект|новый проект|create project/i });
    await expect(createBtns).toHaveCount(0);
  });

  test('accountant sees "Create" button on invoices page (canCreate=true)', async ({ page }) => {
    await page.goto(`${BASE}/invoices`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // For accountant, Invoice canCreate=true, so button should be visible
    const createBtn = page.getByRole('button', { name: /создать|новый|добавить|create|new|add/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
  });

  test('accountant does NOT see "Create" on specifications page (canCreate=false)', async ({ page }) => {
    await page.goto(`${BASE}/specifications`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const createBtns = page.getByRole('button', { name: /создать спецификацию|новая спецификация|create specification/i });
    await expect(createBtns).toHaveCount(0);
  });

  test('accountant does NOT see "Create" on employees page (canCreate=false)', async ({ page }) => {
    await page.goto(`${BASE}/employees`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const createBtns = page.getByRole('button', { name: /создать|новый сотрудник|добавить сотрудника|create employee|add employee/i });
    await expect(createBtns).toHaveCount(0);
  });

  test('accountant /me/permissions returns correct model map', async ({ page }) => {
    const token = await page.evaluate(() => {
      const persisted = localStorage.getItem('privod-auth');
      return persisted ? JSON.parse(persisted)?.state?.token : null;
    });

    const response = await page.request.get(`${BASE}/api/auth/me/permissions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const data = body.data;

    // Should have models (not empty, not admin)
    expect(Object.keys(data).length).toBeGreaterThan(0);
    expect(data).not.toHaveProperty('_admin');

    // Project: read-only
    expect(data.Project?.canRead).toBe(true);
    expect(data.Project?.canCreate).toBeFalsy();

    // Invoice: full CRUD
    expect(data.Invoice?.canRead).toBe(true);
    expect(data.Invoice?.canCreate).toBe(true);

    // Budget: full CRUD
    expect(data.Budget?.canRead).toBe(true);
    expect(data.Budget?.canCreate).toBe(true);
  });

  test('API blocks accountant from creating project (403)', async ({ page }) => {
    const token = await page.evaluate(() => {
      const persisted = localStorage.getItem('privod-auth');
      return persisted ? JSON.parse(persisted)?.state?.token : null;
    });

    const response = await page.request.post(`${BASE}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { name: 'Playwright Forbidden', code: 'PW-403', status: 'DRAFT' },
    });
    expect(response.status()).toBe(403);
  });
});
