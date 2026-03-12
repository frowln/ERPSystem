/**
 * Performance test configuration — thresholds, URLs, and helpers.
 *
 * SLA targets based on construction ERP requirements:
 * - 50+ active projects, 500+ employees should not slow down
 * - Desktop Chrome baseline (site managers often use budget laptops)
 */

// ── Performance Thresholds (SLA) ──────────────────────────────────────────────

export const PERF_THRESHOLDS = {
  pageLoad: {
    fast: 1000,   // <1s = EXCELLENT (grade A)
    ok: 2000,     // <2s = GOOD (grade B)
    slow: 3000,   // <3s = ACCEPTABLE (grade C)
    fail: 5000,   // >5s = FAIL (grade F) [CRITICAL]
  },
  interaction: {
    fast: 200,    // <200ms = EXCELLENT
    ok: 500,      // <500ms = GOOD
    slow: 1000,   // <1s = ACCEPTABLE
    fail: 3000,   // >3s = FAIL [MAJOR]
  },
  apiResponse: {
    fast: 100,
    ok: 300,
    slow: 1000,
    fail: 5000,
  },
  lcp: 2500,      // Largest Contentful Paint (ms)
  cls: 0.1,       // Cumulative Layout Shift
  fid: 100,       // First Input Delay (ms, approximated)
  jsHeapMax: 150,  // MB — max JS heap after navigation
  domNodesMax: 5000, // DOM nodes — >5000 is concerning
  bundleSizeMax: 2048, // KB — total JS for initial load
  memoryGrowthMax: 50, // % — max memory growth over 50 navigations
} as const;

// ── Grading ───────────────────────────────────────────────────────────────────

export type Grade = 'A' | 'B' | 'C' | 'F';

export function gradePageLoad(ms: number): Grade {
  if (ms < PERF_THRESHOLDS.pageLoad.fast) return 'A';
  if (ms < PERF_THRESHOLDS.pageLoad.ok) return 'B';
  if (ms < PERF_THRESHOLDS.pageLoad.slow) return 'C';
  return 'F';
}

export function gradeInteraction(ms: number): Grade {
  if (ms < PERF_THRESHOLDS.interaction.fast) return 'A';
  if (ms < PERF_THRESHOLDS.interaction.ok) return 'B';
  if (ms < PERF_THRESHOLDS.interaction.slow) return 'C';
  return 'F';
}

export function gradeApi(ms: number): Grade {
  if (ms < PERF_THRESHOLDS.apiResponse.fast) return 'A';
  if (ms < PERF_THRESHOLDS.apiResponse.ok) return 'B';
  if (ms < PERF_THRESHOLDS.apiResponse.slow) return 'C';
  return 'F';
}

// ── ALL Navigation URLs (extracted from navigation.ts) ────────────────────────

