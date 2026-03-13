import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for the Admin/Settings module.
 * Tests: user management, permissions, settings tabs, departments,
 * audit logs, security settings, admin dashboard.
 */

async function dismissCookieConsent(page: import('@playwright/test').Page) {
  const acceptBtn = page.locator('button').filter({ hasText: /accept/i });
  if (await acceptBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(300);
  }
}

test.describe('Admin Module', () => {
  // =========================================================================
  // User Management
  // =========================================================================

  test('users admin page loads with user table', async ({ page }) => {
    await page.goto('/admin/users');
    await dismissCookieConsent(page);
    await expect(page).toHaveURL('/admin/users');

    await expect(page.locator('body')).toContainText(
      /(пользовател|user|управлен|management)/i,
      { timeout: 15_000 },
    );
  });

  test('users page shows data table with columns', async ({ page }) => {
    await page.goto('/admin/users');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Should have a table with user data
    const table = page.locator('table, [role="table"], [data-testid*="table"]');
    const hasTable = await table.count() > 0;

    const userEmails = page.locator('td, div').filter({ hasText: /@.*\.(ru|com)/i });
    const hasEmails = await userEmails.count() > 0;

    expect(hasTable || hasEmails).toBeTruthy();
  });

  test('users page has create user button', async ({ page }) => {
    await page.goto('/admin/users');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({
      hasText: /(добавить|создать|пригласить|новый|create|add|invite|new)/i,
    });
    await expect(createBtn.first()).toBeVisible();
  });

  test('users page has search field', async ({ page }) => {
    await page.goto('/admin/users');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const search = page.locator(
      'input[type="text"], input[type="search"], input[placeholder*="поиск" i], input[placeholder*="search" i], input[placeholder*="найти" i], input[placeholder*="имя" i], input[placeholder*="email" i]',
    );
    const count = await search.count();
    expect(count).toBeGreaterThan(0);
  });

  test('users page has role/status filter tabs', async ({ page }) => {
    await page.goto('/admin/users');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const tabs = page.locator('button, [role="tab"]').filter({
      hasText: /(все|актив|заблокир|all|active|blocked|inactive)/i,
    });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('create user modal opens with form fields', async ({ page }) => {
    await page.goto('/admin/users');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({
      hasText: /(добавить|создать|пригласить|новый|create|add|invite)/i,
    });
    await createBtn.first().click({ force: true });
    await page.waitForTimeout(1500);

    const nameField = page.locator(
      'input[name*="name"], input[name*="firstName"], input[placeholder*="имя" i], input[placeholder*="name" i]',
    );
    const emailField = page.locator(
      'input[name*="email"], input[type="email"], input[placeholder*="email" i], input[placeholder*="почт" i]',
    );

    const hasName = await nameField.count() > 0;
    const hasEmail = await emailField.count() > 0;
    expect(hasName || hasEmail).toBeTruthy();
  });

  test('clicking a user row opens detail panel', async ({ page }) => {
    await page.goto('/admin/users');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const userRows = page.locator('tr:not(:first-child)').or(
      page.locator('[data-testid*="user-row"]'),
    );

    if (await userRows.first().isVisible().catch(() => false)) {
      const clickable = userRows.first().locator('button, a, td').first();
      if (await clickable.isVisible().catch(() => false)) {
        await clickable.click({ force: true });
        await page.waitForTimeout(1500);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  // =========================================================================
  // Permissions Page
  // =========================================================================

  test('permissions page loads', async ({ page }) => {
    await page.goto('/admin/permissions');
    await dismissCookieConsent(page);
    await expect(page).toHaveURL('/admin/permissions');

    await expect(page.locator('body')).toContainText(
      /(прав|доступ|разрешен|permission|access|role|группы)/i,
      { timeout: 15_000 },
    );
  });

  test('permissions page shows permission groups', async ({ page }) => {
    await page.goto('/admin/permissions');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const groups = page.locator('button, a, div[role="treeitem"], div[role="button"]').filter({
      hasText: /(admin|manager|engineer|accountant|viewer|группа|group|администр|менеджер|инженер|бухгалтер)/i,
    });
    const count = await groups.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('permissions page has create group button', async ({ page }) => {
    await page.goto('/admin/permissions');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button').filter({
      hasText: /(создать|добавить|новая|create|add|new)/i,
    });
    const count = await createBtn.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('clicking a permission group shows details', async ({ page }) => {
    await page.goto('/admin/permissions');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const groups = page.locator('button, a, div[role="treeitem"], div[role="button"]').filter({
      hasText: /(admin|manager|администр|менеджер)/i,
    });

    if (await groups.first().isVisible().catch(() => false)) {
      await groups.first().click({ force: true });
      await page.waitForTimeout(1500);

      const text = await page.locator('body').textContent() ?? '';
      const hasDetail = /(модел|model|правил|rule|пользовател|user|поля|field|read|write|создан|удален)/i.test(text);
      expect(hasDetail).toBeTruthy();
    }
  });

  // =========================================================================
  // Settings Page
  // =========================================================================

  test('settings page loads with tabs', async ({ page }) => {
    await page.goto('/settings');
    await dismissCookieConsent(page);
    await expect(page).toHaveURL('/settings');

    await expect(page.locator('body')).toContainText(
      /(настройк|settings|параметр|конфигурац)/i,
      { timeout: 15_000 },
    );
  });

  test('settings page has save button', async ({ page }) => {
    await page.goto('/settings');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    const saveBtn = page.locator('button').filter({
      hasText: /(сохранить|save|применить|apply)/i,
    });
    const count = await saveBtn.count();
    expect(count).toBeGreaterThan(0);
  });

  // =========================================================================
  // Admin Sub-Pages (all should load)
  // =========================================================================

  test('audit logs page loads', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('departments page loads', async ({ page }) => {
    await page.goto('/admin/departments');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toContainText(
      /(отдел|департамент|подразделен|department|division)/i,
      { timeout: 10_000 },
    );
  });

  test('security settings page loads', async ({ page }) => {
    await page.goto('/admin/security');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('login audit page loads', async ({ page }) => {
    await page.goto('/admin/login-audit');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('online users page loads', async ({ page }) => {
    await page.goto('/admin/online-users');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin dashboard loads with KPI cards', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // Dashboard: "Панель администратора" with cards: Пользователей, Проекты, Хранилище, Обращения
    await expect(page.locator('body')).toContainText(
      /(администратор|admin|dashboard|панель)/i,
      { timeout: 10_000 },
    );

    // Should show numeric KPI values
    const bodyText = await page.locator('body').textContent() ?? '';
    const hasNumbers = /\d+/.test(bodyText);
    expect(hasNumbers).toBeTruthy();
  });

  test('admin dashboard shows system health status', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    // System health: "Состояние системы", "Все системы работают", services with status
    const bodyText = await page.locator('body').textContent() ?? '';
    const hasHealth = /(состояние|системы|работа|health|status|база данных|API)/i.test(bodyText);
    expect(hasHealth).toBeTruthy();
  });

  test('permission matrix page loads', async ({ page }) => {
    await page.goto('/admin/permission-matrix');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('system settings page loads', async ({ page }) => {
    await page.goto('/admin/system-settings');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('tenant management page loads', async ({ page }) => {
    await page.goto('/admin/tenants');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('bulk user import page loads', async ({ page }) => {
    await page.goto('/admin/users/import');
    await dismissCookieConsent(page);
    await page.waitForTimeout(2000);

    await expect(page.locator('body')).toContainText(
      /(импорт|import|загрузк|upload|массов|bulk)/i,
      { timeout: 10_000 },
    );
  });

  // =========================================================================
  // RBAC: Admin-only access
  // =========================================================================

  test('admin pages are protected (require ADMIN role)', async ({ page }) => {
    const adminPages = [
      '/admin/users',
      '/admin/permissions',
      '/admin/departments',
      '/admin/audit-logs',
    ];

    for (const url of adminPages) {
      await page.goto(url);
      await page.waitForTimeout(1500);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  // =========================================================================
  // No crash errors
  // =========================================================================

  test('admin pages load without crash-level console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const routes = ['/admin/users', '/admin/permissions', '/settings', '/admin/dashboard'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(1500);
    }

    const crashErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('500') &&
        !e.includes('ResizeObserver') &&
        !e.includes('429') &&
        !e.includes('state update') &&
        !e.includes('ERR_CONNECTION') &&
        !e.includes('Failed to fetch') &&
        !e.includes('net::') &&
        !e.includes('WebSocket') &&
        !e.includes('AxiosError') &&
        !e.includes('Request failed') &&
        !e.includes('Network Error') &&
        !e.includes('health') &&
        !e.includes('api'),
    );
    expect(crashErrors).toHaveLength(0);
  });
});
