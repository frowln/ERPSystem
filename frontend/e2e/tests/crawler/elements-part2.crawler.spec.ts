/**
 * Element Crawler Part 2 — Groups 15–25 (Safety → Admin)
 *
 * Navigates to every page in groups 15–25,
 * discovers all visible interactive elements, clicks each one,
 * and records the outcome (modal, navigation, error, nothing).
 *
 * Output:
 *   e2e/reports/crawler-part2-results.json   — per-element JSON
 *   e2e/reports/crawler-part2-summary.md     — human-readable report
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

// ─── Page catalogue — Groups 15–25 (116 pages) ─────────────────────────────
const PAGES: PageDef[] = [
  // ── Group 15: Safety ────────────────────────────────────────────────────────
  { group: 'Safety', groupIdx: 15, name: 'Safety Dashboard', url: '/safety' },
  { group: 'Safety', groupIdx: 15, name: 'Incidents', url: '/safety/incidents' },
  { group: 'Safety', groupIdx: 15, name: 'Inspections', url: '/safety/inspections' },
  { group: 'Safety', groupIdx: 15, name: 'Briefings', url: '/safety/briefings' },
  { group: 'Safety', groupIdx: 15, name: 'Training Journal', url: '/safety/training-journal' },
  { group: 'Safety', groupIdx: 15, name: 'PPE', url: '/safety/ppe' },
  { group: 'Safety', groupIdx: 15, name: 'Accident Acts', url: '/safety/accident-acts' },
  { group: 'Safety', groupIdx: 15, name: 'Safety Metrics', url: '/safety/metrics' },
  { group: 'Safety', groupIdx: 15, name: 'SOUT', url: '/safety/sout' },
  { group: 'Safety', groupIdx: 15, name: 'Compliance', url: '/safety/compliance' },
  { group: 'Safety', groupIdx: 15, name: 'Violations', url: '/safety/violations' },
  { group: 'Safety', groupIdx: 15, name: 'Worker Certs', url: '/safety/worker-certs' },
  { group: 'Safety', groupIdx: 15, name: 'Certification Matrix', url: '/safety/certification-matrix' },

  // ── Group 16: Quality + Regulatory ──────────────────────────────────────────
  { group: 'Quality', groupIdx: 16, name: 'Quality Dashboard', url: '/quality' },
  { group: 'Quality', groupIdx: 16, name: 'Defects', url: '/defects' },
  { group: 'Quality', groupIdx: 16, name: 'Defect Dashboard', url: '/defects/dashboard' },
  { group: 'Quality', groupIdx: 16, name: 'Defects on Plan', url: '/defects/on-plan' },
  { group: 'Quality', groupIdx: 16, name: 'Defect Pareto', url: '/quality/defect-pareto' },
  { group: 'Quality', groupIdx: 16, name: 'Punch List Items', url: '/punchlist/items' },
  { group: 'Quality', groupIdx: 16, name: 'Punch List Dashboard', url: '/punchlist/dashboard' },
  { group: 'Quality', groupIdx: 16, name: 'Material Inspection', url: '/quality/material-inspection' },
  { group: 'Quality', groupIdx: 16, name: 'Checklist Templates', url: '/quality/checklist-templates' },
  { group: 'Quality', groupIdx: 16, name: 'Checklists', url: '/quality/checklists' },
  { group: 'Quality', groupIdx: 16, name: 'Quality Gates', url: '/quality/gates' },
  { group: 'Quality', groupIdx: 16, name: 'Tolerance Rules', url: '/quality/tolerance-rules' },
  { group: 'Quality', groupIdx: 16, name: 'Tolerance Checks', url: '/quality/tolerance-checks' },
  { group: 'Quality', groupIdx: 16, name: 'Certificates', url: '/quality/certificates' },
  { group: 'Quality', groupIdx: 16, name: 'Defect Register', url: '/quality/defect-register' },
  { group: 'Quality', groupIdx: 16, name: 'Supervision Journal', url: '/quality/supervision-journal' },
  { group: 'Quality', groupIdx: 16, name: 'Regulatory Permits', url: '/regulatory/permits' },
  { group: 'Quality', groupIdx: 16, name: 'Regulatory Inspections', url: '/regulatory/inspections' },
  { group: 'Quality', groupIdx: 16, name: 'Regulatory Dashboard', url: '/regulatory/dashboard' },
  { group: 'Quality', groupIdx: 16, name: 'Prescriptions', url: '/regulatory/prescriptions' },
  { group: 'Quality', groupIdx: 16, name: 'Regulatory Compliance', url: '/regulatory/compliance' },
  { group: 'Quality', groupIdx: 16, name: 'Licenses', url: '/regulatory/licenses' },
  { group: 'Quality', groupIdx: 16, name: 'SRO Licenses', url: '/regulatory/sro-licenses' },
  { group: 'Quality', groupIdx: 16, name: 'Reporting Calendar', url: '/regulatory/reporting-calendar' },
  { group: 'Quality', groupIdx: 16, name: 'Inspection Prep', url: '/regulatory/inspection-prep' },
  { group: 'Quality', groupIdx: 16, name: 'Inspection History', url: '/regulatory/inspection-history' },
  { group: 'Quality', groupIdx: 16, name: 'Prescription Responses', url: '/regulatory/prescription-responses' },
  { group: 'Quality', groupIdx: 16, name: 'Prescriptions Journal', url: '/regulatory/prescriptions-journal' },

  // ── Group 17: Fleet + IoT ──────────────────────────────────────────────────
  { group: 'Fleet', groupIdx: 17, name: 'Fleet Dashboard', url: '/fleet' },
  { group: 'Fleet', groupIdx: 17, name: 'Fuel', url: '/fleet/fuel' },
  { group: 'Fleet', groupIdx: 17, name: 'Fuel Accounting', url: '/fleet/fuel-accounting' },
  { group: 'Fleet', groupIdx: 17, name: 'Maintenance', url: '/fleet/maintenance' },
  { group: 'Fleet', groupIdx: 17, name: 'Maint Repair', url: '/fleet/maint-repair' },
  { group: 'Fleet', groupIdx: 17, name: 'Maintenance Schedule', url: '/fleet/maintenance-schedule' },
  { group: 'Fleet', groupIdx: 17, name: 'Waybills ESM', url: '/fleet/waybills-esm' },
  { group: 'Fleet', groupIdx: 17, name: 'Usage Logs', url: '/fleet/usage-logs' },
  { group: 'Fleet', groupIdx: 17, name: 'GPS Tracking', url: '/fleet/gps-tracking' },
  { group: 'Fleet', groupIdx: 17, name: 'Driver Rating', url: '/fleet/driver-rating' },
  { group: 'Fleet', groupIdx: 17, name: 'IoT Devices', url: '/iot/devices' },
  { group: 'Fleet', groupIdx: 17, name: 'IoT Sensors', url: '/iot/sensors' },
  { group: 'Fleet', groupIdx: 17, name: 'IoT Alerts', url: '/iot/alerts' },

  // ── Group 18: Site + BIM ───────────────────────────────────────────────────
  { group: 'Site', groupIdx: 18, name: 'Daily Logs', url: '/operations/daily-logs' },
  { group: 'Site', groupIdx: 18, name: 'Operations Dashboard', url: '/operations/dashboard' },
  { group: 'Site', groupIdx: 18, name: 'BIM Models', url: '/bim/models' },
  { group: 'Site', groupIdx: 18, name: 'Clash Detection', url: '/bim/clash-detection' },
  { group: 'Site', groupIdx: 18, name: 'Drawing Overlay', url: '/bim/drawing-overlay' },
  { group: 'Site', groupIdx: 18, name: 'Drawing Pins', url: '/bim/drawing-pins' },
  { group: 'Site', groupIdx: 18, name: 'Construction Progress', url: '/bim/construction-progress' },
  { group: 'Site', groupIdx: 18, name: 'Defect Heatmap', url: '/bim/defect-heatmap' },
  { group: 'Site', groupIdx: 18, name: 'M29', url: '/m29' },
  { group: 'Site', groupIdx: 18, name: 'Mobile Dashboard', url: '/mobile/dashboard' },
  { group: 'Site', groupIdx: 18, name: 'Mobile Reports', url: '/mobile/reports' },
  { group: 'Site', groupIdx: 18, name: 'Mobile Photos', url: '/mobile/photos' },
  { group: 'Site', groupIdx: 18, name: 'AI Photo Analysis', url: '/ai/photo-analysis' },
  { group: 'Site', groupIdx: 18, name: 'AI Risk Dashboard', url: '/ai/risk-dashboard' },

  // ── Group 19: Closeout ─────────────────────────────────────────────────────
  { group: 'Closeout', groupIdx: 19, name: 'Closeout Dashboard', url: '/closeout/dashboard' },
  { group: 'Closeout', groupIdx: 19, name: 'Commissioning', url: '/closeout/commissioning' },
  { group: 'Closeout', groupIdx: 19, name: 'Commissioning Templates', url: '/closeout/commissioning-templates' },
  { group: 'Closeout', groupIdx: 19, name: 'Handover', url: '/closeout/handover' },
  { group: 'Closeout', groupIdx: 19, name: 'Warranty', url: '/closeout/warranty' },
  { group: 'Closeout', groupIdx: 19, name: 'Warranty Obligations', url: '/closeout/warranty-obligations' },
  { group: 'Closeout', groupIdx: 19, name: 'Warranty Tracking', url: '/closeout/warranty-tracking' },
  { group: 'Closeout', groupIdx: 19, name: 'As-Built', url: '/closeout/as-built' },
  { group: 'Closeout', groupIdx: 19, name: 'ZOS', url: '/closeout/zos' },
  { group: 'Closeout', groupIdx: 19, name: 'Stroynadzor', url: '/closeout/stroynadzor' },
  { group: 'Closeout', groupIdx: 19, name: 'Executive Schemas', url: '/closeout/executive-schemas' },

  // ── Group 20: Maintenance ──────────────────────────────────────────────────
  { group: 'Maintenance', groupIdx: 20, name: 'Maintenance Dashboard', url: '/maintenance/dashboard' },
  { group: 'Maintenance', groupIdx: 20, name: 'Maintenance Requests', url: '/maintenance/requests' },
  { group: 'Maintenance', groupIdx: 20, name: 'Maintenance Equipment', url: '/maintenance/equipment' },

  // ── Group 21: Legal ────────────────────────────────────────────────────────
  { group: 'Legal', groupIdx: 21, name: 'Legal Cases', url: '/legal/cases' },
  { group: 'Legal', groupIdx: 21, name: 'Legal Templates', url: '/legal/templates' },
  { group: 'Legal', groupIdx: 21, name: 'Insurance Certificates', url: '/insurance-certificates' },

  // ── Group 22: Portal ───────────────────────────────────────────────────────
  { group: 'Portal', groupIdx: 22, name: 'Portal Dashboard', url: '/portal' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Projects', url: '/portal/projects' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Documents', url: '/portal/documents' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Contracts', url: '/portal/contracts' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Invoices', url: '/portal/invoices' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Tasks', url: '/portal/tasks' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Schedule', url: '/portal/schedule' },
  { group: 'Portal', groupIdx: 22, name: 'Portal RFIs', url: '/portal/rfis' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Defects', url: '/portal/defects' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Signatures', url: '/portal/signatures' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Photos', url: '/portal/photos' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Daily Reports', url: '/portal/daily-reports' },
  { group: 'Portal', groupIdx: 22, name: 'Portal CP Approval', url: '/portal/cp-approval' },
  { group: 'Portal', groupIdx: 22, name: 'Portal KS2 Drafts', url: '/portal/ks2-drafts' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Settings', url: '/portal/settings' },
  { group: 'Portal', groupIdx: 22, name: 'Portal Admin', url: '/portal/admin' },

  // ── Group 23: Messenger ────────────────────────────────────────────────────
  { group: 'Messenger', groupIdx: 23, name: 'Messaging', url: '/messaging' },

  // ── Group 24: Mail ─────────────────────────────────────────────────────────
  { group: 'Mail', groupIdx: 24, name: 'Mail', url: '/mail' },

  // ── Group 25: Admin ────────────────────────────────────────────────────────
  { group: 'Admin', groupIdx: 25, name: 'Admin Dashboard', url: '/admin/dashboard' },
  { group: 'Admin', groupIdx: 25, name: 'Users', url: '/admin/users' },
  { group: 'Admin', groupIdx: 25, name: 'Permissions', url: '/admin/permissions' },
  { group: 'Admin', groupIdx: 25, name: 'Departments', url: '/admin/departments' },
  { group: 'Admin', groupIdx: 25, name: 'Security', url: '/admin/security' },
  { group: 'Admin', groupIdx: 25, name: 'Monitoring', url: '/monitoring' },
  { group: 'Admin', groupIdx: 25, name: 'Integrations', url: '/integrations' },
  { group: 'Admin', groupIdx: 25, name: 'System Settings', url: '/admin/system-settings' },
  { group: 'Admin', groupIdx: 25, name: 'Support Tickets', url: '/support/tickets' },
  { group: 'Admin', groupIdx: 25, name: 'Support Dashboard', url: '/support/dashboard' },
  { group: 'Admin', groupIdx: 25, name: 'Subscription', url: '/settings/subscription' },
  { group: 'Admin', groupIdx: 25, name: 'API Docs', url: '/settings/api-docs' },
  { group: 'Admin', groupIdx: 25, name: 'Marketplace', url: '/marketplace' },
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
    path.join(REPORTS_DIR, 'crawler-part2-results.json'),
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

  // ── Issue classification ────────────────────────────────────────────────
  const criticalIssues: string[] = [];
  const majorIssues: string[] = [];
  const minorIssues: string[] = [];
  const uxIssues: string[] = [];
  const missingIssues: string[] = [];

  // CRITICAL: JS errors on interaction
  for (const e of jsErrorEls) {
    criticalIssues.push(`JS error on \`${e.page}\` → \`${e.element}\`: ${e.detail ?? 'unknown'}`);
  }

  // CRITICAL: pages that failed to load
  for (const r of results) {
    for (const err of r.jsErrors) {
      if (err.startsWith('LOAD_FAILED:')) {
        criticalIssues.push(`Page load failed: \`${r.page}\` — ${err}`);
      }
    }
  }

  // MAJOR: click failures (element visible but not clickable)
  for (const e of clickFailed) {
    majorIssues.push(`Click failed on \`${e.page}\` → \`${e.element}\`: ${e.detail ?? 'unknown'}`);
  }

  // MINOR: dead buttons (nothing happened on click)
  for (const e of nothingEls) {
    minorIssues.push(`Dead button on \`${e.page}\` → \`${e.element}\``);
  }

  // UX: pages with 0 interactive elements (possible empty/stub page)
  for (const r of results) {
    if (r.totalElements === 0 && r.jsErrors.length === 0) {
      uxIssues.push(`Page \`${r.page}\` (${r.name}) has 0 interactive elements — possible stub/empty page`);
    }
  }

  // MISSING: pages with very slow load time (>5s)
  for (const r of results) {
    if (r.loadTimeMs > 5000) {
      uxIssues.push(`Slow load: \`${r.page}\` (${r.name}) took ${r.loadTimeMs}ms`);
    }
  }

  // ── Markdown ────────────────────────────────────────────────────────────
  const md = [
    '# Element Crawler Part 2 — Results Summary',
    '',
    `> Generated: ${new Date().toISOString()}`,
    `> Pages: Groups 15–25 (Safety → Admin)`,
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
    '## Issue Classification',
    '',
    '| Severity | Count | Description |',
    '|----------|-------|-------------|',
    `| [CRITICAL] | ${criticalIssues.length} | JS errors, page load failures |`,
    `| [MAJOR] | ${majorIssues.length} | Elements that could not be clicked |`,
    `| [MINOR] | ${minorIssues.length} | Buttons/elements with no visible effect |`,
    `| [UX] | ${uxIssues.length} | Empty pages, slow loads |`,
    `| [MISSING] | ${missingIssues.length} | Expected features not found |`,
    '',
    '## [CRITICAL] Issues — JS Errors & Load Failures',
    '',
    criticalIssues.length === 0
      ? 'None — all pages clean!'
      : criticalIssues.map((i) => `- ${i}`).join('\n'),
    '',
    '## [MAJOR] Issues — Click Failures',
    '',
    majorIssues.length === 0
      ? 'None'
      : majorIssues.map((i) => `- ${i}`).join('\n'),
    '',
    '## [MINOR] Issues — Dead Buttons',
    '',
    minorIssues.length === 0
      ? 'None'
      : [
          ...minorIssues.slice(0, 60).map((i) => `- ${i}`),
          ...(minorIssues.length > 60 ? [`\n... and ${minorIssues.length - 60} more`] : []),
        ].join('\n'),
    '',
    '## [UX] Issues — Empty Pages & Slow Loads',
    '',
    uxIssues.length === 0
      ? 'None'
      : uxIssues.map((i) => `- ${i}`).join('\n'),
    '',
    '## Pages with JS Errors',
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
    '## Domain Expert Assessment',
    '',
    '### Safety Module (Группа 15)',
    '- 13 pages covering: incidents, inspections, briefings, training, PPE, SOUT, violations',
    '- **Business rule**: Every active site must have safety manager + current training records',
    '- **Key check**: Training expiry warnings, incident severity notifications',
    '',
    '### Quality + Regulatory Module (Группа 16)',
    '- 28 pages covering: defects, punch lists, checklists, quality gates, permits, SRO',
    '- **Business rule**: Open defects > 30 days = quality management failing',
    '- **Key check**: Inspection pass rate, repeat defect detection, regulatory compliance',
    '',
    '### Fleet + IoT Module (Группа 17)',
    '- 13 pages covering: vehicles, fuel, maintenance, waybills, GPS, IoT sensors/alerts',
    '- **Business rule**: Equipment downtime tracking, fuel consumption anomalies',
    '- **Key check**: GPS tracking data freshness, maintenance schedule adherence',
    '',
    '### Site + BIM Module (Группа 18)',
    '- 14 pages covering: daily logs, BIM models, clash detection, AI photo analysis',
    '- **Business rule**: Daily log must be filed every active construction day',
    '- **Key check**: BIM-field bridge, defect heatmap accuracy, photo analysis coverage',
    '',
    '### Closeout Module (Группа 19)',
    '- 11 pages covering: commissioning, handover, warranty, as-built, stroynadzor',
    '- **Business rule**: No handover without complete documentation package',
    '- **Key check**: Warranty obligation tracking, executive schema completeness',
    '',
    '### Portal Module (Группа 22)',
    '- 16 pages covering: contractor portal dashboard, projects, docs, tasks, КС-2 drafts',
    '- **Business rule**: Contractor sees only their assigned projects/documents',
    '- **Key check**: Data isolation between contractors, CP approval workflow',
    '',
    '### Admin Module (Группа 25)',
    '- 13 pages covering: users, permissions, departments, security, monitoring, API docs',
    '- **Business rule**: RBAC matrix enforced, audit trail for all admin actions',
    '- **Key check**: Permission changes propagate immediately, session management',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'crawler-part2-summary.md'), md, 'utf-8');
}

// ─── Module-level result collector ──────────────────────────────────────────
const allResults: PageResult[] = [];

// ─── Test suite ─────────────────────────────────────────────────────────────
test.describe('Element Crawler Part 2 (Groups 15–25: Safety → Admin)', () => {
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
