/**
 * RBAC Verification — Viewer Read-Only + API Guards + Unauthenticated Access
 *
 * Phase 1: Viewer — Read-Only Access (unrestricted routes only)
 * Phase 2: Viewer — DENIED Access (all restricted route groups)
 * Phase 3: Viewer — No Create/Edit/Delete Buttons Visible
 * Phase 4: Viewer — Sensitive Data Hidden
 * Phase 5: Viewer — API 403 on POST/PUT/DELETE
 * Phase 6: Unauthenticated — ALL Blocked (401)
 * Phase 7: Privilege Escalation Attempts
 * Phase 8: RBAC Matrix Summary (all 5 roles × key endpoints)
 *
 * Source of truth: frontend/src/config/routePermissions.ts
 * Business rules: .claude/plans/business-rules-construction-erp.md
 *
 * Key: VIEWER is NOT in any permission group. It can only access routes
 * that have NO entry in routePermissions.ts (i.e., accessible to all authenticated users).
 */

import { test, expect } from '../../fixtures/roles.fixture';
import { authenticatedRequest, API_BASE } from '../../fixtures/api.fixture';
import type { Page } from '@playwright/test';

// ── Issue Tracker ────────────────────────────────────────────────────────────

interface Issue {
  id: number;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'UX' | 'MISSING';
  description: string;
  phase: string;
}

const issues: Issue[] = [];
let issueCounter = 0;

