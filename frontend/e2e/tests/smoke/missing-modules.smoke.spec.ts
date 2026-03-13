/**
 * Smoke tests for 38 modules that had zero E2E coverage.
 * Each test navigates to the module's primary URL and verifies it loads.
 *
 * Uses smokeCheck() helper: load <10s, body >50 chars, no crash messages.
 */
import { test } from '../../fixtures/base.fixture';
import { smokeCheck } from '../../helpers/smoke.helper';

const BASE = process.env.BASE_URL || 'http://localhost:4000';

// ── Dashboard & Reports ──────────────────────────────────────────────

test.describe('Dashboard module', () => {
  test('/ — главная (дашборд)', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/`);
  });
});

test.describe('Reports module', () => {
  test('/reports — отчёты', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/reports`);
  });
});

// ── Planning ─────────────────────────────────────────────────────────

test.describe('Gantt module', () => {
  test('/planning/gantt — диаграмма Ганта', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/planning/gantt`);
  });
});

test.describe('EVM module', () => {
  test('/planning/evm — анализ освоенного объёма', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/planning/evm`);
  });
});

test.describe('Resources module', () => {
  test('/planning/resource-planning — ресурсное планирование', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/planning/resource-planning`);
  });
});

// ── PM ───────────────────────────────────────────────────────────────

test.describe('RFIs module', () => {
  test('/pm/rfis — запросы информации', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/pm/rfis`);
  });
});

test.describe('Submittals module', () => {
  test('/pm/submittals — согласования', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/pm/submittals`);
  });
});

test.describe('Issues module', () => {
  test('/pm/issues — проблемы', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/pm/issues`);
  });
});

test.describe('Workflows module', () => {
  test('/workflow/templates — шаблоны процессов', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/workflow/templates`);
  });
});

// ── CRM & Portfolio ──────────────────────────────────────────────────

test.describe('Site assessments module', () => {
  test('/site-assessments — осмотры площадок', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/site-assessments`);
  });
});

test.describe('Opportunities module', () => {
  test('/portfolio/opportunities — возможности', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/portfolio/opportunities`);
  });
});

test.describe('Tenders module', () => {
  test('/portfolio/tenders — тендеры', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/portfolio/tenders`);
  });
});

test.describe('Bid packages module', () => {
  test('/bid-packages — тендерные пакеты', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/bid-packages`);
  });
});

// ── Finance ──────────────────────────────────────────────────────────

test.describe('Budgets module', () => {
  test('/budgets — бюджеты', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/budgets`);
  });
});

test.describe('Financial models module', () => {
  test('/financial-models — финансовые модели', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/financial-models`);
  });
});

test.describe('Invoices module', () => {
  test('/invoices — счета', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/invoices`);
  });
});

test.describe('Payments module', () => {
  test('/payments — платежи', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/payments`);
  });
});

test.describe('Cash-flow module', () => {
  test('/cash-flow — движение денежных средств', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/cash-flow`);
  });
});

test.describe('Execution chain module', () => {
  test('/execution-chain — цепочка исполнения', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/execution-chain`);
  });
});

test.describe('Revenue module', () => {
  test('/revenue/dashboard — выручка', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/revenue/dashboard`);
  });
});

// ── Specifications & Estimates ───────────────────────────────────────

test.describe('Specifications module', () => {
  test('/specifications — спецификации', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/specifications`);
  });
});

test.describe('Competitive lists module', () => {
  test('/specifications/competitive-registry — конкурентные листы', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/specifications/competitive-registry`);
  });
});

// ── Operations ───────────────────────────────────────────────────────

test.describe('Operations module', () => {
  test('/operations/work-orders — наряд-задания', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/operations/work-orders`);
  });
});

// ── HR ───────────────────────────────────────────────────────────────

test.describe('Employees module', () => {
  test('/employees — сотрудники', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/employees`);
  });
});

test.describe('Crew module', () => {
  test('/crew — бригады', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/crew`);
  });
});

test.describe('Timesheets module', () => {
  test('/timesheets — табели', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/timesheets`);
  });
});

test.describe('Leave module', () => {
  test('/leave/requests — заявки на отпуск', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/leave/requests`);
  });
});

// ── Safety ───────────────────────────────────────────────────────────

test.describe('Incidents module', () => {
  test('/safety/incidents — происшествия', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/safety/incidents`);
  });
});

test.describe('Training module', () => {
  test('/safety/training-journal — журнал обучения', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/safety/training-journal`);
  });
});

// ── Closeout ─────────────────────────────────────────────────────────

test.describe('Commissioning module', () => {
  test('/closeout/commissioning — пусконаладка', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/closeout/commissioning`);
  });
});

test.describe('Warranty module', () => {
  test('/closeout/warranty — гарантия', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/closeout/warranty`);
  });
});

test.describe('Insurance module', () => {
  test('/closeout/insurance — страхование', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/closeout/insurance`);
  });
});

// ── Communication ────────────────────────────────────────────────────

test.describe('Messaging module', () => {
  test('/messaging — мессенджер', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/messaging`);
  });
});

test.describe('Mail module', () => {
  test('/mail — почта', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/mail`);
  });
});

// ── Admin & Settings ─────────────────────────────────────────────────

test.describe('Permissions module', () => {
  test('/admin/permissions — матрица прав', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/admin/permissions`);
  });
});

test.describe('Support module', () => {
  test('/support/tickets — заявки поддержки', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/support/tickets`);
  });
});

test.describe('Settings module', () => {
  test('/settings — настройки', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/settings`);
  });
});

test.describe('Subscription module', () => {
  test('/settings/subscription — подписка', async ({ trackedPage: page }) => {
    await smokeCheck(page, `${BASE}/settings/subscription`);
  });
});
