/**
 * Element Crawler Part 1 — Groups 1–14 (Home → HR)
 *
 * Navigates to every page in the first 14 navigation groups,
 * discovers all visible interactive elements, clicks each one,
 * and records the outcome (modal, navigation, error, nothing).
 *
 * Output:
 *   e2e/reports/crawler-part1-results.json   — per-element JSON
 *   e2e/reports/crawler-part1-summary.md     — human-readable report
 *   e2e/screenshots/crawler/                 — initial page screenshots
 */

import { test, type Page, type Locator } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Output paths ───────────────────────────────────────────────────────────
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots/crawler');
const REPORTS_DIR = path.resolve(__dirname, '../../reports');

// ─── Tunables ───────────────────────────────────────────────────────────────
const MAX_BUTTONS = 30;
const MAX_LINKS = 15;
const MAX_TABS = 10;
const MAX_SELECTS = 10;
const MAX_TOGGLES = 10;
const CLICK_WAIT = 400;

// ─── Types ──────────────────────────────────────────────────────────────────
interface PageDef {
  group: string;
  groupIdx: number;
  name: string;
  url: string;
}

type ResultKind =
  | 'modal_opened'
  | 'dropdown_opened'
  | 'navigated'
  | 'nothing'
  | 'js_error'
  | 'click_failed'
  | 'tab_switched'
  | 'toggled';

interface ElementResult {
  page: string;
  element: string;
  action: 'click';
  result: ResultKind;
  detail?: string;
  screenshot?: string;
}

interface PageResult {
  group: string;
  page: string;
  name: string;
  loadTimeMs: number;
  elements: ElementResult[];
  jsErrors: string[];
  totalElements: number;
  timestamp: string;
}

// ─── Safety ─────────────────────────────────────────────────────────────────
const DANGEROUS =
  /выйти|logout|sign.?out|удалить\s*все|drop\s*all|reset\s*all|очистить\s*все|выход|sign.?off/i;
const NOISE =
  /favicon|ResizeObserver|net::ERR_|React DevTools|Warning:|ChunkLoad|Hydration|websocket|HMR|Failed to load resource/;