export const ALL_NAV_URLS: string[] = [
  // Home
  '/',
  '/analytics',
  '/reports',
  // Tasks
  '/tasks',
  // Calendar
  '/calendar',
  // Planning
  '/planning/gantt',
  '/planning/evm',
  '/planning/resource-planning',
  '/planning/work-volumes',
  // Processes
  '/pm/rfis',
  '/pm/submittals',
  '/pm/issues',
  '/workflow/templates',
  '/workflow/approval-inbox',
  '/change-management/dashboard',
  // Projects
  '/projects',
  '/site-assessments',
  '/portfolio/health',
  // CRM
  '/crm/leads',
  '/crm/dashboard',
  '/counterparties',
  '/portfolio/opportunities',
  '/portfolio/tenders',
  '/bid-packages',
  // Documents
  '/documents',
  '/documents/smart-recognition',
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
  '/data-exchange/import',
  '/data-exchange/export',
  '/data-exchange/mapping',
  '/data-exchange/1c-config',
  '/data-exchange/1c-logs',
  // Design
  '/design/versions',
  '/design/reviews',
  '/design/reviews/board',
  '/design/sections',
  // Exec docs
  '/exec-docs/aosr',
  '/exec-docs/ks6',
  '/exec-docs/incoming-control',
  '/exec-docs/welding',
  '/exec-docs/special-journals',
  // Finance
  '/budgets',
  '/financial-models',
  '/contracts',
  '/commercial-proposals',
  '/invoices',
  '/payments',
  '/cash-flow',
  '/cash-flow/charts',
  '/accounting',
  '/execution-chain',
  '/revenue/dashboard',
  '/revenue/recognition-periods',
  '/revenue/all-contracts',
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
  '/tax-risk',
  // Pricing
  '/specifications',
  '/specifications/competitive-registry',
  '/estimates',
  '/estimates/minstroy',
  '/estimates/pivot',
  '/estimates/volume-calculator',
  '/estimates/pricing/databases',
  '/price-coefficients',
  // Supply & Warehouse
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
  '/operations/work-orders',
  '/dispatch/orders',
  '/dispatch/routes',
  '/operations/dispatch-calendar',
  // HR
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
  // Safety
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
  // Quality & Regulatory
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
  // Fleet & IoT
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
  // Site & BIM
  '/operations/daily-logs',
  '/operations/dashboard',
  '/bim/models',
  '/bim/clash-detection',
  '/bim/drawing-overlay',
  '/bim/drawing-pins',
  '/bim/construction-progress',
  '/bim/defect-heatmap',
  '/m29',
  '/mobile/dashboard',
  '/mobile/reports',
  '/mobile/photos',
  '/ai/photo-analysis',
  '/ai/risk-dashboard',
  // Closeout
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
  // Maintenance
  '/maintenance/dashboard',
  '/maintenance/requests',
  '/maintenance/equipment',
  // Legal
  '/legal/cases',
  '/legal/templates',
  '/insurance-certificates',
  // Portal
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
  // Messenger & Mail
  '/messaging',
  '/mail',
  // Admin
  '/admin/dashboard',
  '/admin/users',
  '/admin/permissions',
  '/admin/departments',
  '/admin/security',
  '/monitoring',
  '/integrations',
  '/admin/system-settings',
  '/support/tickets',
  '/support/dashboard',
  '/settings/subscription',
  '/settings/api-docs',
  '/marketplace',
];

// ── Key pages for focused testing ─────────────────────────────────────────────

/** Top 30 most-used pages (by persona frequency) */
export const TOP_30_PAGES: string[] = [
  '/',
  '/projects',
  '/tasks',
  '/invoices',
  '/payments',
  '/budgets',
  '/financial-models',
  '/contracts',
  '/employees',
  '/timesheets',
  '/safety',
  '/safety/incidents',
  '/warehouse/materials',
  '/specifications',
  '/estimates',
  '/commercial-proposals',
  '/quality',
  '/defects',
  '/operations/daily-logs',
  '/crew',
  '/portfolio/health',
  '/analytics',
  '/calendar',
  '/crm/leads',
  '/crm/dashboard',
  '/admin/users',
  '/admin/permissions',
  '/support/tickets',
  '/documents',
  '/mail',
];

// ── Result types ──────────────────────────────────────────────────────────────

export interface PageLoadResult {
  url: string;
  domReady: number;
  networkIdle: number;
  fullyLoaded: number;
  vitals: NavigationVitals | null;
  memory: MemoryInfo | null;
  domNodes: number;
  grade: Grade;
}

export interface NavigationVitals {
  dns: number;
  tcp: number;
  ttfb: number;
  domParsing: number;
  domContentLoaded: number;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}

export interface InteractionResult {
  page: string;
  action: string;
  elapsed: number;
  grade: Grade;
}

export interface ApiTimingEntry {
  url: string;
  method: string;
  status: number;
  duration: number;
}

export interface BundleChunkInfo {
  name: string;
  size: number;
  duration: number;
}

// ── Report helpers ────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_DIR = path.join(__dirname, '..', '..', 'reports');

export function saveResults(filename: string, data: unknown): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const filePath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function appendToReport(filename: string, content: string): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const filePath = path.join(REPORTS_DIR, filename);
  fs.appendFileSync(filePath, content, 'utf-8');
}

export function writeReport(filename: string, content: string): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const filePath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
}
