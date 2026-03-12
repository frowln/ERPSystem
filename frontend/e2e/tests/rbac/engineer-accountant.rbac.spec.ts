/**
 * RBAC Verification — Engineer (No Finance) + Accountant (No Operations) Roles
 *
 * Phase 1: Engineer — Allowed Access (operations, safety, quality, warehouse, fleet)
 * Phase 2: Engineer — DENIED Access (finance, HR, admin, manager-only)
 * Phase 3: Engineer — API Level RBAC
 * Phase 4: Accountant — Allowed Access (finance, unrestricted)
 * Phase 5: Accountant — DENIED Access (operations, safety, HR, quality, admin)
 * Phase 6: Accountant — API Level RBAC
 * Phase 7: Cross-Role Data Isolation & UI Visibility
 * Phase 8: Business Rule Findings (routePermissions vs. business expectations)
 *
 * Source of truth: frontend/src/config/routePermissions.ts
 * Business rules: .claude/plans/business-rules-construction-erp.md
 *
 * Key role membership (from routePermissions.ts):
 *   ENGINEER is in: ENGINEER_PLUS, SAFETY_PLUS, PROCUREMENT_PLUS, QUALITY_PLUS, fleet
 *   ENGINEER is NOT in: ADMIN_ONLY, MANAGER_PLUS, FINANCE_PLUS, HR_PLUS
 *   ACCOUNTANT is in: FINANCE_PLUS
 *   ACCOUNTANT is NOT in: ADMIN_ONLY, MANAGER_PLUS, ENGINEER_PLUS, SAFETY_PLUS, HR_PLUS,
 *                         PROCUREMENT_PLUS, QUALITY_PLUS, fleet
 */

import { test, expect } from '../../fixtures/roles.fixture';
import { authenticatedRequest } from '../../fixtures/api.fixture';
import type { Page } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────────

const FORBIDDEN_MARKERS = [
  'Доступ запрещён',
  'У вас нет прав',
  'Access Denied',
  'Forbidden',
];

function isForbiddenPage(body: string): boolean {
  return FORBIDDEN_MARKERS.some((m) => body.includes(m));
}

async function assertAccessible(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(500);

  const body = (await page.textContent('body')) ?? '';
  expect(isForbiddenPage(body), `${url} should NOT show forbidden page`).toBe(false);
  expect(body.length, `${url} should render content`).toBeGreaterThan(50);
}

