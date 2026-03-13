/**
 * Playwright screenshot automation for PRIVOD Platform.
 * Takes full-page screenshots of all routed pages.
 *
 * Usage:
 *   node scripts/take-screenshots.mjs              # all pages
 *   node scripts/take-screenshots.mjs --priority    # priority pages only (for quick-start)
 *   node scripts/take-screenshots.mjs --module=safety  # specific module
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../frontend/node_modules/playwright');
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const BASE_URL = 'http://localhost:4000';
const SCREENSHOTS_DIR = join(import.meta.dirname, '..', 'docs', 'knowledge-base', 'screenshots');
const LOGIN_EMAIL = 'admin@privod.ru';
const LOGIN_PASSWORD = 'admin123';
const TIMEOUT = 10_000;

// ─── Page definitions ──────────────────────────────────────────────
// Format: [module, pageName, urlPath, pageType]

const PRIORITY_PAGES = [
  // Dashboard
  ['dashboard', 'main-dashboard', '/', 'dashboard'],
  // Projects
  ['projects', 'list-projects', '/projects', 'list'],
  ['projects', 'create-project', '/projects/new', 'form'],
  // Estimates
  ['estimates', 'list-estimates', '/estimates', 'list'],
  ['estimates', 'import-lsr', '/estimates/import-lsr', 'form'],
  ['estimates', 'minstroy-index', '/estimates/minstroy', 'list'],
  // Specifications
  ['specifications', 'list-specifications', '/specifications', 'list'],
  ['specifications', 'create-specification', '/specifications/new', 'form'],
  ['specifications', 'competitive-registry', '/specifications/competitive-registry', 'list'],
  // Finance / Budgets
  ['finance', 'list-budgets', '/budgets', 'list'],
  ['finance', 'create-budget', '/budgets/new', 'form'],
  ['finance', 'financial-models', '/financial-models', 'list'],
  // Commercial Proposals
  ['finance', 'list-cp', '/commercial-proposals', 'list'],
  ['finance', 'create-cp', '/commercial-proposals/new', 'form'],
  // Invoices
  ['finance', 'list-invoices', '/invoices', 'list'],
  ['finance', 'create-invoice', '/invoices/new', 'form'],
  // Payments
  ['finance', 'list-payments', '/payments', 'list'],
  ['finance', 'create-payment', '/payments/new', 'form'],
  // Cash Flow
  ['finance', 'cash-flow', '/cash-flow', 'dashboard'],
  // Closing (KS-2/KS-3)
  ['closing', 'list-ks2', '/ks2', 'list'],
  ['closing', 'create-ks2', '/ks2/new', 'form'],
  ['closing', 'list-ks3', '/ks3', 'list'],
  ['closing', 'create-ks3', '/ks3/new', 'form'],
  ['closing', 'ks6a-journal', '/ks6a', 'list'],
  // Warehouse
  ['warehouse', 'list-materials', '/warehouse/materials', 'list'],
  ['warehouse', 'create-material', '/warehouse/materials/new', 'form'],
  ['warehouse', 'stock', '/warehouse/stock', 'list'],
  ['warehouse', 'movements', '/warehouse/movements', 'list'],
  ['warehouse', 'inventory', '/warehouse/inventory', 'list'],
  ['warehouse', 'm29-report', '/warehouse/m29-report', 'list'],
  // Procurement
  ['procurement', 'list-requests', '/procurement', 'list'],
  ['procurement', 'create-request', '/procurement/new', 'form'],
  ['procurement', 'list-po', '/procurement/purchase-orders', 'list'],
  ['procurement', 'create-po', '/procurement/purchase-orders/new', 'form'],
  // Employees / HR
  ['hr', 'list-employees', '/employees', 'list'],
  ['hr', 'create-employee', '/employees/new', 'form'],
  ['hr', 'crew', '/crew', 'list'],
  ['hr', 'list-timesheets', '/timesheets', 'list'],
  ['hr', 'staffing-schedule', '/hr/staffing-schedule', 'list'],
  // Settings
  ['settings', 'settings-main', '/settings', 'dashboard'],
  ['settings', 'users-admin', '/admin/users', 'list'],
  ['settings', 'permissions', '/admin/permissions', 'list'],
  ['settings', 'admin-dashboard', '/admin/dashboard', 'dashboard'],
];

const REMAINING_PAGES = [
  // Auth (public — skip login for these, they are pre-auth)
  // Tasks
  ['tasks', 'board-tasks', '/tasks', 'board'],
  // Calendar
  ['calendar', 'calendar', '/calendar', 'dashboard'],
  // Documents
  ['documents', 'list-documents', '/documents', 'list'],
  ['documents', 'create-document', '/documents/new', 'form'],
  // Counterparties
  ['counterparties', 'list-counterparties', '/counterparties', 'list'],
  ['counterparties', 'create-counterparty', '/counterparties/new', 'form'],
  // Contracts
  ['contracts', 'list-contracts', '/contracts', 'list'],
  ['contracts', 'board-contracts', '/contracts/board', 'board'],
  ['contracts', 'create-contract', '/contracts/new', 'form'],
  // Pricing
  ['pricing', 'pricing-databases', '/estimates/pricing/databases', 'list'],
  ['pricing', 'pricing-rates', '/estimates/pricing/rates', 'list'],
  ['pricing', 'pricing-calculator', '/estimates/pricing/calculate', 'form'],
  // RFI
  ['rfi', 'list-rfis', '/pm/rfis', 'list'],
  ['rfi', 'board-rfis', '/pm/rfis/board', 'board'],
  ['rfi', 'create-rfi', '/pm/rfis/new', 'form'],
  // Submittals
  ['submittals', 'list-submittals', '/pm/submittals', 'list'],
  ['submittals', 'create-submittal', '/pm/submittals/new', 'form'],
  // Issues
  ['issues', 'list-issues', '/pm/issues', 'list'],
  ['issues', 'create-issue', '/pm/issues/new', 'form'],
  // Change Management
  ['change-management', 'list-events', '/change-management/events', 'list'],
  ['change-management', 'list-orders', '/change-management/orders', 'list'],
  ['change-management', 'board-orders', '/change-management/orders/board', 'board'],
  ['change-management', 'create-order', '/change-management/orders/new', 'form'],
  ['change-management', 'dashboard', '/change-management/dashboard', 'dashboard'],
  // Planning
  ['planning', 'gantt', '/planning/gantt', 'dashboard'],
  ['planning', 'resources', '/planning/resources', 'list'],
  ['planning', 'evm', '/planning/evm', 'dashboard'],
  ['planning', 'work-volumes', '/planning/work-volumes', 'list'],
  // Workflow
  ['workflow', 'templates', '/workflow/templates', 'list'],
  ['workflow', 'instances', '/workflow/instances', 'list'],
  ['workflow', 'designer', '/workflow/designer', 'form'],
  ['workflow', 'approval-inbox', '/workflow/approval-inbox', 'list'],
  // BIM
  ['bim', 'list-models', '/bim/models', 'list'],
  ['bim', 'design-packages', '/bim/design-packages', 'list'],
  ['bim', 'clash-detection', '/bim/clash-detection', 'dashboard'],
  ['bim', 'bcf-issues', '/bim/bcf-issues', 'list'],
  ['bim', 'construction-progress', '/bim/construction-progress', 'dashboard'],
  // Design
  ['design', 'list-versions', '/design/versions', 'list'],
  ['design', 'reviews', '/design/reviews', 'list'],
  ['design', 'sections', '/design/sections', 'list'],
  // Bid Management
  ['bid-management', 'list-packages', '/bid-packages', 'list'],
  // Finance Advanced
  ['finance-advanced', 'bank-statement', '/bank-statement-matching', 'dashboard'],
  ['finance-advanced', 'factoring', '/factoring-calculator', 'form'],
  ['finance-advanced', 'treasury-calendar', '/treasury-calendar', 'dashboard'],
  ['finance-advanced', 'tax-calendar', '/tax-calendar', 'dashboard'],
  ['finance-advanced', 'bdds', '/bdds', 'dashboard'],
  ['finance-advanced', 'cost-codes', '/cost-codes', 'list'],
  ['finance-advanced', 's-curve', '/finance/s-curve-cashflow', 'dashboard'],
  // Accounting
  ['accounting', 'dashboard', '/accounting', 'dashboard'],
  ['accounting', 'chart-of-accounts', '/accounting/chart', 'list'],
  ['accounting', 'journals', '/accounting/journals', 'list'],
  ['accounting', 'journal-entries', '/accounting/journal', 'list'],
  ['accounting', 'fixed-assets', '/accounting/assets', 'list'],
  // Cost Management
  ['cost-management', 'list-codes', '/cost-management/codes', 'list'],
  ['cost-management', 'budget-overview', '/cost-management/budget', 'dashboard'],
  ['cost-management', 'commitments', '/cost-management/commitments', 'list'],
  ['cost-management', 'forecast', '/cost-management/forecast', 'dashboard'],
  ['cost-management', 'profitability', '/cost-management/profitability', 'dashboard'],
  // Revenue Recognition
  ['revenue', 'contracts', '/revenue/contracts', 'list'],
  ['revenue', 'periods', '/revenue/periods', 'list'],
  ['revenue', 'dashboard', '/revenue/dashboard', 'dashboard'],
  // Safety
  ['safety', 'dashboard', '/safety', 'dashboard'],
  ['safety', 'board', '/safety/board', 'board'],
  ['safety', 'metrics', '/safety/metrics', 'dashboard'],
  ['safety', 'list-incidents', '/safety/incidents', 'list'],
  ['safety', 'create-incident', '/safety/incidents/new', 'form'],
  ['safety', 'list-inspections', '/safety/inspections', 'list'],
  ['safety', 'create-inspection', '/safety/inspections/new', 'form'],
  ['safety', 'list-training', '/safety/training', 'list'],
  ['safety', 'create-training', '/safety/training/new', 'form'],
  ['safety', 'list-briefings', '/safety/briefings', 'list'],
  ['safety', 'create-briefing', '/safety/briefings/new', 'form'],
  ['safety', 'violations', '/safety/violations', 'list'],
  ['safety', 'ppe', '/safety/ppe', 'list'],
  ['safety', 'sout', '/safety/sout', 'dashboard'],
  ['safety', 'accident-n1', '/safety/accident-acts', 'list'],
  ['safety', 'compliance', '/safety/compliance', 'dashboard'],
  // Recruitment
  ['recruitment', 'list-applicants', '/recruitment/applicants', 'list'],
  ['recruitment', 'board-applicants', '/recruitment/applicants/board', 'board'],
  ['recruitment', 'jobs', '/recruitment/jobs', 'list'],
  // Leave
  ['leave', 'list-requests', '/leave/requests', 'list'],
  ['leave', 'board', '/leave/board', 'board'],
  ['leave', 'allocations', '/leave/allocations', 'list'],
  // HR Advanced
  ['hr-advanced', 'timesheet-t13', '/hr/timesheet-t13', 'list'],
  ['hr-advanced', 'qualifications', '/hr/qualifications', 'list'],
  ['hr-advanced', 'certification-matrix', '/hr/certification-matrix', 'list'],
  // HR Russian
  ['hr-russian', 'employment-contracts', '/hr-russian/employment-contracts', 'list'],
  ['hr-russian', 'personnel-orders', '/hr-russian/personnel-orders', 'list'],
  ['hr-russian', 'staffing', '/hr-russian/staffing', 'list'],
  ['hr-russian', 'timesheets', '/hr-russian/timesheets', 'list'],
  // Payroll
  ['payroll', 'templates', '/payroll', 'list'],
  ['payroll', 'calculate', '/payroll/calculate', 'form'],
  // Self-Employed
  ['self-employed', 'contractors', '/self-employed', 'list'],
  ['self-employed', 'payments', '/self-employed/payments', 'list'],
  // Tax Risk
  ['tax-risk', 'list', '/tax-risk', 'list'],
  // Monte Carlo
  ['monte-carlo', 'list', '/monte-carlo', 'list'],
  // Warehouse Advanced
  ['warehouse-advanced', 'locations', '/warehouse/locations', 'list'],
  ['warehouse-advanced', 'stock-limits', '/warehouse/stock-limits', 'list'],
  ['warehouse-advanced', 'stock-alerts', '/warehouse/stock-alerts', 'list'],
  ['warehouse-advanced', 'limit-fence-cards', '/warehouse/limit-fence-cards', 'list'],
  ['warehouse-advanced', 'address-storage', '/warehouse/address-storage', 'list'],
  ['warehouse-advanced', 'material-demand', '/warehouse/material-demand', 'list'],
  ['warehouse-advanced', 'barcode-scanner', '/warehouse/barcode-scanner', 'dashboard'],
  ['warehouse-advanced', 'orders', '/warehouse/orders', 'list'],
  // Quality
  ['quality', 'list', '/quality', 'list'],
  ['quality', 'board', '/quality/board', 'board'],
  ['quality', 'tolerance-rules', '/quality/tolerance-rules', 'list'],
  ['quality', 'certificates', '/quality/certificates', 'list'],
  ['quality', 'material-inspection', '/quality/material-inspection', 'list'],
  ['quality', 'checklist-templates', '/quality/checklist-templates', 'list'],
  ['quality', 'checklists', '/quality/checklists', 'list'],
  ['quality', 'defect-register', '/quality/defect-register', 'list'],
  ['quality', 'defect-pareto', '/quality/defect-pareto', 'dashboard'],
  ['quality', 'quality-gates', '/quality/gates', 'list'],
  // Punchlist
  ['punchlist', 'list-items', '/punchlist/items', 'list'],
  ['punchlist', 'board', '/punchlist/board', 'board'],
  ['punchlist', 'dashboard', '/punchlist/dashboard', 'dashboard'],
  // Defects
  ['defects', 'list', '/defects', 'list'],
  ['defects', 'dashboard', '/defects/dashboard', 'dashboard'],
  ['defects', 'create', '/defects/new', 'form'],
  // Regulatory
  ['regulatory', 'permits', '/regulatory/permits', 'list'],
  ['regulatory', 'licenses', '/regulatory/licenses', 'list'],
  ['regulatory', 'inspections', '/regulatory/inspections', 'list'],
  ['regulatory', 'dashboard', '/regulatory/dashboard', 'dashboard'],
  ['regulatory', 'sro-licenses', '/regulatory/sro-licenses', 'list'],
  ['regulatory', 'compliance', '/regulatory/compliance', 'dashboard'],
  ['regulatory', 'prescriptions', '/regulatory/prescriptions', 'list'],
  // CDE
  ['cde', 'documents', '/cde/documents', 'list'],
  ['cde', 'transmittals', '/cde/transmittals', 'list'],
  // Russian Docs
  ['russian-docs', 'list', '/russian-docs/list', 'list'],
  ['russian-docs', 'ks2-generator', '/russian-docs/ks2', 'form'],
  ['russian-docs', 'ks3-generator', '/russian-docs/ks3', 'form'],
  // PTO
  ['pto', 'documents', '/pto/documents', 'list'],
  ['pto', 'work-permits', '/pto/work-permits', 'list'],
  ['pto', 'lab-tests', '/pto/lab-tests', 'list'],
  ['pto', 'hidden-work-acts', '/pto/hidden-work-acts', 'list'],
  // Closing Advanced
  ['closing-advanced', 'ks2-approvals', '/ks2/approvals', 'list'],
  ['closing-advanced', 'ks2-pipeline', '/ks2/pipeline', 'dashboard'],
  ['closing-advanced', 'correction-acts', '/correction-acts', 'list'],
  ['closing-advanced', 'm29', '/m29', 'list'],
  // Daily Log
  ['daily-log', 'journal', '/daily-log', 'list'],
  ['daily-log', 'board', '/daily-log/board', 'board'],
  // Operations
  ['operations', 'dashboard', '/operations/dashboard', 'dashboard'],
  ['operations', 'work-orders', '/operations/work-orders', 'list'],
  ['operations', 'work-orders-board', '/operations/work-orders/board', 'board'],
  ['operations', 'dispatch-calendar', '/operations/dispatch-calendar', 'dashboard'],
  // Fleet
  ['fleet', 'list', '/fleet', 'list'],
  ['fleet', 'create', '/fleet/new', 'form'],
  ['fleet', 'maintenance', '/fleet/maintenance', 'list'],
  ['fleet', 'fuel', '/fleet/fuel', 'list'],
  ['fleet', 'waybills', '/fleet/waybills', 'list'],
  ['fleet', 'create-waybill', '/fleet/waybills/new', 'form'],
  ['fleet', 'fuel-accounting', '/fleet/fuel-accounting', 'list'],
  ['fleet', 'gps-tracking', '/fleet/gps-tracking', 'dashboard'],
  ['fleet', 'maintenance-schedule', '/fleet/maintenance-schedule', 'list'],
  // IoT
  ['iot', 'devices', '/iot/devices', 'list'],
  ['iot', 'sensors', '/iot/sensors', 'list'],
  ['iot', 'alerts', '/iot/alerts', 'list'],
  // Maintenance
  ['maintenance', 'requests', '/maintenance/requests', 'list'],
  ['maintenance', 'board', '/maintenance/board', 'board'],
  ['maintenance', 'equipment', '/maintenance/equipment', 'list'],
  ['maintenance', 'dashboard', '/maintenance/dashboard', 'dashboard'],
  // Dispatch
  ['dispatch', 'orders', '/dispatch/orders', 'list'],
  ['dispatch', 'routes', '/dispatch/routes', 'list'],
  // Mobile
  ['mobile', 'reports', '/mobile/reports', 'list'],
  ['mobile', 'dashboard', '/mobile/dashboard', 'dashboard'],
  // Support
  ['support', 'tickets', '/support/tickets', 'list'],
  ['support', 'board', '/support/tickets/board', 'board'],
  ['support', 'dashboard', '/support/dashboard', 'dashboard'],
  // Closeout
  ['closeout', 'dashboard', '/closeout/dashboard', 'dashboard'],
  ['closeout', 'commissioning', '/closeout/commissioning', 'list'],
  ['closeout', 'handover', '/closeout/handover', 'list'],
  ['closeout', 'warranty', '/closeout/warranty', 'list'],
  ['closeout', 'as-built', '/closeout/as-built', 'list'],
  ['closeout', 'zos', '/closeout/zos', 'list'],
  ['closeout', 'stroynadzor', '/closeout/stroynadzor', 'dashboard'],
  // Exec Docs
  ['exec-docs', 'aosr', '/exec-docs/aosr', 'list'],
  ['exec-docs', 'ks6', '/exec-docs/ks6', 'list'],
  ['exec-docs', 'incoming-control', '/exec-docs/incoming-control', 'list'],
  ['exec-docs', 'welding', '/exec-docs/welding', 'list'],
  ['exec-docs', 'special-journals', '/exec-docs/special-journals', 'list'],
  // Email
  ['email', 'mail', '/mail', 'dashboard'],
  // Portfolio & CRM
  ['portfolio', 'opportunities', '/portfolio/opportunities', 'list'],
  ['portfolio', 'tenders', '/portfolio/tenders', 'list'],
  ['crm', 'leads', '/crm/leads', 'list'],
  ['crm', 'create-lead', '/crm/leads/new', 'form'],
  ['crm', 'dashboard', '/crm/dashboard', 'dashboard'],
  // Site Assessment
  ['site-assessment', 'list', '/site-assessments', 'list'],
  ['prequalification', 'list', '/prequalifications', 'list'],
  // Legal
  ['legal', 'cases', '/legal/cases', 'list'],
  ['legal', 'templates', '/legal/templates', 'list'],
  // KEP
  ['kep', 'certificates', '/kep/certificates', 'list'],
  ['kep', 'signing', '/kep/signing', 'form'],
  ['kep', 'verification', '/kep/verification', 'form'],
  // Analytics
  ['analytics', 'dashboard', '/analytics', 'dashboard'],
  ['analytics', 'kpi-achievements', '/analytics/kpi-achievements', 'dashboard'],
  ['analytics', 'report-builder', '/analytics/report-builder', 'form'],
  ['analytics', 'reports', '/reports', 'list'],
  ['analytics', 'kpi', '/kpi', 'dashboard'],
  ['analytics', 'executive-kpi', '/analytics/executive-kpi', 'dashboard'],
  // Messaging
  ['messaging', 'main', '/messaging', 'dashboard'],
  // Portal
  ['portal', 'dashboard', '/portal', 'dashboard'],
  ['portal', 'projects', '/portal/projects', 'list'],
  ['portal', 'documents', '/portal/documents', 'list'],
  ['portal', 'messages', '/portal/messages', 'list'],
  ['portal', 'contracts', '/portal/contracts', 'list'],
  ['portal', 'invoices', '/portal/invoices', 'list'],
  ['portal', 'tasks', '/portal/tasks', 'list'],
  ['portal', 'schedule', '/portal/schedule', 'dashboard'],
  ['portal', 'admin', '/portal/admin', 'dashboard'],
  // AI
  ['ai', 'assistant', '/ai-assistant', 'dashboard'],
  // Search
  ['search', 'global', '/search', 'dashboard'],
  // Notifications
  ['notifications', 'main', '/notifications', 'list'],
  // Settings Advanced
  ['settings-advanced', 'profile', '/settings/profile', 'form'],
  ['settings-advanced', 'subscription', '/settings/subscription', 'dashboard'],
  ['settings-advanced', 'integrations', '/admin/integrations', 'list'],
  ['settings-advanced', 'audit-logs', '/admin/audit-logs', 'list'],
  ['settings-advanced', 'security', '/admin/security', 'dashboard'],
  ['settings-advanced', 'system-settings', '/admin/system-settings', 'list'],
  // Data Exchange
  ['data-exchange', 'import', '/data-exchange/import', 'list'],
  ['data-exchange', 'export', '/data-exchange/export', 'list'],
  ['data-exchange', '1c-config', '/data-exchange/1c-config', 'form'],
  // Marketplace
  ['marketplace', 'catalog', '/marketplace', 'list'],
  // Onboarding
  ['onboarding', 'setup', '/onboarding/setup', 'form'],
  // Help
  ['help', 'center', '/help', 'dashboard'],
  // Price Coefficients
  ['price-coefficients', 'list', '/price-coefficients', 'list'],
  // Integrations pages
  ['integrations', 'main', '/integrations', 'dashboard'],
  ['integrations', 'telegram', '/integrations/telegram', 'form'],
  ['integrations', '1c', '/integrations/1c', 'form'],
  // 1C Integration
  ['1c', 'dashboard', '/settings/1c', 'dashboard'],
  ['1c', 'ks-export', '/settings/1c/ks-export', 'form'],
  // ISUP
  ['isup', 'config', '/settings/isup', 'form'],
  ['isup', 'transmissions', '/settings/isup/transmissions', 'dashboard'],
];

// ─── Main ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const priorityOnly = args.includes('--priority');
const moduleFilter = args.find(a => a.startsWith('--module='))?.split('=')[1];

let pages = priorityOnly ? PRIORITY_PAGES : [...PRIORITY_PAGES, ...REMAINING_PAGES];
if (moduleFilter) {
  pages = pages.filter(([mod]) => mod === moduleFilter);
}

console.log(`\n📸 PRIVOD Screenshot Tool`);
console.log(`   Pages to capture: ${pages.length}`);
console.log(`   Mode: ${priorityOnly ? 'PRIORITY ONLY' : moduleFilter ? `MODULE: ${moduleFilter}` : 'ALL'}`);
console.log(`   Output: ${SCREENSHOTS_DIR}\n`);

const results = []; // {module, page, path, url, status, error?}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'ru-RU',
  colorScheme: 'light',
});
const page = await context.newPage();

// ─── Login ─────────────────────────────────────────────────────────
console.log('🔑 Logging in...');
try {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15_000 });
  await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10_000 });
  console.log('✅ Logged in successfully\n');
} catch (e) {
  console.error('❌ Login failed:', e.message);
  // Try direct token injection as fallback
  try {
    const resp = await fetch(`${BASE_URL.replace('4000', '8080')}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
    });
    const data = await resp.json();
    const token = data.data?.token || data.token;
    if (token) {
      await page.evaluate((t) => {
        localStorage.setItem('privod-auth', JSON.stringify({
          state: { token: t, isAuthenticated: true },
          version: 0,
        }));
      }, token);
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 10_000 });
      console.log('✅ Logged in via API token\n');
    } else {
      throw new Error('No token in response');
    }
  } catch (e2) {
    console.error('❌ API login also failed:', e2.message);
    process.exit(1);
  }
}

// ─── Screenshot loop ───────────────────────────────────────────────
let done = 0;
const total = pages.length;

for (const [module, pageName, urlPath, pageType] of pages) {
  done++;
  const dir = join(SCREENSHOTS_DIR, module);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${pageName}.png`);
  const relPath = `screenshots/${module}/${pageName}.png`;

  const progress = `[${done}/${total}]`;

  try {
    // Navigate
    const resp = await page.goto(`${BASE_URL}${urlPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT,
    });

    // Wait for content to settle
    try {
      await page.waitForLoadState('networkidle', { timeout: 8_000 });
    } catch {
      // networkidle timeout is OK — page may have long-polling
    }

    // Extra wait for React render
    await page.waitForTimeout(500);

    // Check if we got redirected to login
    if (page.url().includes('/login')) {
      results.push({ module, page: pageName, path: relPath, url: urlPath, status: 'redirect-login', error: 'Redirected to login' });
      console.log(`${progress} ⚠️  ${urlPath} → redirected to /login`);
      // Re-login
      await page.fill('input[type="email"], input[name="email"]', LOGIN_EMAIL);
      await page.fill('input[type="password"], input[name="password"]', LOGIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10_000 });
      continue;
    }

    // Check for empty page (no main content)
    const hasContent = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('.min-h-screen') || document.body;
      return main && main.innerText.trim().length > 50;
    });

    // Take screenshot
    await page.screenshot({ path: filePath, fullPage: true });

    const status = hasContent ? 'ok' : 'empty';
    results.push({ module, page: pageName, path: relPath, url: urlPath, status });
    const icon = status === 'ok' ? '✅' : '⚠️ ';
    console.log(`${progress} ${icon} ${urlPath} → ${relPath}`);

  } catch (e) {
    // Try to take screenshot even on error
    try {
      await page.screenshot({ path: filePath, fullPage: true });
    } catch { /* ignore */ }

    results.push({ module, page: pageName, path: relPath, url: urlPath, status: 'error', error: e.message.slice(0, 100) });
    console.log(`${progress} ❌ ${urlPath} — ${e.message.slice(0, 80)}`);
  }
}