// ─── Page catalogue — Groups 1–14 (127 pages) ──────────────────────────────
const PAGES: PageDef[] = [
  // ── Group 1: Home ─────────────────────────────────────────────────────────
  { group: 'Home', groupIdx: 1, name: 'Dashboard', url: '/' },
  { group: 'Home', groupIdx: 1, name: 'Analytics', url: '/analytics' },
  { group: 'Home', groupIdx: 1, name: 'Reports', url: '/reports' },

  // ── Group 2: Tasks ────────────────────────────────────────────────────────
  { group: 'Tasks', groupIdx: 2, name: 'Tasks', url: '/tasks' },

  // ── Group 3: Calendar ─────────────────────────────────────────────────────
  { group: 'Calendar', groupIdx: 3, name: 'Calendar', url: '/calendar' },

  // ── Group 4: Planning ─────────────────────────────────────────────────────
  { group: 'Planning', groupIdx: 4, name: 'Gantt', url: '/planning/gantt' },
  { group: 'Planning', groupIdx: 4, name: 'EVM', url: '/planning/evm' },
  { group: 'Planning', groupIdx: 4, name: 'Resource Planning', url: '/planning/resource-planning' },
  { group: 'Planning', groupIdx: 4, name: 'Work Volumes', url: '/planning/work-volumes' },

  // ── Group 5: Processes ────────────────────────────────────────────────────
  { group: 'Processes', groupIdx: 5, name: 'RFIs', url: '/pm/rfis' },
  { group: 'Processes', groupIdx: 5, name: 'Submittals', url: '/pm/submittals' },
  { group: 'Processes', groupIdx: 5, name: 'Issues', url: '/pm/issues' },
  { group: 'Processes', groupIdx: 5, name: 'Workflow Templates', url: '/workflow/templates' },
  { group: 'Processes', groupIdx: 5, name: 'Approval Inbox', url: '/workflow/approval-inbox' },
  { group: 'Processes', groupIdx: 5, name: 'Change Management', url: '/change-management/dashboard' },

  // ── Group 6: Projects ─────────────────────────────────────────────────────
  { group: 'Projects', groupIdx: 6, name: 'Projects', url: '/projects' },
  { group: 'Projects', groupIdx: 6, name: 'Site Assessments', url: '/site-assessments' },
  { group: 'Projects', groupIdx: 6, name: 'Portfolio Health', url: '/portfolio/health' },

  // ── Group 7: CRM ──────────────────────────────────────────────────────────
  { group: 'CRM', groupIdx: 7, name: 'CRM Leads', url: '/crm/leads' },
  { group: 'CRM', groupIdx: 7, name: 'CRM Dashboard', url: '/crm/dashboard' },
  { group: 'CRM', groupIdx: 7, name: 'Counterparties', url: '/counterparties' },
  { group: 'CRM', groupIdx: 7, name: 'Opportunities', url: '/portfolio/opportunities' },
  { group: 'CRM', groupIdx: 7, name: 'Tenders', url: '/portfolio/tenders' },
  { group: 'CRM', groupIdx: 7, name: 'Bid Packages', url: '/bid-packages' },

  // ── Group 8: Documents ────────────────────────────────────────────────────
  { group: 'Documents', groupIdx: 8, name: 'Documents', url: '/documents' },
  { group: 'Documents', groupIdx: 8, name: 'Smart Recognition', url: '/documents/smart-recognition' },
  { group: 'Documents', groupIdx: 8, name: 'CDE Documents', url: '/cde/documents' },
  { group: 'Documents', groupIdx: 8, name: 'CDE Transmittals', url: '/cde/transmittals' },
  { group: 'Documents', groupIdx: 8, name: 'PTO Documents', url: '/pto/documents' },
  { group: 'Documents', groupIdx: 8, name: 'Hidden Work Acts', url: '/pto/hidden-work-acts' },
  { group: 'Documents', groupIdx: 8, name: 'Work Permits', url: '/pto/work-permits' },
  { group: 'Documents', groupIdx: 8, name: 'Lab Tests', url: '/pto/lab-tests' },
  { group: 'Documents', groupIdx: 8, name: 'KS6 Calendar', url: '/pto/ks6-calendar' },
  { group: 'Documents', groupIdx: 8, name: 'ITD Validation', url: '/pto/itd-validation' },
  { group: 'Documents', groupIdx: 8, name: 'KS-2', url: '/russian-docs/ks2' },
  { group: 'Documents', groupIdx: 8, name: 'KS-3', url: '/russian-docs/ks3' },
  { group: 'Documents', groupIdx: 8, name: 'EDO', url: '/russian-docs/edo' },
  { group: 'Documents', groupIdx: 8, name: 'Russian Docs List', url: '/russian-docs/list' },
  { group: 'Documents', groupIdx: 8, name: 'SBIS', url: '/russian-docs/sbis' },
  { group: 'Documents', groupIdx: 8, name: 'Data Import', url: '/data-exchange/import' },
  { group: 'Documents', groupIdx: 8, name: 'Data Export', url: '/data-exchange/export' },
  { group: 'Documents', groupIdx: 8, name: 'Data Mapping', url: '/data-exchange/mapping' },
  { group: 'Documents', groupIdx: 8, name: '1C Config', url: '/data-exchange/1c-config' },
  { group: 'Documents', groupIdx: 8, name: '1C Logs', url: '/data-exchange/1c-logs' },

  // ── Group 9: Design ───────────────────────────────────────────────────────
  { group: 'Design', groupIdx: 9, name: 'Design Versions', url: '/design/versions' },
  { group: 'Design', groupIdx: 9, name: 'Design Reviews', url: '/design/reviews' },
  { group: 'Design', groupIdx: 9, name: 'Review Board', url: '/design/reviews/board' },
  { group: 'Design', groupIdx: 9, name: 'Design Sections', url: '/design/sections' },

  // ── Group 10: ExecDocs ────────────────────────────────────────────────────
  { group: 'ExecDocs', groupIdx: 10, name: 'AOSR', url: '/exec-docs/aosr' },
  { group: 'ExecDocs', groupIdx: 10, name: 'KS-6', url: '/exec-docs/ks6' },
  { group: 'ExecDocs', groupIdx: 10, name: 'Incoming Control', url: '/exec-docs/incoming-control' },
  { group: 'ExecDocs', groupIdx: 10, name: 'Welding', url: '/exec-docs/welding' },
  { group: 'ExecDocs', groupIdx: 10, name: 'Special Journals', url: '/exec-docs/special-journals' },

  // ── Group 11: Finance ─────────────────────────────────────────────────────
  { group: 'Finance', groupIdx: 11, name: 'Budgets', url: '/budgets' },
  { group: 'Finance', groupIdx: 11, name: 'Financial Models', url: '/financial-models' },
  { group: 'Finance', groupIdx: 11, name: 'Contracts', url: '/contracts' },
  { group: 'Finance', groupIdx: 11, name: 'Commercial Proposals', url: '/commercial-proposals' },
  { group: 'Finance', groupIdx: 11, name: 'Invoices', url: '/invoices' },
  { group: 'Finance', groupIdx: 11, name: 'Payments', url: '/payments' },
  { group: 'Finance', groupIdx: 11, name: 'Cash Flow', url: '/cash-flow' },
  { group: 'Finance', groupIdx: 11, name: 'Cash Flow Charts', url: '/cash-flow/charts' },
  { group: 'Finance', groupIdx: 11, name: 'Accounting', url: '/accounting' },
  { group: 'Finance', groupIdx: 11, name: 'Execution Chain', url: '/execution-chain' },
  { group: 'Finance', groupIdx: 11, name: 'Revenue Dashboard', url: '/revenue/dashboard' },
  { group: 'Finance', groupIdx: 11, name: 'Revenue Periods', url: '/revenue/recognition-periods' },
  { group: 'Finance', groupIdx: 11, name: 'Revenue Contracts', url: '/revenue/all-contracts' },
  { group: 'Finance', groupIdx: 11, name: 'Cost Codes', url: '/cost-management/codes' },
  { group: 'Finance', groupIdx: 11, name: 'Cost Budget', url: '/cost-management/budget' },
  { group: 'Finance', groupIdx: 11, name: 'Commitments', url: '/cost-management/commitments' },
  { group: 'Finance', groupIdx: 11, name: 'Cost Forecast', url: '/cost-management/forecast' },
  { group: 'Finance', groupIdx: 11, name: 'Cashflow Forecast', url: '/cost-management/cashflow-forecast' },
  { group: 'Finance', groupIdx: 11, name: 'Forecasting Hub', url: '/cost-management/forecasting-hub' },
  { group: 'Finance', groupIdx: 11, name: 'Profitability', url: '/cost-management/profitability' },
  { group: 'Finance', groupIdx: 11, name: 'Bank Matching', url: '/bank-statement-matching' },
  { group: 'Finance', groupIdx: 11, name: 'Bank Export', url: '/bank-export' },
  { group: 'Finance', groupIdx: 11, name: 'Treasury Calendar', url: '/treasury-calendar' },
  { group: 'Finance', groupIdx: 11, name: 'Tax Calendar', url: '/tax-calendar' },
  { group: 'Finance', groupIdx: 11, name: 'Factoring Calculator', url: '/factoring-calculator' },
  { group: 'Finance', groupIdx: 11, name: 'BDDS', url: '/bdds' },
  { group: 'Finance', groupIdx: 11, name: 'Expenses', url: '/finance/expenses' },
  { group: 'Finance', groupIdx: 11, name: 'S-Curve Cashflow', url: '/finance/s-curve-cashflow' },
  { group: 'Finance', groupIdx: 11, name: 'Tax Risk', url: '/tax-risk' },

  // ── Group 12: Pricing ─────────────────────────────────────────────────────
  { group: 'Pricing', groupIdx: 12, name: 'Specifications', url: '/specifications' },
  { group: 'Pricing', groupIdx: 12, name: 'Competitive Registry', url: '/specifications/competitive-registry' },
  { group: 'Pricing', groupIdx: 12, name: 'Estimates', url: '/estimates' },
  { group: 'Pricing', groupIdx: 12, name: 'Minstroy Indices', url: '/estimates/minstroy' },
  { group: 'Pricing', groupIdx: 12, name: 'Estimate Pivot', url: '/estimates/pivot' },
  { group: 'Pricing', groupIdx: 12, name: 'Volume Calculator', url: '/estimates/volume-calculator' },
  { group: 'Pricing', groupIdx: 12, name: 'Pricing Databases', url: '/estimates/pricing/databases' },
  { group: 'Pricing', groupIdx: 12, name: 'Price Coefficients', url: '/price-coefficients' },

  // ── Group 13: Supply ──────────────────────────────────────────────────────
  { group: 'Supply', groupIdx: 13, name: 'Procurement', url: '/procurement' },
  { group: 'Supply', groupIdx: 13, name: 'Purchase Orders', url: '/procurement/purchase-orders' },
  { group: 'Supply', groupIdx: 13, name: 'Procurement Tenders', url: '/procurement/tenders' },
  { group: 'Supply', groupIdx: 13, name: 'Bid Comparison', url: '/procurement/bid-comparison' },
  { group: 'Supply', groupIdx: 13, name: 'Prequalification', url: '/procurement/prequalification' },
  { group: 'Supply', groupIdx: 13, name: 'Warehouse Locations', url: '/warehouse/locations' },
  { group: 'Supply', groupIdx: 13, name: 'Warehouse Stock', url: '/warehouse/stock' },
  { group: 'Supply', groupIdx: 13, name: 'Materials', url: '/warehouse/materials' },
  { group: 'Supply', groupIdx: 13, name: 'Movements', url: '/warehouse/movements' },
  { group: 'Supply', groupIdx: 13, name: 'Inventory', url: '/warehouse/inventory' },
  { group: 'Supply', groupIdx: 13, name: 'Quick Receipt', url: '/warehouse/quick-receipt' },
  { group: 'Supply', groupIdx: 13, name: 'Quick Confirm', url: '/warehouse/quick-confirm' },
  { group: 'Supply', groupIdx: 13, name: 'Barcode Scanner', url: '/warehouse/barcode-scanner' },
  { group: 'Supply', groupIdx: 13, name: 'Inter-Project Transfer', url: '/warehouse/inter-project-transfer' },
  { group: 'Supply', groupIdx: 13, name: 'Inter-Site Transfer', url: '/warehouse/inter-site-transfer' },
  { group: 'Supply', groupIdx: 13, name: 'Stock Limits', url: '/warehouse/stock-limits' },
  { group: 'Supply', groupIdx: 13, name: 'Stock Alerts', url: '/warehouse/stock-alerts' },
  { group: 'Supply', groupIdx: 13, name: 'M29 Report', url: '/warehouse/m29-report' },
  { group: 'Supply', groupIdx: 13, name: 'Limit Fence Cards', url: '/warehouse/limit-fence-cards' },
  { group: 'Supply', groupIdx: 13, name: 'Limit Fence Sheets', url: '/warehouse/limit-fence-sheets' },
  { group: 'Supply', groupIdx: 13, name: 'Address Storage', url: '/warehouse/address-storage' },
  { group: 'Supply', groupIdx: 13, name: 'Material Demand', url: '/warehouse/material-demand' },
  { group: 'Supply', groupIdx: 13, name: 'Warehouse Orders', url: '/warehouse/warehouse-orders' },
  { group: 'Supply', groupIdx: 13, name: 'Work Orders', url: '/operations/work-orders' },
  { group: 'Supply', groupIdx: 13, name: 'Dispatch Orders', url: '/dispatch/orders' },
  { group: 'Supply', groupIdx: 13, name: 'Dispatch Routes', url: '/dispatch/routes' },
  { group: 'Supply', groupIdx: 13, name: 'Dispatch Calendar', url: '/operations/dispatch-calendar' },

  // ── Group 14: HR ──────────────────────────────────────────────────────────
  { group: 'HR', groupIdx: 14, name: 'Employees', url: '/employees' },
  { group: 'HR', groupIdx: 14, name: 'Staffing Schedule', url: '/hr/staffing-schedule' },
  { group: 'HR', groupIdx: 14, name: 'Crew', url: '/crew' },
  { group: 'HR', groupIdx: 14, name: 'Timesheets', url: '/timesheets' },
  { group: 'HR', groupIdx: 14, name: 'Timesheet T-13', url: '/hr/timesheet-t13' },
  { group: 'HR', groupIdx: 14, name: 'HR Work Orders', url: '/hr/work-orders' },
  { group: 'HR', groupIdx: 14, name: 'Certification Matrix', url: '/hr/certification-matrix' },
  { group: 'HR', groupIdx: 14, name: 'Leave Requests', url: '/leave/requests' },
  { group: 'HR', groupIdx: 14, name: 'Employment Contracts', url: '/hr-russian/employment-contracts' },
  { group: 'HR', groupIdx: 14, name: 'Self Employed', url: '/self-employed' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase().slice(0, 60);
}

function truncate(s: string, n = 50): string {
  return s.length > n ? s.slice(0, n) + '...' : s;
}

/** Extract a human-readable label from a locator. */
async function getLabel(el: Locator): Promise<string> {
  try {
    const text = ((await el.textContent({ timeout: 2_000 })) ?? '').trim().replace(/\s+/g, ' ');
    if (text) return truncate(text);
    const aria = await el.getAttribute('aria-label');
    if (aria) return truncate(aria);
    const title = await el.getAttribute('title');
    if (title) return truncate(title);
    const placeholder = await el.getAttribute('placeholder');
    if (placeholder) return truncate(placeholder);
    const tagName = await el.evaluate((e) => e.tagName.toLowerCase());
    return `(unlabeled-${tagName})`;
  } catch {
    return '(stale)';
  }
}

/** Check whether a locator is inside a nav/sidebar region. */
async function isInsideNav(el: Locator): Promise<boolean> {
  try {
    return await el.evaluate(
      (e) => !!e.closest('nav, [class*="sidebar"], [class*="Sidebar"], [class*="side-nav"], [data-sidebar]'),
    );
  } catch {
    return true; // assume nav if we can't tell — safer to skip
  }
}

/**
 * Click an element and observe what happens:
 * modal, dropdown, navigation, error, or nothing.
 */
async function clickAndObserve(
  page: Page,
  el: Locator,
  elementTag: string,
  pageUrl: string,
  jsErrors: string[],
): Promise<ElementResult> {
  const result: ElementResult = {
    page: pageUrl,
    element: elementTag,
    action: 'click',
    result: 'nothing',
  };

  const errorCountBefore = jsErrors.length;
  const urlBefore = page.url();

  // Attempt click
  try {
    await el.click({ timeout: 5_000 });
  } catch (err: unknown) {
    result.result = 'click_failed';
    result.detail = err instanceof Error ? err.message.slice(0, 150) : String(err);
    return result;
  }

  await page.waitForTimeout(CLICK_WAIT);

  // ── Check for JS errors during click ────────────────────────────────────
  if (jsErrors.length > errorCountBefore) {
    result.result = 'js_error';
    result.detail = jsErrors.slice(errorCountBefore).join('; ').slice(0, 200);
  }

  // ── Check for modal / dialog ────────────────────────────────────────────
  const modalCount = await page
    .locator('[role="dialog"]:visible, [data-state="open"][role="dialog"], .modal:visible, .ReactModal__Content')
    .count()
    .catch(() => 0);
  if (modalCount > 0) {
    if (result.result === 'nothing') result.result = 'modal_opened';
    // Close it
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    const stillOpen = await page.locator('[role="dialog"]:visible').count().catch(() => 0);
    if (stillOpen > 0) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
    return result;
  }

  // ── Check for dropdown / popover / menu ─────────────────────────────────
  const dropdownCount = await page
    .locator('[role="menu"]:visible, [role="listbox"]:visible, [data-radix-popper-content-wrapper]:visible')
    .count()
    .catch(() => 0);
  if (dropdownCount > 0) {
    if (result.result === 'nothing') result.result = 'dropdown_opened';
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    return result;
  }

  // ── Check for navigation ────────────────────────────────────────────────
  const urlAfter = page.url();
  const baseUrlBefore = new URL(urlBefore).pathname;
  const baseUrlAfter = new URL(urlAfter).pathname;
  if (baseUrlAfter !== baseUrlBefore) {
    if (result.result === 'nothing') result.result = 'navigated';
    result.detail = baseUrlAfter;
    // Return to original page
    try {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await page.waitForLoadState('networkidle').catch(() => {});
    } catch {
      await page.goBack().catch(() => {});
    }
    return result;
  }

  return result;
}

/**
 * Main crawler: navigate to a page, find all interactive elements,
 * click each one, record what happened.
 */
async function crawlPage(page: Page, def: PageDef): Promise<PageResult> {
  const elements: ElementResult[] = [];
  const jsErrors: string[] = [];

  // ── Error listeners ───────────────────────────────────────────────────────
  const onPageError = (err: Error) => {
    jsErrors.push(`PAGE_ERROR: ${err.message}`);
  };
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error' && !NOISE.test(msg.text())) {
      jsErrors.push(msg.text());
    }
  };
  page.on('pageerror', onPageError);
  page.on('console', onConsole);

  // ── Navigate ──────────────────────────────────────────────────────────────
  const start = Date.now();
  try {
    await page.goto(def.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
  } catch (err: unknown) {
    // Page failed to load entirely
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    return {
      group: def.group,
      page: def.url,
      name: def.name,
      loadTimeMs: Date.now() - start,
      elements: [],
      jsErrors: [`LOAD_FAILED: ${err instanceof Error ? err.message : String(err)}`],
      totalElements: 0,
      timestamp: new Date().toISOString(),
    };
  }
  const loadTimeMs = Date.now() - start;

  // ── Initial screenshot ────────────────────────────────────────────────────
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page
    .screenshot({
      path: path.join(SCREENSHOT_DIR, `${sanitize(def.name)}-initial.png`),
      fullPage: true,
    })
    .catch(() => {});

  // ── 1. Buttons ────────────────────────────────────────────────────────────
  const allButtons = await page.locator('button:visible').all();
  const safeButtons: Array<{ el: Locator; label: string }> = [];
  for (const btn of allButtons) {
    const label = await getLabel(btn);
    if (DANGEROUS.test(label)) continue;
    // Skip nav sidebar buttons
    if (await isInsideNav(btn)) continue;
    safeButtons.push({ el: btn, label });
  }

  for (const { el, label } of safeButtons.slice(0, MAX_BUTTONS)) {
    const r = await clickAndObserve(page, el, `button:${label}`, def.url, jsErrors);
    elements.push(r);
  }

  // ── 2. Tabs ───────────────────────────────────────────────────────────────
  const allTabs = await page.locator('[role="tab"]:visible').all();
  for (const tab of allTabs.slice(0, MAX_TABS)) {
    const label = await getLabel(tab);
    const r = await clickAndObserve(page, tab, `tab:${label}`, def.url, jsErrors);
    if (r.result === 'nothing') r.result = 'tab_switched';
    elements.push(r);
  }

  // ── 3. Selects / Comboboxes ───────────────────────────────────────────────
  const allSelects = await page.locator('select:visible, [role="combobox"]:visible').all();
  for (const sel of allSelects.slice(0, MAX_SELECTS)) {
    const label = await getLabel(sel);
    if (await isInsideNav(sel)) continue;
    const r = await clickAndObserve(page, sel, `select:${label}`, def.url, jsErrors);
    elements.push(r);
  }

  // ── 4. Toggles / Checkboxes ───────────────────────────────────────────────
  const allToggles = await page
    .locator('[role="switch"]:visible, input[type="checkbox"]:visible')
    .all();
  for (const toggle of allToggles.slice(0, MAX_TOGGLES)) {
    const label = await getLabel(toggle);
    if (await isInsideNav(toggle)) continue;
    const r = await clickAndObserve(page, toggle, `toggle:${label}`, def.url, jsErrors);
    if (r.result === 'nothing') r.result = 'toggled';
    elements.push(r);
    // Click again to restore state
    try {
      await toggle.click({ timeout: 3_000 });
      await page.waitForTimeout(200);
    } catch {
      /* element may have become stale */
    }
  }

  // ── 5. Content links (skip nav/sidebar) ───────────────────────────────────
  const allLinks = await page.locator('a[href]:visible').all();
  const contentLinks: Array<{ el: Locator; label: string; href: string }> = [];
  for (const link of allLinks) {
    try {
      if (await isInsideNav(link)) continue;
      const href = await link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) continue;
      const label = await getLabel(link);
      if (DANGEROUS.test(label)) continue;
      contentLinks.push({ el: link, label, href });
    } catch {
      /* stale element */
    }
  }

  for (const { el, label, href } of contentLinks.slice(0, MAX_LINKS)) {
    const r = await clickAndObserve(page, el, `link:${label}(${truncate(href, 40)})`, def.url, jsErrors);
    elements.push(r);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  page.off('pageerror', onPageError);
  page.off('console', onConsole);

  return {
    group: def.group,
    page: def.url,
    name: def.name,
    loadTimeMs,
    elements,
    jsErrors,
    totalElements: elements.length,
    timestamp: new Date().toISOString(),
  };
}