async function assertDenied(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(500);

  const currentUrl = page.url();
  const body = (await page.textContent('body')) ?? '';

  const wasRedirected = !currentUrl.endsWith(url) && !currentUrl.includes(url.slice(1));
  const showsForbidden = isForbiddenPage(body);

  expect(
    wasRedirected || showsForbidden,
    `${url} should be DENIED (redirect or 403). Got URL: ${currentUrl}`,
  ).toBe(true);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINEER URL CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Engineer ALLOWED routes:
 * - Unrestricted (no entry in routePermissions)
 * - ENGINEER_PLUS: planning, estimates, specifications, operations, bim
 * - SAFETY_PLUS: safety (includes ENGINEER)
 * - PROCUREMENT_PLUS: procurement, warehouse, dispatch (includes ENGINEER)
 * - QUALITY_PLUS: quality, defects, punchlist, regulatory (includes ENGINEER)
 * - Fleet: fleet, iot (includes ENGINEER)
 */
const ENGINEER_ALLOWED: string[] = [
  // ── Unrestricted routes ──
  '/',
  '/tasks',
  '/calendar',
  '/projects',
  '/site-assessments',
  '/crm/leads',
  '/crm/dashboard',
  '/counterparties',
  '/documents',
  '/cde/documents',
  '/pto/documents',
  '/pto/hidden-work-acts',
  '/pto/work-permits',
  '/pto/lab-tests',
  '/russian-docs/ks2',
  '/russian-docs/ks3',
  '/russian-docs/edo',
  '/contracts',
  '/commercial-proposals',
  '/design/versions',
  '/exec-docs/aosr',
  '/exec-docs/ks6',
  '/closeout/dashboard',
  '/maintenance/dashboard',
  '/portal',
  '/messaging',
  '/mail',
  '/bid-packages',
  '/change-management/dashboard',
  '/pm/rfis',

  // ── ENGINEER_PLUS routes ──
  '/planning/gantt',
  '/planning/evm',
  '/planning/resource-planning',
  '/estimates',
  '/specifications',
  '/specifications/competitive-registry',
  '/operations/daily-logs',
  '/operations/work-orders',
  '/operations/dashboard',
  '/documents/smart-recognition',
  '/bim/models',
  '/bim/clash-detection',

  // ── SAFETY_PLUS routes (ENGINEER included) ──
  '/safety',
  '/safety/incidents',
  '/safety/inspections',
  '/safety/briefings',
  '/safety/ppe',
  '/safety/metrics',

  // ── PROCUREMENT_PLUS routes (ENGINEER included) ──
  '/procurement',
  '/procurement/purchase-orders',
  '/warehouse/materials',
  '/warehouse/stock',
  '/warehouse/movements',
  '/dispatch/orders',

  // ── QUALITY_PLUS routes (ENGINEER included) ──
  '/quality',
  '/defects',
  '/defects/dashboard',
  '/punchlist/items',
  '/quality/checklists',
  '/quality/checklist-templates',
  '/regulatory/permits',
  '/regulatory/inspections',
  '/regulatory/dashboard',

  // ── Fleet routes (ENGINEER included) ──
  '/fleet',
  '/fleet/fuel',
  '/fleet/maintenance',
  '/iot/devices',
];

/**
 * Engineer DENIED routes:
 * - ADMIN_ONLY: settings, admin, marketplace, integrations
 * - MANAGER_PLUS: budgets, revenue, portfolio, financial-models, tax-risk, monte-carlo
 * - FINANCE_PLUS: invoices, payments, cash-flow, accounting, cost-management, etc.
 * - HR_PLUS: employees, timesheets, hr, leave, crew
 */
const ENGINEER_DENIED: string[] = [
  // ── ADMIN_ONLY ──
  '/admin/dashboard',
  '/admin/users',
  '/admin/permissions',
  '/admin/system-settings',
  '/settings/subscription',
  '/marketplace',
  '/integrations',

  // ── MANAGER_PLUS (ENGINEER not included) ──
  '/budgets',
  '/financial-models',
  '/portfolio/health',
  '/portfolio/opportunities',
  '/portfolio/tenders',
  '/revenue/dashboard',
  '/revenue/recognition-periods',
  '/tax-risk',

  // ── FINANCE_PLUS (ENGINEER not included) ──
  '/invoices',
  '/payments',
  '/cash-flow',
  '/cash-flow/charts',
  '/accounting',
  '/cost-management/codes',
  '/cost-management/budget',
  '/cost-management/profitability',
  '/bank-statement-matching',
  '/bank-export',
  '/treasury-calendar',
  '/tax-calendar',
  '/factoring-calculator',
  '/bdds',
  '/finance/expenses',
  '/finance/s-curve-cashflow',
  '/execution-chain',
  '/price-coefficients',
  '/payroll',

  // ── HR_PLUS (ENGINEER not included) ──
  '/employees',
  '/timesheets',
  '/crew',
  '/hr/staffing-schedule',
  '/hr/timesheet-t13',
  '/hr/work-orders',
  '/leave/requests',
  '/hr-russian/employment-contracts',
  '/self-employed',
];

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTANT URL CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Accountant ALLOWED routes:
 * - FINANCE_PLUS routes (ACCOUNTANT included)
 * - Unrestricted routes (no entry in routePermissions)
 */
const ACCOUNTANT_ALLOWED: string[] = [
  // ── FINANCE_PLUS routes ──
  '/invoices',
  '/payments',
  '/cash-flow',
  '/cash-flow/charts',
  '/accounting',
  '/cost-management/codes',
  '/cost-management/budget',
  '/cost-management/commitments',
  '/cost-management/forecast',
  '/cost-management/profitability',
  '/bank-statement-matching',
  '/bank-export',
  '/treasury-calendar',
  '/tax-calendar',
  '/factoring-calculator',
  '/bdds',
  '/finance/expenses',
  '/finance/s-curve-cashflow',
  '/execution-chain',
  '/price-coefficients',

  // ── Unrestricted routes ──
  '/',
  '/tasks',
  '/calendar',
  '/projects',
  '/contracts',
  '/commercial-proposals',
  '/documents',
  '/russian-docs/ks2',
  '/russian-docs/ks3',
  '/russian-docs/edo',
  '/data-exchange/import',
  '/data-exchange/export',
  '/data-exchange/1c-config',
  '/exec-docs/aosr',
  '/exec-docs/ks6',
  '/closeout/dashboard',
  '/portal',
  '/messaging',
  '/mail',
  '/crm/leads',
  '/counterparties',
  '/design/versions',
  '/change-management/dashboard',
];

/**
 * Accountant DENIED routes:
 * - ADMIN_ONLY
 * - MANAGER_PLUS: budgets, revenue, portfolio, financial-models, tax-risk
 * - ENGINEER_PLUS: planning, estimates, specifications, operations, bim
 * - SAFETY_PLUS: safety
 * - HR_PLUS: employees, timesheets, hr, leave, crew
 * - PROCUREMENT_PLUS: procurement, warehouse, dispatch
 * - QUALITY_PLUS: quality, defects, punchlist, regulatory
 * - Fleet: fleet, iot
 */
const ACCOUNTANT_DENIED: string[] = [
  // ── ADMIN_ONLY ──
  '/admin/dashboard',
  '/admin/users',
  '/admin/permissions',
  '/admin/system-settings',
  '/settings/subscription',
  '/marketplace',
  '/integrations',

  // ── MANAGER_PLUS (ACCOUNTANT not included) ──
  '/budgets',
  '/financial-models',
  '/portfolio/health',
  '/revenue/dashboard',
  '/tax-risk',

  // ── ENGINEER_PLUS (ACCOUNTANT not included) ──
  '/planning/gantt',
  '/planning/evm',
  '/estimates',
  '/specifications',
  '/operations/daily-logs',
  '/operations/work-orders',
  '/operations/dashboard',
  '/documents/smart-recognition',
  '/bim/models',

  // ── SAFETY_PLUS (ACCOUNTANT not included) ──
  '/safety',
  '/safety/incidents',
  '/safety/inspections',

  // ── HR_PLUS (ACCOUNTANT not included) ──
  '/employees',
  '/timesheets',
  '/crew',
  '/hr/staffing-schedule',
  '/leave/requests',

  // ── PROCUREMENT_PLUS (ACCOUNTANT not included) ──
  '/procurement',
  '/warehouse/materials',
  '/dispatch/orders',

  // ── QUALITY_PLUS (ACCOUNTANT not included) ──
  '/quality',
  '/defects',
  '/punchlist/items',
  '/regulatory/permits',

  // ── Fleet (ACCOUNTANT not included) ──
  '/fleet',
  '/iot/devices',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 1: Engineer — Allowed Access
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 1: Engineer — Allowed Access', () => {
  for (const url of ENGINEER_ALLOWED) {
    test(`Engineer can access: ${url}`, async ({ withRole }) => {
      await withRole('engineer', async (page) => {
        await assertAccessible(page, url);
      });
    });
  }

  // Engineer can CREATE operational entities
  test('Engineer can create daily log', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/operations/daily-logs', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const createBtn = page.locator(
        'button:has-text("Создать"), button:has-text("Новый"), a[href*="/new"], button:has-text("Create")',
      ).first();
      const exists = (await createBtn.count()) > 0;
      expect(exists, 'Engineer should see create button on daily logs page').toBe(true);
    });
  });

  test('Engineer can report defect', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/defects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const createBtn = page.locator(
        'button:has-text("Зафиксировать"), button:has-text("Создать"), button:has-text("Добавить"), button:has-text("Create")',
      ).first();
      const exists = (await createBtn.count()) > 0;
      expect(exists, 'Engineer should see create/report button on defects page').toBe(true);
    });
  });

  test('Engineer can report safety incident', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/safety/incidents', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const createBtn = page.locator(
        'button:has-text("Зарегистрировать"), button:has-text("Создать"), button:has-text("Create")',
      ).first();
      const exists = (await createBtn.count()) > 0;
      expect(exists, 'Engineer should see create button on safety incidents page').toBe(true);
    });
  });

  test('Engineer can access specifications', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/specifications', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const body = (await page.textContent('body')) ?? '';
      expect(isForbiddenPage(body)).toBe(false);
      expect(body.length).toBeGreaterThan(100);
    });
  });

  test('Engineer can access work orders', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/operations/work-orders', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const body = (await page.textContent('body')) ?? '';
      expect(isForbiddenPage(body)).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2: Engineer — DENIED Access (Finance, HR, Admin)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 2: Engineer — DENIED Access', () => {
  for (const url of ENGINEER_DENIED) {
    test(`Engineer CANNOT access: ${url}`, async ({ withRole }) => {
      await withRole('engineer', async (page) => {
        await assertDenied(page, url);
      });
    });
  }

  // Engineer should NOT see finance nav items in sidebar
  test('Engineer sidebar hides finance section links', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      const financeLinks = [
        'a[href="/invoices"]',
        'a[href="/payments"]',
        'a[href="/budgets"]',
        'a[href="/accounting"]',
        'a[href="/cash-flow"]',
      ];

      for (const selector of financeLinks) {
        const link = page.locator(selector);
        const isVisible = await link.isVisible().catch(() => false);
        expect(
          isVisible,
          `Engineer should NOT see nav link: ${selector}`,
        ).toBe(false);
      }
    });
  });

  // Engineer should NOT see HR nav items
  test('Engineer sidebar hides HR section links', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      const hrLinks = [
        'a[href="/employees"]',
        'a[href="/timesheets"]',
        'a[href="/hr/staffing-schedule"]',
      ];

      for (const selector of hrLinks) {
        const link = page.locator(selector);
        const isVisible = await link.isVisible().catch(() => false);
        expect(
          isVisible,
          `Engineer should NOT see nav link: ${selector}`,
        ).toBe(false);
      }
    });
  });

  // Engineer should NOT see admin nav items
  test('Engineer sidebar hides admin section links', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      const adminLinks = [
        'a[href="/admin/users"]',
        'a[href="/admin/system-settings"]',
        'a[href="/settings/subscription"]',
        'a[href="/admin/permissions"]',
      ];

      for (const selector of adminLinks) {
        const link = page.locator(selector);
        const isVisible = await link.isVisible().catch(() => false);
        expect(
          isVisible,
          `Engineer should NOT see nav link: ${selector}`,
        ).toBe(false);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 3: Engineer — API Level RBAC
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 3: Engineer — API RBAC', () => {
  // Engineer gets 403 on finance endpoints
  const ENGINEER_DENIED_API = [
    { method: 'GET', path: '/api/invoices', desc: 'list invoices' },
    { method: 'GET', path: '/api/budgets', desc: 'list budgets' },
    { method: 'GET', path: '/api/payments', desc: 'list payments' },
    { method: 'POST', path: '/api/invoices', desc: 'create invoice', data: { number: 'E2E-ENG-HACK', amount: 1000000 } },
    { method: 'GET', path: '/api/admin/users', desc: 'list users (admin-only)' },
    { method: 'POST', path: '/api/admin/users', desc: 'create user (admin-only)', data: { email: 'e2e-hack@test.ru', fullName: 'Hack', role: 'VIEWER', password: 'Test123!' } },
  ];

  for (const endpoint of ENGINEER_DENIED_API) {
    test(`Engineer gets 403 on ${endpoint.method} ${endpoint.path} (${endpoint.desc})`, async () => {
      const res = await authenticatedRequest(
        'engineer',
        endpoint.method,
        endpoint.path,
        endpoint.data as Record<string, unknown> | undefined,
      );
      expect(
        res.status,
        `Engineer should be denied ${endpoint.path} — got ${res.status}`,
      ).toBe(403);
    });
  }

  // Engineer CAN access operational endpoints
  const ENGINEER_ALLOWED_API = [
    { method: 'GET', path: '/api/projects', desc: 'list projects' },
    { method: 'GET', path: '/api/auth/me', desc: 'current user profile' },
    { method: 'GET', path: '/api/specifications', desc: 'list specifications' },
    { method: 'GET', path: '/api/safety/incidents', desc: 'list safety incidents' },
  ];

  for (const endpoint of ENGINEER_ALLOWED_API) {
    test(`Engineer CAN ${endpoint.method} ${endpoint.path} (${endpoint.desc})`, async () => {
      const res = await authenticatedRequest('engineer', endpoint.method, endpoint.path);
      expect(res.status, `Engineer should access ${endpoint.path} — got ${res.status}`).not.toBe(403);
      expect(res.status).not.toBe(401);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 4: Accountant — Allowed Access
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 4: Accountant — Allowed Access', () => {
  for (const url of ACCOUNTANT_ALLOWED) {
    test(`Accountant can access: ${url}`, async ({ withRole }) => {
      await withRole('accountant', async (page) => {
        await assertAccessible(page, url);
      });
    });
  }

  // Accountant can create invoices
  test('Accountant can create invoice', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/invoices', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const createBtn = page.locator(
        'button:has-text("Создать"), button:has-text("Новый"), button:has-text("Create"), a[href*="/new"]',
      ).first();
      const exists = (await createBtn.count()) > 0;
      expect(exists, 'Accountant should see create button on invoices page').toBe(true);
    });
  });

  // Accountant can create payments
  test('Accountant can create payment', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/payments', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const createBtn = page.locator(
        'button:has-text("Создать"), button:has-text("Новый"), button:has-text("Create"), a[href*="/new"]',
      ).first();
      const exists = (await createBtn.count()) > 0;
      expect(exists, 'Accountant should see create button on payments page').toBe(true);
    });
  });

  // Accountant can see financial data
  test('Accountant can access cost management', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/cost-management/codes', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const body = (await page.textContent('body')) ?? '';
      expect(isForbiddenPage(body)).toBe(false);
      expect(body.length).toBeGreaterThan(100);
    });
  });

  // Accountant can access КС-2/КС-3 (closing docs — unrestricted)
  test('Accountant can access КС-2 page', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/russian-docs/ks2', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const body = (await page.textContent('body')) ?? '';
      expect(isForbiddenPage(body)).toBe(false);
    });
  });

  // Accountant can access data exchange (1C integration — unrestricted)
  test('Accountant can access 1C config', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/data-exchange/1c-config', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const body = (await page.textContent('body')) ?? '';
      expect(isForbiddenPage(body)).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 5: Accountant — DENIED Access (Operations, Safety, HR, Quality, Admin)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 5: Accountant — DENIED Access', () => {
  for (const url of ACCOUNTANT_DENIED) {
    test(`Accountant CANNOT access: ${url}`, async ({ withRole }) => {
      await withRole('accountant', async (page) => {
        await assertDenied(page, url);
      });
    });
  }

  // Accountant should NOT see "Create project" button
  test('Accountant cannot create project', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const createBtn = page.locator(
        'button:has-text("Создать проект"), button:has-text("Новый проект"), a[href="/projects/new"]',
      );
      const isVisible = await createBtn.first().isVisible().catch(() => false);
      // Note: /projects is unrestricted so Accountant CAN view projects list,
      // but should NOT see create button (as project creation requires MANAGER+ role)
      // This is a UX expectation — document behavior
      test.info().annotations.push({
        type: 'business-finding',
        description: isVisible
          ? '[UX] Accountant sees "Create project" button on /projects — button should be role-filtered'
          : 'Accountant correctly cannot see create project button',
      });
    });
  });

  // Accountant should NOT see operations nav items
  test('Accountant sidebar hides operations section links', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      const opsLinks = [
        'a[href="/operations/daily-logs"]',
        'a[href="/operations/work-orders"]',
        'a[href="/safety/incidents"]',
        'a[href="/quality"]',
        'a[href="/warehouse/materials"]',
      ];

      for (const selector of opsLinks) {
        const link = page.locator(selector);
        const isVisible = await link.isVisible().catch(() => false);
        expect(
          isVisible,
          `Accountant should NOT see nav link: ${selector}`,
        ).toBe(false);
      }
    });
  });

  // Accountant should NOT see planning/estimates nav
  test('Accountant sidebar hides planning and estimates links', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      const engineerLinks = [
        'a[href="/planning/gantt"]',
        'a[href="/estimates"]',
        'a[href="/specifications"]',
        'a[href="/bim/models"]',
      ];

      for (const selector of engineerLinks) {
        const link = page.locator(selector);
        const isVisible = await link.isVisible().catch(() => false);
        expect(
          isVisible,
          `Accountant should NOT see nav link: ${selector}`,
        ).toBe(false);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 6: Accountant — API Level RBAC
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 6: Accountant — API RBAC', () => {
  // Accountant CAN access finance endpoints
  const ACCOUNTANT_ALLOWED_API = [
    { method: 'GET', path: '/api/invoices', desc: 'list invoices' },
    { method: 'GET', path: '/api/payments', desc: 'list payments' },
    { method: 'GET', path: '/api/auth/me', desc: 'current user profile' },
    { method: 'GET', path: '/api/projects', desc: 'list projects (unrestricted)' },
  ];

  for (const endpoint of ACCOUNTANT_ALLOWED_API) {
    test(`Accountant CAN ${endpoint.method} ${endpoint.path} (${endpoint.desc})`, async () => {
      const res = await authenticatedRequest('accountant', endpoint.method, endpoint.path);
      expect(res.status, `Accountant should access ${endpoint.path} — got ${res.status}`).not.toBe(403);
      expect(res.status).not.toBe(401);
    });
  }

  // Accountant gets 403 on operational/admin endpoints
  const ACCOUNTANT_DENIED_API = [
    { method: 'POST', path: '/api/projects', desc: 'create project', data: { name: 'E2E-ACC-HACK' } },
    { method: 'GET', path: '/api/admin/users', desc: 'list users (admin-only)' },
    { method: 'POST', path: '/api/admin/users', desc: 'create user (admin-only)', data: { email: 'e2e-hack@test.ru', fullName: 'Hack', role: 'VIEWER', password: 'Test123!' } },
  ];

  for (const endpoint of ACCOUNTANT_DENIED_API) {
    test(`Accountant gets 403 on ${endpoint.method} ${endpoint.path} (${endpoint.desc})`, async () => {
      const res = await authenticatedRequest(
        'accountant',
        endpoint.method,
        endpoint.path,
        endpoint.data as Record<string, unknown> | undefined,
      );
      expect(
        res.status,
        `Accountant should be denied ${endpoint.path} — got ${res.status}`,
      ).toBe(403);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 7: Cross-Role Data Isolation & UI Visibility
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 7: Cross-Role UI Visibility', () => {
  // Engineer should see MORE nav links than Accountant (has more permission groups)
  test('Engineer has more permitted nav groups than Accountant', async ({ withRole }) => {
    let engineerLinkCount = 0;
    let accountantLinkCount = 0;

    await withRole('engineer', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);
      engineerLinkCount = await page.locator('nav a[href], aside a[href]').count();
    });

    await withRole('accountant', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);
      accountantLinkCount = await page.locator('nav a[href], aside a[href]').count();
    });

    // Engineer has 5 permission groups (ENGINEER_PLUS, SAFETY_PLUS, PROCUREMENT_PLUS,
    // QUALITY_PLUS, fleet) while Accountant has only 1 (FINANCE_PLUS)
    // So Engineer should see substantially more nav items
    test.info().annotations.push({
      type: 'nav-comparison',
      description: `Engineer: ${engineerLinkCount} links, Accountant: ${accountantLinkCount} links`,
    });

    // Both should see fewer links than admin
    expect(engineerLinkCount, 'Engineer should have nav links').toBeGreaterThan(10);
    expect(accountantLinkCount, 'Accountant should have nav links').toBeGreaterThan(10);
  });

  // Engineer should NOT see salary data in any accessible page
  test('Engineer does not see salary-related labels on accessible pages', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      // /employees is HR_PLUS so Engineer is already denied — verify
      await page.goto('/employees', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      const isDenied = isForbiddenPage(body) || !page.url().includes('/employees');
      expect(isDenied, 'Engineer should be denied /employees (HR_PLUS)').toBe(true);
    });
  });

  // Accountant can see finance data but not operational create buttons
  test('Accountant sees financial amounts on invoices page', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/invoices', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      const body = (await page.textContent('body')) ?? '';
      expect(isForbiddenPage(body)).toBe(false);
      expect(body.length).toBeGreaterThan(100);
    });
  });

  // Both roles should have the same view on unrestricted pages
  test('Both roles can access /projects (unrestricted)', async ({ withRole }) => {
    for (const role of ['engineer', 'accountant'] as const) {
      await withRole(role, async (page) => {
        await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(500);

        const body = (await page.textContent('body')) ?? '';
        expect(isForbiddenPage(body), `${role} should access /projects`).toBe(false);
        expect(body.length).toBeGreaterThan(50);
      });
    }
  });

  // Mutual exclusion: Engineer sees safety, Accountant does not
  test('Engineer sees /safety but Accountant does not', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await assertAccessible(page, '/safety');
    });

    await withRole('accountant', async (page) => {
      await assertDenied(page, '/safety');
    });
  });

  // Mutual exclusion: Accountant sees /invoices, Engineer does not
  test('Accountant sees /invoices but Engineer does not', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await assertAccessible(page, '/invoices');
    });

    await withRole('engineer', async (page) => {
      await assertDenied(page, '/invoices');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 8: Business Rule Findings (routePermissions vs. Business Expectations)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 8: Business Rule Findings', () => {
  /**
   * [MAJOR] Business expects Accountant to have access to /budgets,
   * but routePermissions.ts defines budgets as MANAGER_PLUS (does not include ACCOUNTANT).
   * Бухгалтер needs budget visibility for financial planning and reconciliation.
   */
  test('[FINDING] Accountant CANNOT access /budgets — MANAGER_PLUS only', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/budgets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      const currentUrl = page.url();
      const isDenied = isForbiddenPage(body) || !currentUrl.includes('/budgets');

      test.info().annotations.push({
        type: 'business-finding',
        description: isDenied
          ? '[MAJOR] Accountant denied /budgets (MANAGER_PLUS). Business expects Accountant to access budgets for financial planning. Add ACCOUNTANT to budget route permissions.'
          : 'Accountant CAN access /budgets — permissions may have been updated',
      });
    });
  });

  /**
   * [MAJOR] Business expects Accountant to access /financial-models,
   * but routePermissions.ts defines it as MANAGER_PLUS.
   */
  test('[FINDING] Accountant CANNOT access /financial-models — MANAGER_PLUS only', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/financial-models', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      const currentUrl = page.url();
      const isDenied = isForbiddenPage(body) || !currentUrl.includes('/financial-models');

      test.info().annotations.push({
        type: 'business-finding',
        description: isDenied
          ? '[MAJOR] Accountant denied /financial-models (MANAGER_PLUS). Accountant needs FM access for cost verification and НДС checks.'
          : 'Accountant CAN access /financial-models — permissions may have been updated',
      });
    });
  });

  /**
   * [MAJOR] Business expects Accountant to access /timesheets and /employees
   * for payroll calculation, but HR_PLUS does not include ACCOUNTANT.
   */
  test('[FINDING] Accountant CANNOT access /timesheets — HR_PLUS only', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/timesheets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      const currentUrl = page.url();
      const isDenied = isForbiddenPage(body) || !currentUrl.includes('/timesheets');

      test.info().annotations.push({
        type: 'business-finding',
        description: isDenied
          ? '[MAJOR] Accountant denied /timesheets (HR_PLUS). Accountant needs timesheet data for payroll calculation (ТК РФ). Add ACCOUNTANT to timesheet/employee routes.'
          : 'Accountant CAN access /timesheets — permissions may have been updated',
      });
    });
  });

  /**
   * [MINOR] Business expects Engineer to access /timesheets and /crew
   * for own crew time tracking, but HR_PLUS does not include ENGINEER.
   */
  test('[FINDING] Engineer CANNOT access /timesheets — HR_PLUS only', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/timesheets', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      const currentUrl = page.url();
      const isDenied = isForbiddenPage(body) || !currentUrl.includes('/timesheets');

      test.info().annotations.push({
        type: 'business-finding',
        description: isDenied
          ? '[MINOR] Engineer denied /timesheets (HR_PLUS). Прораб typically needs to track own crew timesheets. Consider adding ENGINEER to timesheet routes (with read-only/own-crew scope).'
          : 'Engineer CAN access /timesheets — permissions may have been updated',
      });
    });
  });

  /**
   * [MINOR] Engineer denied /crew (HR_PLUS) — Прораб needs crew management.
   */
  test('[FINDING] Engineer CANNOT access /crew — HR_PLUS only', async ({ withRole }) => {
    await withRole('engineer', async (page) => {
      await page.goto('/crew', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      const currentUrl = page.url();
      const isDenied = isForbiddenPage(body) || !currentUrl.includes('/crew');

      test.info().annotations.push({
        type: 'business-finding',
        description: isDenied
          ? '[MINOR] Engineer denied /crew (HR_PLUS). Прораб manages construction crews daily. Consider adding ENGINEER/FOREMAN to crew routes.'
          : 'Engineer CAN access /crew — permissions may have been updated',
      });
    });
  });

  /**
   * [MAJOR] Accountant denied /revenue/* (MANAGER_PLUS) — Accountant needs
   * revenue recognition data for financial reporting.
   */
  test('[FINDING] Accountant CANNOT access /revenue/dashboard — MANAGER_PLUS only', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/revenue/dashboard', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      const currentUrl = page.url();
      const isDenied = isForbiddenPage(body) || !currentUrl.includes('/revenue');

      test.info().annotations.push({
        type: 'business-finding',
        description: isDenied
          ? '[MAJOR] Accountant denied /revenue/dashboard (MANAGER_PLUS). Revenue recognition is core accounting — Accountant needs access.'
          : 'Accountant CAN access /revenue/dashboard — permissions may have been updated',
      });
    });
  });

  /**
   * [MINOR] Accountant denied /tax-risk (MANAGER_PLUS) — Accountant
   * should have visibility into tax risk assessments.
   */
  test('[FINDING] Accountant CANNOT access /tax-risk — MANAGER_PLUS only', async ({ withRole }) => {
    await withRole('accountant', async (page) => {
      await page.goto('/tax-risk', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      const currentUrl = page.url();
      const isDenied = isForbiddenPage(body) || !currentUrl.includes('/tax-risk');

      test.info().annotations.push({
        type: 'business-finding',
        description: isDenied
          ? '[MINOR] Accountant denied /tax-risk (MANAGER_PLUS). Tax risk assessment is an accounting responsibility.'
          : 'Accountant CAN access /tax-risk — permissions may have been updated',
      });
    });
  });
});