await browser.close();

// ─── Generate index.md ─────────────────────────────────────────────
const statusIcon = (s) => s === 'ok' ? '✅' : s === 'empty' ? '⚠️' : '❌';

const indexLines = [
  '# Скриншоты системы ПРИВОД',
  '',
  `> Дата: ${new Date().toISOString().split('T')[0]}`,
  `> Всего страниц: ${results.length}`,
  `> Успешно: ${results.filter(r => r.status === 'ok').length}`,
  `> Пустые: ${results.filter(r => r.status === 'empty').length}`,
  `> Ошибки: ${results.filter(r => r.status === 'error' || r.status === 'redirect-login').length}`,
  '',
  '## Все скриншоты',
  '',
  '| Модуль | Страница | URL | Скриншот | Статус |',
  '|--------|----------|-----|----------|--------|',
];

for (const r of results) {
  indexLines.push(
    `| ${r.module} | ${r.page} | \`${r.url}\` | [${r.page}.png](${r.path.replace('screenshots/', '')}) | ${statusIcon(r.status)} ${r.status}${r.error ? ` (${r.error.slice(0, 50)})` : ''} |`
  );
}

// Summary by module
const modules = [...new Set(results.map(r => r.module))];
indexLines.push('', '## Сводка по модулям', '', '| Модуль | Всего | ✅ | ⚠️ | ❌ |', '|--------|-------|----|----|-------|');
for (const mod of modules) {
  const mr = results.filter(r => r.module === mod);
  const ok = mr.filter(r => r.status === 'ok').length;
  const empty = mr.filter(r => r.status === 'empty').length;
  const err = mr.filter(r => r.status === 'error' || r.status === 'redirect-login').length;
  indexLines.push(`| ${mod} | ${mr.length} | ${ok} | ${empty} | ${err} |`);
}

writeFileSync(join(SCREENSHOTS_DIR, 'index.md'), indexLines.join('\n') + '\n');

console.log(`\n📊 Done! ${results.filter(r => r.status === 'ok').length}/${results.length} screenshots captured.`);
console.log(`📄 Index: docs/knowledge-base/screenshots/index.md\n`);