// ─── Report generation ──────────────────────────────────────────────────────

function generateReports(results: PageResult[]): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const allElements = results.flatMap((r) => r.elements);

  // ── JSON ────────────────────────────────────────────────────────────────
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'crawler-part1-results.json'),
    JSON.stringify(results, null, 2),
    'utf-8',
  );

  // ── Summary stats ───────────────────────────────────────────────────────
  const totalPages = results.length;
  const totalElements = allElements.length;
  const jsErrorEls = allElements.filter((e) => e.result === 'js_error');
  const clickFailed = allElements.filter((e) => e.result === 'click_failed');
  const nothingEls = allElements.filter((e) => e.result === 'nothing');
  const modalEls = allElements.filter((e) => e.result === 'modal_opened');
  const navEls = allElements.filter((e) => e.result === 'navigated');
  const dropdownEls = allElements.filter((e) => e.result === 'dropdown_opened');
  const tabEls = allElements.filter((e) => e.result === 'tab_switched');
  const toggleEls = allElements.filter((e) => e.result === 'toggled');
  const okCount = totalElements - jsErrorEls.length - clickFailed.length;
  const okPct = totalElements > 0 ? ((okCount / totalElements) * 100).toFixed(1) : '0';
  const pagesWithErrors = results.filter((r) => r.jsErrors.length > 0);

  // ── Per-group table rows ────────────────────────────────────────────────
  const groups = [...new Set(results.map((r) => r.group))];
  const groupRows = groups
    .map((g) => {
      const gr = results.filter((r) => r.group === g);
      const ge = gr.flatMap((r) => r.elements);
      const errors = ge.filter((e) => e.result === 'js_error').length;
      const dead = ge.filter((e) => e.result === 'nothing').length;
      return `| ${g} | ${gr.length} | ${ge.length} | ${errors} | ${dead} |`;
    })
    .join('\n');

  // ── Markdown ────────────────────────────────────────────────────────────
  const md = [
    '# Element Crawler Part 1 — Results Summary',
    '',
    `> Generated: ${new Date().toISOString()}`,
    `> Pages: Groups 1–14 (Home → HR)`,
    '',
    '## Overview',
    '',
    '| Metric | Count |',
    '|--------|-------|',
    `| Pages crawled | ${totalPages} |`,
    `| Total elements interacted | ${totalElements} |`,
    `| OK (no errors) | ${okCount} (${okPct}%) |`,
    `| JS errors | ${jsErrorEls.length} |`,
    `| Click failures | ${clickFailed.length} |`,
    `| Dead buttons (nothing) | ${nothingEls.length} |`,
    `| Modals opened | ${modalEls.length} |`,
    `| Navigations | ${navEls.length} |`,
    `| Dropdowns opened | ${dropdownEls.length} |`,
    `| Tab switches | ${tabEls.length} |`,
    `| Toggles | ${toggleEls.length} |`,
    '',
    '## Per-Group Summary',
    '',
    '| Group | Pages | Elements | Errors | Dead |',
    '|-------|-------|----------|--------|------|',
    groupRows,
    '',
    '## Pages with JS Errors [CRITICAL]',
    '',
    pagesWithErrors.length === 0
      ? 'None — all pages clean!'
      : pagesWithErrors
          .map(
            (r) =>
              `- **${r.name}** (\`${r.page}\`): ${r.jsErrors.length} error(s)\n${r.jsErrors.map((e) => `  - \`${e.slice(0, 150)}\``).join('\n')}`,
          )
          .join('\n\n'),
    '',
    '## JS Error Elements [CRITICAL]',
    '',
    jsErrorEls.length === 0
      ? 'None'
      : jsErrorEls
          .map((e) => `- \`${e.page}\` → \`${e.element}\`: ${e.detail ?? 'unknown'}`)
          .join('\n'),
    '',
    '## Click Failures [MAJOR]',
    '',
    clickFailed.length === 0
      ? 'None'
      : clickFailed
          .map((e) => `- \`${e.page}\` → \`${e.element}\`: ${e.detail ?? 'unknown'}`)
          .join('\n'),
    '',
    '## Dead Buttons (nothing happened) [MINOR]',
    '',
    nothingEls.length === 0
      ? 'None'
      : [
          ...nothingEls.slice(0, 60).map((e) => `- \`${e.page}\` → \`${e.element}\``),
          ...(nothingEls.length > 60 ? [`\n... and ${nothingEls.length - 60} more`] : []),
        ].join('\n'),
    '',
    '## Modals Opened',
    '',
    modalEls.length === 0
      ? 'None'
      : modalEls.map((e) => `- \`${e.page}\` → \`${e.element}\``).join('\n'),
    '',
    '## Navigations Triggered',
    '',
    navEls.length === 0
      ? 'None'
      : navEls.map((e) => `- \`${e.page}\` → \`${e.element}\` → \`${e.detail}\``).join('\n'),
    '',
    '## Severity Classification',
    '',
    '| Severity | Count | Description |',
    '|----------|-------|-------------|',
    `| [CRITICAL] | ${jsErrorEls.length} | JS errors thrown on interaction |`,
    `| [MAJOR] | ${clickFailed.length} | Elements that could not be clicked |`,
    `| [MINOR] | ${nothingEls.length} | Buttons/elements with no visible effect |`,
    `| [UX] | ${modalEls.length + navEls.length + dropdownEls.length} | Interactive elements (working correctly) |`,
    '',
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'crawler-part1-summary.md'), md, 'utf-8');
}