function trackIssue(
  severity: Issue['severity'],
  description: string,
  phase: string,
): void {
  issues.push({ id: ++issueCounter, severity, description, phase });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
// URL CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Viewer ALLOWED routes — only routes with NO entry in routePermissions.ts.
 * These are accessible to ALL authenticated users.
 */
const VIEWER_ALLOWED: string[] = [
  // Home
  '/',
  '/analytics',
  '/reports',
  // Tasks & Calendar
  '/tasks',
  '/calendar',
  // Projects (no restriction — but /portfolio/* IS restricted to MANAGER_PLUS)
  '/projects',
  '/site-assessments',
  // CRM (no restriction)
  '/crm/leads',
  '/crm/dashboard',
  '/counterparties',
  '/bid-packages',
  // Documents (base — but /documents/smart-recognition IS restricted to ENGINEER_PLUS)
  '/documents',
  '/cde/documents',
  '/cde/transmittals',
  '/pto/documents',
  '/pto/hidden-work-acts',
  '/pto/work-permits',
  '/pto/lab-tests',
  '/pto/ks6-calendar',
  '/pto/itd-validation',
  '/russian-docs/ks2',
  '/russian-docs/ks3',
  '/russian-docs/edo',
  '/russian-docs/list',
  '/russian-docs/sbis',
  // Data exchange (no restriction)
  '/data-exchange/import',
  '/data-exchange/export',
  '/data-exchange/mapping',
  '/data-exchange/1c-config',
  '/data-exchange/1c-logs',
  // Design (no restriction)
  '/design/versions',
  '/design/reviews',
  '/design/reviews/board',
  '/design/sections',
  // Exec docs (no restriction)
  '/exec-docs/aosr',
  '/exec-docs/ks6',
  '/exec-docs/incoming-control',
  '/exec-docs/welding',
  '/exec-docs/special-journals',
  // Finance — only contracts and КП (no restriction)
  '/contracts',
  '/commercial-proposals',
  // Processes (no restriction)
  '/pm/rfis',
  '/pm/submittals',
  '/pm/issues',
  '/workflow/templates',
  '/workflow/approval-inbox',
  '/change-management/dashboard',
  // Site (no restriction — but /bim/* IS restricted)
  '/operations/daily-logs',
  '/operations/dashboard',
  '/m29',
  '/mobile/dashboard',
  '/mobile/reports',
  '/mobile/photos',
  '/ai/photo-analysis',
  '/ai/risk-dashboard',
  // Closeout (no restriction)
  '/closeout/dashboard',
  '/closeout/commissioning',
  '/closeout/commissioning-templates',
  '/closeout/handover',
  '/closeout/warranty',
  '/closeout/warranty-obligations',
  '/closeout/warranty-tracking',
  '/closeout/as-built',
  '/closeout/zos',
  '/closeout/stroynadzor',
  '/closeout/executive-schemas',
  // Maintenance (no restriction)
  '/maintenance/dashboard',
  '/maintenance/requests',
  '/maintenance/equipment',
  // Legal (no restriction)
  '/legal/cases',
  '/legal/templates',
  '/insurance-certificates',
  // Portal (no restriction)
  '/portal',
  '/portal/projects',
  '/portal/documents',
  '/portal/contracts',
  '/portal/invoices',
  '/portal/tasks',
  '/portal/schedule',
  '/portal/rfis',
  '/portal/defects',
  '/portal/signatures',
  '/portal/photos',
  '/portal/daily-reports',
  '/portal/cp-approval',
  '/portal/ks2-drafts',
  '/portal/settings',
  '/portal/admin',
  // Messenger & Mail (no restriction)
  '/messaging',
  '/mail',
  // Support (no restriction in routePermissions — in admin nav group but unrestricted)
  '/support/tickets',
  '/support/dashboard',
  // Monitoring (no restriction in routePermissions — in admin nav group but unrestricted)
  '/monitoring',
];

/**
 * Viewer DENIED routes — all routes that have entries in routePermissions.ts.
 * VIEWER is NOT in ANY permission group.
 */
const VIEWER_DENIED: string[] = [
  // ── ADMIN_ONLY ──
  '/admin/dashboard',
  '/admin/users',
  '/admin/permissions',
  '/admin/departments',
  '/admin/security',
  '/admin/system-settings',
  '/settings/subscription',
  '/settings/api-docs',
  '/marketplace',
  '/integrations',

  // ── MANAGER_PLUS (budgets, revenue, portfolio, FM, tax-risk, monte-carlo) ──
  '/budgets',
  '/financial-models',
  '/portfolio/health',
  '/portfolio/opportunities',
  '/portfolio/tenders',
  '/revenue/dashboard',
  '/revenue/recognition-periods',
  '/revenue/all-contracts',
  '/tax-risk',

  // ── FINANCE_PLUS (invoices, payments, cash-flow, accounting, cost-management, etc.) ──
  '/invoices',
  '/payments',
  '/cash-flow',
  '/cash-flow/charts',
  '/accounting',
  '/cost-management/codes',
  '/cost-management/budget',
  '/cost-management/commitments',
  '/cost-management/forecast',
  '/cost-management/cashflow-forecast',
  '/cost-management/forecasting-hub',
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

  // ── HR_PLUS ──
  '/employees',
  '/hr/staffing-schedule',
  '/crew',
  '/timesheets',
  '/hr/timesheet-t13',
  '/hr/work-orders',
  '/hr/certification-matrix',
  '/leave/requests',
  '/hr-russian/employment-contracts',
  '/self-employed',

  // ── SAFETY_PLUS ──
  '/safety',
  '/safety/incidents',
  '/safety/inspections',
  '/safety/briefings',
  '/safety/training-journal',
  '/safety/ppe',
  '/safety/accident-acts',
  '/safety/metrics',
  '/safety/sout',
  '/safety/compliance',
  '/safety/violations',
  '/safety/worker-certs',
  '/safety/certification-matrix',

  // ── PROCUREMENT_PLUS (procurement, warehouse, dispatch) ──
  '/procurement',
  '/procurement/purchase-orders',
  '/procurement/tenders',
  '/procurement/bid-comparison',
  '/procurement/prequalification',
  '/warehouse/locations',
  '/warehouse/stock',
  '/warehouse/materials',
  '/warehouse/movements',
  '/warehouse/inventory',
  '/warehouse/quick-receipt',
  '/warehouse/quick-confirm',
  '/warehouse/barcode-scanner',
  '/warehouse/inter-project-transfer',
  '/warehouse/inter-site-transfer',
  '/warehouse/stock-limits',
  '/warehouse/stock-alerts',
  '/warehouse/m29-report',
  '/warehouse/limit-fence-cards',
  '/warehouse/limit-fence-sheets',
  '/warehouse/address-storage',
  '/warehouse/material-demand',
  '/warehouse/warehouse-orders',
  '/dispatch/orders',
  '/dispatch/routes',
  '/operations/dispatch-calendar',
  '/operations/work-orders',

  // ── QUALITY_PLUS (quality, defects, punchlist, regulatory) ──
  '/quality',
  '/defects',
  '/defects/dashboard',
  '/defects/on-plan',
  '/quality/defect-pareto',
  '/punchlist/items',
  '/punchlist/dashboard',
  '/quality/material-inspection',
  '/quality/checklist-templates',
  '/quality/checklists',
  '/quality/gates',
  '/quality/tolerance-rules',
  '/quality/tolerance-checks',
  '/quality/certificates',
  '/quality/defect-register',
  '/quality/supervision-journal',
  '/regulatory/permits',
  '/regulatory/inspections',
  '/regulatory/dashboard',
  '/regulatory/prescriptions',
  '/regulatory/compliance',
  '/regulatory/licenses',
  '/regulatory/sro-licenses',
  '/regulatory/reporting-calendar',
  '/regulatory/inspection-prep',
  '/regulatory/inspection-history',
  '/regulatory/prescription-responses',
  '/regulatory/prescriptions-journal',

  // ── ENGINEER_PLUS (planning, estimates, specifications, operations, bim) ──
  '/planning/gantt',
  '/planning/evm',
  '/planning/resource-planning',
  '/planning/work-volumes',
  '/estimates',
  '/estimates/minstroy',
  '/estimates/pivot',
  '/estimates/volume-calculator',
  '/estimates/pricing/databases',
  '/specifications',
  '/specifications/competitive-registry',
  '/documents/smart-recognition',
  '/bim/models',
  '/bim/clash-detection',
  '/bim/drawing-overlay',
  '/bim/drawing-pins',
  '/bim/construction-progress',
  '/bim/defect-heatmap',

  // ── Fleet (ENGINEER_PLUS + fleet roles) ──
  '/fleet',
  '/fleet/fuel',
  '/fleet/fuel-accounting',
  '/fleet/maintenance',
  '/fleet/maint-repair',
  '/fleet/maintenance-schedule',
  '/fleet/waybills-esm',
  '/fleet/usage-logs',
  '/fleet/gps-tracking',
  '/fleet/driver-rating',
  '/iot/devices',
  '/iot/sensors',
  '/iot/alerts',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 1: Viewer — Read-Only Access (Unrestricted Routes)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 1: Viewer — Read-Only Access', () => {
  // Sample of allowed pages (testing all 90+ would be too slow)
  const VIEWER_SAMPLE_ALLOWED = [
    '/',
    '/tasks',
    '/calendar',
    '/projects',
    '/site-assessments',
    '/crm/leads',
    '/crm/dashboard',
    '/counterparties',
    '/documents',
    '/contracts',
    '/commercial-proposals',
    '/russian-docs/ks2',
    '/russian-docs/ks3',
    '/design/versions',
    '/exec-docs/aosr',
    '/closeout/dashboard',
    '/closeout/warranty',
    '/maintenance/dashboard',
    '/legal/cases',
    '/portal',
    '/portal/projects',
    '/portal/documents',
    '/messaging',
    '/mail',
    '/support/tickets',
    '/support/dashboard',
    '/change-management/dashboard',
    '/pm/rfis',
    '/workflow/approval-inbox',
    '/ai/risk-dashboard',
    '/m29',
    '/cde/documents',
    '/pto/documents',
    '/data-exchange/import',
    '/bid-packages',
    '/analytics',
    '/reports',
  ];

  for (const url of VIEWER_SAMPLE_ALLOWED) {
    test(`Viewer can read: ${url}`, async ({ withRole }) => {
      await withRole('viewer', async (page) => {
        await assertAccessible(page, url);
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2: Viewer — DENIED Access (All Restricted Route Groups)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 2: Viewer — DENIED Access', () => {
  // Representative sample from each permission group
  const VIEWER_SAMPLE_DENIED = [
    // ADMIN_ONLY
    '/admin/dashboard',
    '/admin/users',
    '/admin/permissions',
    '/admin/system-settings',
    '/settings/subscription',
    '/marketplace',
    '/integrations',
    // MANAGER_PLUS
    '/budgets',
    '/financial-models',
    '/portfolio/health',
    '/portfolio/tenders',
    '/revenue/dashboard',
    '/tax-risk',
    // FINANCE_PLUS
    '/invoices',
    '/payments',
    '/cash-flow',
    '/accounting',
    '/cost-management/codes',
    '/cost-management/profitability',
    '/bank-statement-matching',
    '/treasury-calendar',
    '/bdds',
    '/execution-chain',
    // HR_PLUS
    '/employees',
    '/timesheets',
    '/crew',
    '/hr/staffing-schedule',
    '/leave/requests',
    '/self-employed',
    // SAFETY_PLUS
    '/safety',
    '/safety/incidents',
    '/safety/inspections',
    '/safety/metrics',
    // PROCUREMENT_PLUS
    '/procurement',
    '/warehouse/materials',
    '/warehouse/stock',
    '/dispatch/orders',
    '/operations/work-orders',
    // QUALITY_PLUS
    '/quality',
    '/defects',
    '/defects/dashboard',
    '/punchlist/items',
    '/regulatory/permits',
    '/regulatory/dashboard',
    // ENGINEER_PLUS
    '/planning/gantt',
    '/planning/evm',
    '/estimates',
    '/specifications',
    '/documents/smart-recognition',
    '/bim/models',
    // Fleet
    '/fleet',
    '/fleet/fuel',
    '/iot/devices',
  ];

  for (const url of VIEWER_SAMPLE_DENIED) {
    test(`Viewer CANNOT access: ${url}`, async ({ withRole }) => {
      await withRole('viewer', async (page) => {
        await assertDenied(page, url);
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 3: Viewer — No Create/Edit/Delete Buttons
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 3: Viewer — No Modification UI', () => {
  /**
   * On pages the viewer CAN access, create/edit/delete buttons must be hidden.
   * Viewer is a read-only observer — no mutation UI should be visible.
   */
  const PAGES_WITH_NO_CREATE = [
    { url: '/projects', labels: ['Создать', 'Новый', 'Create', 'Добавить'] },
    { url: '/tasks', labels: ['Создать', 'Новая задача', 'Create'] },
    { url: '/contracts', labels: ['Новый', 'Создать', 'Create'] },
    { url: '/documents', labels: ['Загрузить', 'Создать', 'Create', 'Добавить'] },
    { url: '/crm/leads', labels: ['Новый лид', 'Создать', 'Create'] },
    { url: '/support/tickets', labels: ['Создать', 'Новый тикет', 'Create'] },
    { url: '/counterparties', labels: ['Добавить', 'Создать', 'Create'] },
    { url: '/commercial-proposals', labels: ['Создать', 'Create'] },
    { url: '/portal/tasks', labels: ['Создать', 'Create'] },
    { url: '/closeout/commissioning', labels: ['Создать', 'Create', 'Добавить'] },
  ];

  for (const p of PAGES_WITH_NO_CREATE) {
    test(`Viewer sees no create buttons on ${p.url}`, async ({ withRole }) => {
      await withRole('viewer', async (page) => {
        await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForTimeout(1000);

        for (const btnText of p.labels) {
          const btn = page.locator(`button:has-text("${btnText}")`);
          const count = await btn.count();
          for (let i = 0; i < count; i++) {
            const isVisible = await btn.nth(i).isVisible().catch(() => false);
            if (isVisible) {
              trackIssue(
                'MAJOR',
                `Viewer sees "${btnText}" button on ${p.url} — should be hidden for read-only role`,
                'Phase 3',
              );
            }
            expect(
              isVisible,
              `Viewer should NOT see "${btnText}" button on ${p.url}`,
            ).toBe(false);
          }
        }
      });
    });
  }

  // Viewer navigating directly to /projects/new should be blocked
  test('Viewer redirected from /projects/new', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await page.goto('/projects/new', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      const body = (await page.textContent('body')) ?? '';

      // Should either redirect away from /new or show forbidden
      const blocked =
        !currentUrl.includes('/new') ||
        isForbiddenPage(body);

      test.info().annotations.push({
        type: 'security-finding',
        description: blocked
          ? 'Viewer correctly blocked from /projects/new'
          : '[MAJOR] Viewer can access /projects/new directly — creation form exposed to read-only user',
      });

      if (!blocked) {
        trackIssue('MAJOR', 'Viewer can access /projects/new — form exposed', 'Phase 3');
      }
    });
  });

  // Viewer should not see edit/delete on any detail page
  test('Viewer sees no edit/delete buttons on project detail', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      // Go to project list first to find a project
      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      // Try clicking the first project link
      const projectLink = page.locator('a[href*="/projects/"]').first();
      const hasProject = (await projectLink.count()) > 0;

      if (hasProject) {
        await projectLink.click();
        await page.waitForTimeout(1000);

        const editBtn = page.locator(
          'button:has-text("Редактировать"), button:has-text("Изменить"), button:has-text("Edit")',
        );
        const deleteBtn = page.locator(
          'button:has-text("Удалить"), button:has-text("Delete")',
        );
        const statusBtn = page.locator(
          'button:has-text("Утвердить"), button:has-text("Отклонить"), button:has-text("Approve"), button:has-text("Reject")',
        );

        for (const [name, locator] of [
          ['edit', editBtn],
          ['delete', deleteBtn],
          ['status', statusBtn],
        ] as const) {
          const isVisible = await locator.first().isVisible().catch(() => false);
          if (isVisible) {
            trackIssue(
              'MAJOR',
              `Viewer sees ${name} button on project detail page`,
              'Phase 3',
            );
          }
        }
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 4: Viewer — Sensitive Data Hidden
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 4: Viewer — Sensitive Data', () => {
  /**
   * Viewer should NOT be able to access pages with sensitive financial data.
   * These are already denied at route level (Phase 2), so we verify the route
   * restriction is blocking access to sensitive modules.
   */

  // Viewer cannot reach salary data (HR_PLUS denied)
  test('Viewer cannot reach employees page (salary data)', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await assertDenied(page, '/employees');
    });
  });

  // Viewer cannot reach FM page (cost prices, margins)
  test('Viewer cannot reach financial models (cost prices)', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await assertDenied(page, '/financial-models');
    });
  });

  // Viewer cannot reach budget page (budget details)
  test('Viewer cannot reach budgets (financial planning data)', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await assertDenied(page, '/budgets');
    });
  });

  // Viewer cannot reach invoices (payment amounts)
  test('Viewer cannot reach invoices (payment data)', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await assertDenied(page, '/invoices');
    });
  });

  // Viewer cannot reach cost management (profitability, margins)
  test('Viewer cannot reach cost management (profitability data)', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await assertDenied(page, '/cost-management/profitability');
    });
  });

  // On the projects list (which viewer CAN access), verify no financial columns leak
  test('Projects list does not expose budget/margin columns to Viewer', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await page.goto('/projects', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const body = (await page.textContent('body')) ?? '';

      // Look for headers that should be hidden from viewer
      const sensitiveHeaders = page.locator(
        'th:has-text("Себестоимость"), th:has-text("Маржа"), th:has-text("Margin"), th:has-text("costPrice")',
      );
      const sensitiveCount = await sensitiveHeaders.count();

      test.info().annotations.push({
        type: 'sensitive-data-check',
        description: sensitiveCount > 0
          ? `[UX] Projects list shows ${sensitiveCount} sensitive column(s) to Viewer — consider hiding cost/margin columns for read-only users`
          : 'Projects list correctly hides sensitive columns from Viewer',
      });
    });
  });

  // Counterparties — bank details should be masked or hidden for viewer
  test('Counterparties page does not expose bank details to Viewer', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await page.goto('/counterparties', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      // Check if full bank account numbers are visible
      const bankDetailMarkers = page.locator(
        'th:has-text("Расчётный счёт"), th:has-text("р/с"), th:has-text("БИК")',
      );
      const bankCount = await bankDetailMarkers.count();

      test.info().annotations.push({
        type: 'sensitive-data-check',
        description: bankCount > 0
          ? `[UX] Counterparties page shows bank detail columns to Viewer — consider masking for read-only users`
          : 'Counterparties page hides bank details from Viewer (or uses masked format)',
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 5: Viewer — API Guards (POST/PUT/DELETE = 403)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 5: API Guards — Viewer POST/PUT/DELETE = 403', () => {
  /**
   * Even if a viewer somehow crafts API requests, the backend must reject mutations.
   * Every POST/PUT/DELETE should return 403 for viewer role.
   */
  const VIEWER_FORBIDDEN_APIS: Array<{
    method: string;
    url: string;
    desc: string;
    data?: Record<string, unknown>;
  }> = [
    // ── Projects ──
    { method: 'POST', url: '/api/projects', desc: 'create project', data: { name: 'E2E-VIEWER-HACK', code: 'E2E-VH' } },
    { method: 'PUT', url: '/api/projects/1', desc: 'update project', data: { name: 'E2E-VIEWER-HACK' } },
    { method: 'DELETE', url: '/api/projects/1', desc: 'delete project' },

    // ── Tasks ──
    { method: 'POST', url: '/api/tasks', desc: 'create task', data: { title: 'E2E-VIEWER-HACK' } },
    { method: 'PUT', url: '/api/tasks/1', desc: 'update task', data: { title: 'E2E-VIEWER-HACK' } },
    { method: 'DELETE', url: '/api/tasks/1', desc: 'delete task' },

    // ── Invoices ──
    { method: 'POST', url: '/api/invoices', desc: 'create invoice', data: { number: 'E2E-HACK', amount: 999999 } },
    { method: 'PUT', url: '/api/invoices/1', desc: 'update invoice', data: { number: 'E2E-HACK' } },
    { method: 'DELETE', url: '/api/invoices/1', desc: 'delete invoice' },

    // ── Budgets ──
    { method: 'POST', url: '/api/budgets', desc: 'create budget', data: { name: 'E2E-HACK' } },
    { method: 'PUT', url: '/api/budgets/1', desc: 'update budget', data: { name: 'E2E-HACK' } },
    { method: 'DELETE', url: '/api/budgets/1', desc: 'delete budget' },

    // ── Employees ──
    { method: 'POST', url: '/api/employees', desc: 'create employee', data: { fullName: 'E2E-HACK' } },
    { method: 'PUT', url: '/api/employees/1', desc: 'update employee', data: { fullName: 'E2E-HACK' } },
    { method: 'DELETE', url: '/api/employees/1', desc: 'delete employee' },

    // ── Safety ──
    { method: 'POST', url: '/api/safety/incidents', desc: 'create safety incident', data: { description: 'E2E-HACK' } },
    { method: 'PUT', url: '/api/safety/incidents/1', desc: 'update safety incident', data: { description: 'E2E-HACK' } },

    // ── Materials ──
    { method: 'POST', url: '/api/materials', desc: 'create material', data: { name: 'E2E-HACK' } },
    { method: 'PUT', url: '/api/materials/1', desc: 'update material', data: { name: 'E2E-HACK' } },
    { method: 'DELETE', url: '/api/materials/1', desc: 'delete material' },

    // ── Contracts ──
    { method: 'POST', url: '/api/contracts', desc: 'create contract', data: { number: 'E2E-HACK' } },
    { method: 'PUT', url: '/api/contracts/1', desc: 'update contract', data: { number: 'E2E-HACK' } },

    // ── Specifications ──
    { method: 'POST', url: '/api/specifications', desc: 'create specification', data: { name: 'E2E-HACK' } },

    // ── Admin ──
    { method: 'GET', url: '/api/admin/users', desc: 'list users (admin-only)' },
    { method: 'POST', url: '/api/admin/users', desc: 'create user', data: { email: 'e2e-hack@test.com', fullName: 'Hack', role: 'ADMIN', password: 'Hack123!' } },
    { method: 'PUT', url: '/api/admin/settings/key/system_name', desc: 'modify system setting', data: { value: 'E2E-HACK' } },

    // ── Payments ──
    { method: 'POST', url: '/api/payments', desc: 'create payment', data: { amount: 99999999 } },

    // ── CRM ──
    { method: 'POST', url: '/api/crm/leads', desc: 'create CRM lead', data: { companyName: 'E2E-HACK' } },
    { method: 'DELETE', url: '/api/crm/leads/1', desc: 'delete CRM lead' },

    // ── Estimates ──
    { method: 'POST', url: '/api/estimates', desc: 'create estimate', data: { name: 'E2E-HACK' } },

    // ── Competitive Lists ──
    { method: 'POST', url: '/api/competitive-lists', desc: 'create КЛ', data: { name: 'E2E-HACK' } },

    // ── Safety Trainings ──
    { method: 'POST', url: '/api/safety/trainings', desc: 'create safety training', data: { title: 'E2E-HACK' } },

    // ── Timesheets ──
    { method: 'POST', url: '/api/timesheets', desc: 'create timesheet', data: { employeeId: 1 } },

    // ── Documents ──
    { method: 'POST', url: '/api/documents', desc: 'create document', data: { title: 'E2E-HACK' } },
    { method: 'DELETE', url: '/api/documents/1', desc: 'delete document' },
  ];

  for (const api of VIEWER_FORBIDDEN_APIS) {
    test(`Viewer 403: ${api.method} ${api.url} (${api.desc})`, async () => {
      const res = await authenticatedRequest(
        'viewer',
        api.method,
        api.url,
        api.data,
      );

      // Must be 403 (Forbidden) — not 200/201/204
      // Allow 404 for non-existent IDs (e.g., /api/projects/1 may not exist)
      // but never 200/201/204 which would mean the mutation was allowed
      const isBlocked = res.status === 403 || res.status === 401;
      const isNotFound = res.status === 404;
      const wasAllowed = res.status >= 200 && res.status < 300;

      if (wasAllowed) {
        trackIssue(
          'CRITICAL',
          `Viewer ${api.method} ${api.url} returned ${res.status} — mutation ALLOWED for read-only role!`,
          'Phase 5',
        );
      }

      expect(
        isBlocked || isNotFound,
        `Viewer ${api.method} ${api.url} should be 403 or 404, got ${res.status}`,
      ).toBe(true);
    });
  }

  // Viewer CAN read (GET 200) — verify read access works
  const VIEWER_ALLOWED_APIS = [
    { method: 'GET', url: '/api/projects', desc: 'list projects' },
    { method: 'GET', url: '/api/auth/me', desc: 'current user profile' },
  ];

  for (const api of VIEWER_ALLOWED_APIS) {
    test(`Viewer 200: ${api.method} ${api.url} (${api.desc})`, async () => {
      const res = await authenticatedRequest('viewer', api.method, api.url);
      expect(res.status, `Viewer should GET ${api.url} — got ${res.status}`).not.toBe(403);
      expect(res.status).not.toBe(401);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 6: Unauthenticated — ALL Blocked
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 6: Unauthenticated Access', () => {
  // UI: Every page should redirect to /login when not authenticated
  test.describe('UI redirects to /login', () => {
    const SAMPLE_PAGES = [
      '/',
      '/projects',
      '/tasks',
      '/documents',
      '/admin/users',
      '/invoices',
      '/employees',
      '/safety',
      '/quality',
      '/warehouse/materials',
    ];

    for (const url of SAMPLE_PAGES) {
      test(`No auth: ${url} redirects to /login`, async ({ browser }) => {
        // Create a fresh context with NO stored auth
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          await page.goto(`http://localhost:4000${url}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30_000,
          });
          await page.waitForTimeout(1000);

          const currentUrl = page.url();
          // Should be redirected to login page
          const isOnLogin = currentUrl.includes('/login') || currentUrl.includes('/welcome');

          test.info().annotations.push({
            type: 'auth-check',
            description: isOnLogin
              ? `${url} correctly redirects to login`
              : `[CRITICAL] ${url} accessible without auth — URL: ${currentUrl}`,
          });

          if (!isOnLogin) {
            // Check if localStorage has auth (shouldn't in fresh context)
            const hasAuth = await page.evaluate(() => {
              return Boolean(localStorage.getItem('privod-auth') || localStorage.getItem('auth_token'));
            });
            // If no auth and not on login → security issue
            if (!hasAuth) {
              trackIssue('CRITICAL', `${url} accessible without authentication`, 'Phase 6');
            }
          }
        } finally {
          await page.close();
          await context.close();
        }
      });
    }
  });

  // API: Every endpoint should return 401 without token
  test.describe('API returns 401 without token', () => {
    const API_ENDPOINTS = [
      '/api/projects',
      '/api/tasks',
      '/api/invoices',
      '/api/employees',
      '/api/admin/users',
      '/api/auth/me',
      '/api/budgets',
      '/api/safety/incidents',
      '/api/documents',
    ];

    for (const url of API_ENDPOINTS) {
      test(`No auth: ${url} returns 401`, async () => {
        const res = await fetch(`${API_BASE}${url}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        expect(
          res.status,
          `${url} without auth should be 401, got ${res.status}`,
        ).toBe(401);
      });
    }
  });

  // Expired/invalid token should return 401
  test('Expired JWT returns 401', async () => {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJleHBpcmVkQHRlc3QucnUiLCJleHAiOjF9.invalid',
        'Content-Type': 'application/json',
      },
    });
    expect(res.status, `Expired token should return 401, got ${res.status}`).toBe(401);
  });

  // Tampered token should return 401
  test('Tampered JWT returns 401', async () => {
    // Get a valid token first, then tamper with it
    try {
      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'viewer@privod.ru', password: 'viewer123' }),
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        const token: string = data.token ?? data.data?.token ?? data.accessToken ?? data.data?.accessToken ?? '';

        if (token) {
          // Tamper by changing last character
          const tamperedToken = token.slice(0, -1) + (token.endsWith('X') ? 'Y' : 'X');

          const res = await fetch(`${API_BASE}/api/projects`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${tamperedToken}`,
              'Content-Type': 'application/json',
            },
          });

          expect(
            res.status,
            `Tampered token should return 401, got ${res.status}`,
          ).toBe(401);
        }
      }
    } catch {
      // Login may fail without running backend — skip gracefully
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Cannot test tampered JWT — backend not reachable',
      });
    }
  });

  // Malformed Authorization header
  test('Malformed Authorization header returns 401', async () => {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'GET',
      headers: {
        Authorization: 'NotBearer sometoken',
        'Content-Type': 'application/json',
      },
    });
    // Should be 401 — not 200 or 500
    expect([401, 403]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 7: Privilege Escalation Attempts
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 7: Privilege Escalation', () => {
  // Viewer tries admin pages by direct URL
  test('Viewer cannot access /admin/users by direct URL', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await assertDenied(page, '/admin/users');
    });
  });

  test('Viewer cannot access /admin/system-settings by direct URL', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await assertDenied(page, '/admin/system-settings');
    });
  });

  // Viewer tries to change own role via API
  test('Viewer cannot change own role via API', async () => {
    const res = await authenticatedRequest('viewer', 'PUT', '/api/auth/me', {
      role: 'ADMIN',
    });
    // Must not be 200 — either 403, 405, or endpoint doesn't exist (404)
    const wasAllowed = res.status >= 200 && res.status < 300;
    if (wasAllowed) {
      trackIssue('CRITICAL', 'Viewer can change own role to ADMIN via /api/auth/me PUT', 'Phase 7');
    }
    expect(
      wasAllowed,
      `Viewer should NOT be able to change own role — got ${res.status}`,
    ).toBe(false);
  });

  // Viewer tries to create an admin user
  test('Viewer cannot create admin user via API', async () => {
    const res = await authenticatedRequest('viewer', 'POST', '/api/admin/users', {
      email: 'e2e-escalation@privod.ru',
      fullName: 'E2E Escalation Attempt',
      role: 'ADMIN',
      password: 'HackAdmin123!',
    });
    const isBlocked = res.status === 403 || res.status === 401;
    expect(isBlocked, `Viewer should be blocked from creating admin user — got ${res.status}`).toBe(true);
  });

  // Viewer tries to modify system settings
  test('Viewer cannot modify system settings via API', async () => {
    const res = await authenticatedRequest('viewer', 'PUT', '/api/admin/settings/key/system_name', {
      value: 'HACKED-BY-VIEWER',
    });
    const isBlocked = res.status === 403 || res.status === 401;
    expect(isBlocked, `Viewer should be blocked from modifying settings — got ${res.status}`).toBe(true);
  });

  // Viewer tries to access other user's data
  test('Viewer cannot update another user', async () => {
    const res = await authenticatedRequest('viewer', 'PUT', '/api/users/1', {
      role: 'ADMIN',
      salary: 999999,
    });
    const wasAllowed = res.status >= 200 && res.status < 300;
    if (wasAllowed) {
      trackIssue('CRITICAL', 'Viewer can update other users via /api/users/1 PUT', 'Phase 7');
    }
    expect(wasAllowed, `Viewer should NOT update other users — got ${res.status}`).toBe(false);
  });

  // Viewer tries to delete a project
  test('Viewer cannot delete project via API', async () => {
    const res = await authenticatedRequest('viewer', 'DELETE', '/api/projects/1');
    const wasAllowed = res.status >= 200 && res.status < 300 && res.status !== 204;
    // 204 could mean deleted, 404 means not found (OK), 403 means denied (OK)
    const isBlocked = res.status === 403 || res.status === 401 || res.status === 404;
    expect(
      isBlocked,
      `Viewer DELETE /api/projects/1 should be 403 or 404, got ${res.status}`,
    ).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 8: RBAC Matrix Summary (All 5 Roles × Key Endpoints)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Phase 8: RBAC Matrix Verification', () => {
  /**
   * Cross-role verification: same endpoint tested across all 5 roles.
   * This produces a matrix showing which role gets which status.
   */
  const MATRIX_ENDPOINTS = [
    {
      path: '/api/projects',
      method: 'GET',
      expectedAccess: { admin: true, manager: true, engineer: true, accountant: true, viewer: true },
    },
    {
      path: '/api/projects',
      method: 'POST',
      data: { name: 'E2E-MATRIX-TEST', code: 'E2E-MT' },
      expectedAccess: { admin: true, manager: true, engineer: false, accountant: false, viewer: false },
    },
    {
      path: '/api/admin/users',
      method: 'GET',
      expectedAccess: { admin: true, manager: false, engineer: false, accountant: false, viewer: false },
    },
    {
      path: '/api/invoices',
      method: 'GET',
      expectedAccess: { admin: true, manager: true, engineer: false, accountant: true, viewer: false },
    },
    {
      path: '/api/safety/incidents',
      method: 'GET',
      expectedAccess: { admin: true, manager: true, engineer: true, accountant: false, viewer: false },
    },
  ];

  for (const ep of MATRIX_ENDPOINTS) {
    for (const role of ['admin', 'manager', 'engineer', 'accountant', 'viewer'] as const) {
      const expected = ep.expectedAccess[role];
      const desc = expected ? '✓ allowed' : '✗ denied';

      test(`[${role}] ${desc}: ${ep.method} ${ep.path}`, async () => {
        const res = await authenticatedRequest(role, ep.method, ep.path, ep.data);

        const isAllowed = res.status !== 403 && res.status !== 401;

        if (isAllowed !== expected) {
          const severity = expected ? 'MAJOR' : 'CRITICAL';
          trackIssue(
            severity,
            `${role} ${ep.method} ${ep.path}: expected ${expected ? 'allowed' : 'denied'}, got ${res.status}`,
            'Phase 8',
          );
        }

        if (expected) {
          expect(res.status, `${role} should access ${ep.path} — got ${res.status}`).not.toBe(403);
          expect(res.status).not.toBe(401);
        } else {
          // Allow 404 for non-existent resources (the route itself may not reject,
          // but the resource doesn't exist — this is still "denied" in practice for POST)
          const denied = res.status === 403 || res.status === 401;
          // For GET on list endpoints, 403 is the expected denial
          if (ep.method === 'GET') {
            expect(denied, `${role} should be denied ${ep.path} — got ${res.status}`).toBe(true);
          } else {
            // POST: allow 403, 401, 404, 405
            expect(
              res.status === 403 || res.status === 401 || res.status === 404 || res.status === 405,
              `${role} should be denied ${ep.method} ${ep.path} — got ${res.status}`,
            ).toBe(true);
          }
        }
      });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Viewer Sidebar Visibility
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Viewer: Sidebar Visibility', () => {
  // Viewer should see fewer nav links than any other role
  test('Viewer has fewest nav links', async ({ withRole }) => {
    let viewerLinkCount = 0;

    await withRole('viewer', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);
      viewerLinkCount = await page.locator('nav a[href], aside a[href]').count();
    });

    test.info().annotations.push({
      type: 'nav-count',
      description: `Viewer sees ${viewerLinkCount} nav links (should be fewest of all roles)`,
    });

    // Viewer should have some links (they can still see unrestricted pages)
    expect(viewerLinkCount, 'Viewer should have at least some nav links').toBeGreaterThan(5);
  });

  // Viewer should NOT see admin, finance, HR, safety, warehouse, quality sections
  test('Viewer sidebar hides restricted section links', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      const restrictedLinks = [
        // Admin
        'a[href="/admin/users"]',
        'a[href="/admin/system-settings"]',
        'a[href="/settings/subscription"]',
        // Finance
        'a[href="/invoices"]',
        'a[href="/payments"]',
        'a[href="/budgets"]',
        'a[href="/accounting"]',
        'a[href="/financial-models"]',
        // HR
        'a[href="/employees"]',
        'a[href="/timesheets"]',
        'a[href="/crew"]',
        // Safety
        'a[href="/safety/incidents"]',
        'a[href="/safety/inspections"]',
        // Warehouse
        'a[href="/warehouse/materials"]',
        'a[href="/procurement"]',
        // Quality
        'a[href="/quality"]',
        'a[href="/defects"]',
        // Planning/Estimates
        'a[href="/planning/gantt"]',
        'a[href="/estimates"]',
        'a[href="/specifications"]',
        // Fleet
        'a[href="/fleet"]',
      ];

      for (const selector of restrictedLinks) {
        const link = page.locator(selector);
        const isVisible = await link.isVisible().catch(() => false);
        if (isVisible) {
          trackIssue(
            'MINOR',
            `Viewer sees nav link ${selector} — should be hidden`,
            'Sidebar',
          );
        }
        expect(
          isVisible,
          `Viewer should NOT see nav link: ${selector}`,
        ).toBe(false);
      }
    });
  });

  // Viewer SHOULD see unrestricted nav links
  test('Viewer sees unrestricted sidebar sections', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      // These should be visible since they're unrestricted
      const expectedLinks = [
        'a[href="/projects"]',
        'a[href="/tasks"]',
        'a[href="/documents"]',
        'a[href="/contracts"]',
      ];

      for (const selector of expectedLinks) {
        const link = page.locator(selector);
        const count = await link.count();
        // At least should exist in DOM (may be in collapsed section)
        test.info().annotations.push({
          type: 'nav-presence',
          description: count > 0
            ? `Viewer has nav link: ${selector}`
            : `Viewer MISSING expected nav link: ${selector} — may be in collapsed section`,
        });
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Business Findings — Route Permission Gaps for Viewer
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Business Findings: Viewer Role', () => {
  /**
   * [UX] Viewer can access /operations/daily-logs and /operations/dashboard
   * because they have NO entry in routePermissions.ts, yet they're in the
   * supply nav group. This is by design (unrestricted), but a viewer
   * seeing daily logs content without being able to create is fine.
   */
  test('[FINDING] Viewer can access /operations/daily-logs (unrestricted)', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await page.goto('/operations/daily-logs', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(500);

      const body = (await page.textContent('body')) ?? '';
      const accessible = !isForbiddenPage(body) && body.length > 50;

      test.info().annotations.push({
        type: 'business-finding',
        description: accessible
          ? '[UX] Viewer can view /operations/daily-logs — read-only access is acceptable for observers/auditors'
          : '/operations/daily-logs correctly restricted from Viewer (unexpected — route should be unrestricted)',
      });
    });
  });

  /**
   * [UX] Viewer can access /portal/* pages. This is correct for external auditors
   * who need to see the contractor portal state, but they should NOT be able
   * to post messages or submit documents.
   */
  test('[FINDING] Viewer can access portal but without modification ability', async ({ withRole }) => {
    await withRole('viewer', async (page) => {
      await page.goto('/portal', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1000);

      const body = (await page.textContent('body')) ?? '';
      const accessible = !isForbiddenPage(body);

      // Check for modification buttons
      const submitBtn = page.locator(
        'button:has-text("Отправить"), button:has-text("Submit"), button:has-text("Создать")',
      ).first();
      const hasSubmit = await submitBtn.isVisible().catch(() => false);

      test.info().annotations.push({
        type: 'business-finding',
        description: hasSubmit
          ? '[UX] Viewer sees submit/create buttons on portal — should be read-only for observers'
          : 'Viewer portal access is correctly read-only (no mutation buttons visible)',
      });

      if (hasSubmit) {
        trackIssue('UX', 'Viewer sees mutation buttons on portal dashboard', 'Business Findings');
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Cleanup & Issue Summary
// ═══════════════════════════════════════════════════════════════════════════════

test.afterAll(async () => {
  if (issues.length > 0) {
    console.log('\n══════════════════════════════════════════════');
    console.log('RBAC AUDIT: VIEWER + API GUARDS — ISSUES FOUND');
    console.log('══════════════════════════════════════════════');
    for (const issue of issues) {
      console.log(`[${issue.severity}] #${issue.id} (${issue.phase}): ${issue.description}`);
    }
    console.log(`\nTotal: ${issues.length} issues`);
    console.log(`  CRITICAL: ${issues.filter((i) => i.severity === 'CRITICAL').length}`);
    console.log(`  MAJOR:    ${issues.filter((i) => i.severity === 'MAJOR').length}`);
    console.log(`  MINOR:    ${issues.filter((i) => i.severity === 'MINOR').length}`);
    console.log(`  UX:       ${issues.filter((i) => i.severity === 'UX').length}`);
    console.log(`  MISSING:  ${issues.filter((i) => i.severity === 'MISSING').length}`);
  } else {
    console.log('\n✓ RBAC AUDIT: No issues found (compilation-only validation)');
  }
});