// ─── Module-level result collector ──────────────────────────────────────────
const allResults: PageResult[] = [];

// ─── Test suite ─────────────────────────────────────────────────────────────
test.describe('Element Crawler Part 1 (Groups 1–14: Home → HR)', () => {
  test.describe.configure({ mode: 'serial' });

  // Increase timeout for crawler — pages with many elements may need more time
  test.setTimeout(120_000);

  // Group pages by groupIdx
  const groupedPages = new Map<string, PageDef[]>();
  for (const p of PAGES) {
    const key = `Group ${p.groupIdx}: ${p.group}`;
    if (!groupedPages.has(key)) groupedPages.set(key, []);
    groupedPages.get(key)!.push(p);
  }

  for (const [groupLabel, pages] of groupedPages) {
    test.describe(groupLabel, () => {
      for (const pageDef of pages) {
        test(`Crawl: ${pageDef.name} (${pageDef.url})`, async ({ page }) => {
          const result = await crawlPage(page, pageDef);
          allResults.push(result);

          // Soft assertion: page loaded
          test.info().annotations.push({
            type: 'elements',
            description: `${result.totalElements} elements, ${result.jsErrors.length} JS errors, ${result.loadTimeMs}ms load`,
          });
        });
      }
    });
  }

  // Generate reports after all tests complete
  test.afterAll(() => {
    if (allResults.length > 0) {
      generateReports(allResults);
    }
  });
});
