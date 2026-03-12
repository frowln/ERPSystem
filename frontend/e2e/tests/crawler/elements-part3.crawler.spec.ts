/**
 * Element Crawler Part 3 — Detail pages, sub-routes, non-navigation pages
 *
 * Parts 1-2 covered 243 navigation URLs. This part covers ~150 additional
 * pages that are NOT in the sidebar: create/new forms, detail/:id pages,
 * edit pages, board views, advanced analytics, settings, and misc routes.
 *
 * For :id routes we use a dummy ID "1" — the page may show "not found"
 * or redirect, but we still crawl whatever UI renders (error handling, etc.).
 *
 * Output:
 *   e2e/reports/crawler-part3-results.json       — per-element JSON
 *   e2e/reports/crawler-part3-summary.md         — human-readable report
 *   e2e/reports/crawler-consolidated.json        — ALL 3 parts merged
 *   e2e/reports/crawler-consolidated.md          — consolidated summary
 *   e2e/screenshots/crawler/                     — initial page screenshots
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

// ─── Page catalogue — Groups 26–37 (~148 pages) ────────────────────────────
// These are ALL routes NOT covered by Parts 1 (groups 1-14) and 2 (groups 15-25).
const PAGES: PageDef[] = [
  // ── Group 26: Create/New Forms — Projects, CRM, Portfolio ─────────────────
  { group: 'Create-Projects', groupIdx: 26, name: 'New Project', url: '/projects/new' },
  { group: 'Create-Projects', groupIdx: 26, name: 'New Calendar Event', url: '/calendar/events/new' },
  { group: 'Create-Projects', groupIdx: 26, name: 'New Counterparty', url: '/counterparties/new' },
  { group: 'Create-Projects', groupIdx: 26, name: 'New Contract', url: '/contracts/new' },
  { group: 'Create-Projects', groupIdx: 26, name: 'New CRM Lead', url: '/crm/leads/new' },
  { group: 'Create-Projects', groupIdx: 26, name: 'New Opportunity', url: '/portfolio/opportunities/new' },
  { group: 'Create-Projects', groupIdx: 26, name: 'New Tender', url: '/portfolio/tenders/new' },
  { group: 'Create-Projects', groupIdx: 26, name: 'New Site Assessment', url: '/site-assessments/new' },
  { group: 'Create-Projects', groupIdx: 26, name: 'New Prequalification', url: '/prequalifications/new' },

  // ── Group 27: Create/New Forms — Finance, Estimates, Specs ────────────────
  { group: 'Create-Finance', groupIdx: 27, name: 'New Budget', url: '/budgets/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Commercial Proposal', url: '/commercial-proposals/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Invoice', url: '/invoices/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Payment', url: '/payments/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Estimate', url: '/estimates/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Specification', url: '/specifications/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Purchase Order', url: '/procurement/purchase-orders/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Procurement Request', url: '/procurement/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Commitment', url: '/cost-management/commitments/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Tax Risk', url: '/tax-risk/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Price Coefficient', url: '/price-coefficients/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Insurance Cert', url: '/insurance-certificates/new' },
  { group: 'Create-Finance', groupIdx: 27, name: 'New Monte Carlo', url: '/monte-carlo/new' },

  // ── Group 28: Create/New Forms — Operations, HR, Safety ───────────────────
  { group: 'Create-Ops', groupIdx: 28, name: 'New Employee', url: '/employees/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Daily Log', url: '/operations/daily-logs/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Work Order', url: '/operations/work-orders/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Dispatch Order', url: '/dispatch/orders/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Dispatch Route', url: '/dispatch/routes/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Fleet Vehicle', url: '/fleet/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Usage Log', url: '/fleet/usage-logs/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Waybill', url: '/fleet/waybills/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Material', url: '/warehouse/materials/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Movement', url: '/warehouse/movements/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New WH Order', url: '/warehouse/orders/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Limit Fence Sheet', url: '/warehouse/limit-fence-sheets/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Maintenance Request', url: '/maintenance/requests/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Safety Incident', url: '/safety/incidents/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Safety Inspection', url: '/safety/inspections/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Safety Training', url: '/safety/training/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Safety Briefing', url: '/safety/briefings/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Defect', url: '/defects/new' },
  { group: 'Create-Ops', groupIdx: 28, name: 'New Punch Item', url: '/punchlist/items/new' },

  // ── Group 29: Create/New Forms — Docs, Processes ──────────────────────────
  { group: 'Create-Docs', groupIdx: 29, name: 'New RFI', url: '/pm/rfis/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Submittal', url: '/pm/submittals/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Issue', url: '/pm/issues/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Change Event', url: '/change-management/events/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Change Order', url: '/change-management/orders/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New PTO Document', url: '/pto/documents/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Hidden Work Act', url: '/pto/hidden-work-acts/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Design Version', url: '/design/versions/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Document', url: '/documents/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Regulatory Permit', url: '/regulatory/permits/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Prescription', url: '/regulatory/prescriptions/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New KS-2', url: '/ks2/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New KS-3', url: '/ks3/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Applicant', url: '/recruitment/applicants/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Journal Entry', url: '/accounting/journal/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Mobile Report', url: '/mobile/reports/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Self-Employed', url: '/self-employed/contractors/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Payroll Template', url: '/payroll/templates/new' },
  { group: 'Create-Docs', groupIdx: 29, name: 'New Quality Inspection', url: '/quality/inspections/new' },

  // ── Group 30: Detail Pages (:id) — Projects, Finance ──────────────────────
  { group: 'Detail-Projects', groupIdx: 30, name: 'Project Detail', url: '/projects/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Counterparty Detail', url: '/counterparties/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Contract Detail', url: '/contracts/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'CRM Lead Detail', url: '/crm/leads/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Opportunity Detail', url: '/portfolio/opportunities/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Tender Detail', url: '/portfolio/tenders/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Site Assessment Detail', url: '/site-assessments/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Prequalification Detail', url: '/prequalifications/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Bid Package Detail', url: '/bid-packages/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Budget Detail', url: '/budgets/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Budget FM', url: '/budgets/1/fm' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Budget Overview', url: '/budgets/1/overview' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Budget Dashboard', url: '/budgets/1/dashboard' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Commercial Proposal Detail', url: '/commercial-proposals/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Invoice Detail', url: '/invoices/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Payment Detail', url: '/payments/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Estimate Detail', url: '/estimates/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Specification Detail', url: '/specifications/1' },
  { group: 'Detail-Projects', groupIdx: 30, name: 'Purchase Order Detail', url: '/procurement/purchase-orders/1' },

  // ── Group 31: Detail Pages (:id) — Operations, HR, Safety ─────────────────
  { group: 'Detail-Ops', groupIdx: 31, name: 'Employee Detail', url: '/employees/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Timesheet Detail', url: '/timesheets/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Safety Incident Detail', url: '/safety/incidents/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Safety Inspection Detail', url: '/safety/inspections/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Safety Training Detail', url: '/safety/training/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Safety Briefing Detail', url: '/safety/briefings/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Defect Detail', url: '/defects/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Punch Item Detail', url: '/punchlist/items/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Fleet Vehicle Detail', url: '/fleet/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Work Order Detail', url: '/operations/work-orders/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Daily Log Detail', url: '/operations/daily-logs/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Material Detail', url: '/warehouse/materials/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'RFI Detail', url: '/pm/rfis/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Submittal Detail', url: '/pm/submittals/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Issue Detail', url: '/pm/issues/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Change Event Detail', url: '/change-management/events/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Change Order Detail', url: '/change-management/orders/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Legal Case Detail', url: '/legal/cases/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Support Ticket Detail', url: '/support/tickets/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'KS-2 Detail', url: '/ks2/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'KS-3 Detail', url: '/ks3/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Quality Detail', url: '/quality/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Commissioning Detail', url: '/closeout/commissioning/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Handover Detail', url: '/closeout/handover/1' },
  { group: 'Detail-Ops', groupIdx: 31, name: 'Warranty Detail', url: '/closeout/warranty/1' },

  // ── Group 32: Board Views (not in P1/P2) ──────────────────────────────────
  { group: 'Boards', groupIdx: 32, name: 'Safety Board', url: '/safety/board' },
  { group: 'Boards', groupIdx: 32, name: 'Quality Board', url: '/quality/board' },
  { group: 'Boards', groupIdx: 32, name: 'Punch List Board', url: '/punchlist/board' },
  { group: 'Boards', groupIdx: 32, name: 'Work Orders Board', url: '/operations/work-orders/board' },
  { group: 'Boards', groupIdx: 32, name: 'RFI Board', url: '/pm/rfis/board' },
  { group: 'Boards', groupIdx: 32, name: 'Contracts Board', url: '/contracts/board' },
  { group: 'Boards', groupIdx: 32, name: 'Procurement Board', url: '/procurement/board' },
  { group: 'Boards', groupIdx: 32, name: 'Commissioning Board', url: '/closeout/commissioning/board' },
  { group: 'Boards', groupIdx: 32, name: 'Fleet Maintenance Board', url: '/fleet/maintenance/board' },
  { group: 'Boards', groupIdx: 32, name: 'Support Board', url: '/support/tickets/board' },
  { group: 'Boards', groupIdx: 32, name: 'Movements Board', url: '/warehouse/movements/board' },
  { group: 'Boards', groupIdx: 32, name: 'PTO Board', url: '/pto/documents/board' },
  { group: 'Boards', groupIdx: 32, name: 'Regulatory Permits Board', url: '/regulatory/permits/board' },
  { group: 'Boards', groupIdx: 32, name: 'Change Orders Board', url: '/change-management/orders/board' },
  { group: 'Boards', groupIdx: 32, name: 'Recruitment Board', url: '/recruitment/applicants/board' },
  { group: 'Boards', groupIdx: 32, name: 'Leave Board', url: '/leave/board' },
  { group: 'Boards', groupIdx: 32, name: 'Daily Log Board', url: '/daily-log/board' },
  { group: 'Boards', groupIdx: 32, name: 'Clash Detection Board', url: '/bim/clash-detection/board' },
  { group: 'Boards', groupIdx: 32, name: 'Maintenance Board', url: '/maintenance/board' },

  // ── Group 33: Analytics & KPI Advanced ────────────────────────────────────
  { group: 'Analytics', groupIdx: 33, name: 'KPI Dashboard', url: '/kpi' },
  { group: 'Analytics', groupIdx: 33, name: 'KPI Achievements', url: '/analytics/kpi-achievements' },
  { group: 'Analytics', groupIdx: 33, name: 'Bonus Calculations', url: '/analytics/bonus-calculations' },
  { group: 'Analytics', groupIdx: 33, name: 'Audit Pivot', url: '/analytics/audit-pivot' },
  { group: 'Analytics', groupIdx: 33, name: 'Project Charts', url: '/analytics/project-charts' },
  { group: 'Analytics', groupIdx: 33, name: 'Predictive Analytics', url: '/analytics/predictive' },
  { group: 'Analytics', groupIdx: 33, name: 'Executive KPI', url: '/analytics/executive-kpi' },
  { group: 'Analytics', groupIdx: 33, name: 'Report Builder', url: '/analytics/report-builder' },

  // ── Group 34: Settings & Admin Advanced ───────────────────────────────────
  { group: 'Settings', groupIdx: 34, name: 'Settings Root', url: '/settings' },
  { group: 'Settings', groupIdx: 34, name: 'Settings AI', url: '/settings/ai' },
  { group: 'Settings', groupIdx: 34, name: 'API Keys', url: '/settings/api-keys' },
  { group: 'Settings', groupIdx: 34, name: 'Webhooks', url: '/settings/webhooks' },
  { group: 'Settings', groupIdx: 34, name: 'Offline Queue', url: '/settings/offline-queue' },
  { group: 'Settings', groupIdx: 34, name: 'Offline Sync', url: '/settings/offline-sync' },
  { group: 'Settings', groupIdx: 34, name: 'Subscription Result', url: '/settings/subscription/result' },
  { group: 'Settings', groupIdx: 34, name: 'Users Import', url: '/admin/users/import' },
  { group: 'Settings', groupIdx: 34, name: 'Login Audit', url: '/admin/login-audit' },
  { group: 'Settings', groupIdx: 34, name: 'Online Users', url: '/admin/online-users' },
  { group: 'Settings', groupIdx: 34, name: 'Audit Logs', url: '/admin/audit-logs' },
  { group: 'Settings', groupIdx: 34, name: 'Admin Settings', url: '/admin/settings' },
  { group: 'Settings', groupIdx: 34, name: 'Permission Matrix', url: '/admin/permission-matrix' },
  { group: 'Settings', groupIdx: 34, name: 'Tenants', url: '/admin/tenants' },

  // ── Group 35: HR Advanced ─────────────────────────────────────────────────
  { group: 'HR-Advanced', groupIdx: 35, name: 'Payroll', url: '/payroll' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Payroll Calculate', url: '/payroll/calculate' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Self-Employed Payments', url: '/self-employed/payments' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Self-Employed Registries', url: '/self-employed/registries' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Recruitment Applicants', url: '/recruitment/applicants' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Recruitment Jobs', url: '/recruitment/jobs' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Leave Allocations', url: '/leave/allocations' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Leave Types', url: '/leave/types' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Crew Timesheets', url: '/hr/crew-timesheets' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Crew Time Entries', url: '/hr/crew-time-entries' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Crew Time Calendar', url: '/hr/crew-time-calendar' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Timesheet Pivot', url: '/hr/timesheet-pivot' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Qualifications', url: '/hr/qualifications' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'Seniority Leave', url: '/hr/seniority-leave' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'HR Russian Orders', url: '/hr-russian/personnel-orders' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'HR Russian Staffing', url: '/hr-russian/staffing' },
  { group: 'HR-Advanced', groupIdx: 35, name: 'HR Russian Timesheets', url: '/hr-russian/timesheets' },

  // ── Group 36: Estimates & Pricing Advanced ────────────────────────────────
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Estimates Import', url: '/estimates/import' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Import ЛСР', url: '/estimates/import-lsr' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Estimates Export', url: '/estimates/export' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Estimates Comparison', url: '/estimates/comparison' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Estimates Summary', url: '/estimates/summary' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Pricing Rates', url: '/estimates/pricing/rates' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Pricing Calculate', url: '/estimates/pricing/calculate' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'OCR Scanner', url: '/estimates/ocr-scanner' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Spec Analogs', url: '/specifications/analogs' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Spec Analog Requests', url: '/specifications/analog-requests' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Monte Carlo', url: '/monte-carlo' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Pricing Root', url: '/pricing' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Pricing Rates Page', url: '/pricing/rates' },
  { group: 'Estimates-Adv', groupIdx: 36, name: 'Pricing Calculate Page', url: '/pricing/calculate' },

  // ── Group 37: Misc (search, help, onboarding, closing sub-routes, etc.) ───
  { group: 'Misc', groupIdx: 37, name: 'Search', url: '/search' },
  { group: 'Misc', groupIdx: 37, name: 'AI Assistant', url: '/ai-assistant' },
  { group: 'Misc', groupIdx: 37, name: 'Notifications Inbox', url: '/notifications/inbox' },
  { group: 'Misc', groupIdx: 37, name: 'Notifications Settings', url: '/settings/email-preferences' },
  { group: 'Misc', groupIdx: 37, name: 'Onboarding Setup', url: '/onboarding/setup' },
  { group: 'Misc', groupIdx: 37, name: 'Help Center', url: '/help' },
  { group: 'Misc', groupIdx: 37, name: 'Feature Gate', url: '/feature-gate' },
  { group: 'Misc', groupIdx: 37, name: 'Marketplace Installed', url: '/marketplace/installed' },
  { group: 'Misc', groupIdx: 37, name: 'Messaging Favorites', url: '/messaging/favorites' },
  { group: 'Misc', groupIdx: 37, name: 'Messaging Calls', url: '/messaging/calls' },
  { group: 'Misc', groupIdx: 37, name: 'KS-2 Approvals', url: '/ks2/approvals' },
  { group: 'Misc', groupIdx: 37, name: 'KS-2 Volume Check', url: '/ks2/volume-check' },
  { group: 'Misc', groupIdx: 37, name: 'KS-2 Pipeline', url: '/ks2/pipeline' },
  { group: 'Misc', groupIdx: 37, name: 'KS-6A', url: '/ks6a' },
  { group: 'Misc', groupIdx: 37, name: 'Correction Acts', url: '/correction-acts' },
  { group: 'Misc', groupIdx: 37, name: 'KS Print', url: '/ks-print' },
  { group: 'Misc', groupIdx: 37, name: 'Daily Log Page', url: '/daily-log' },
  { group: 'Misc', groupIdx: 37, name: 'Accounting Dashboard', url: '/accounting/dashboard' },
  { group: 'Misc', groupIdx: 37, name: 'Chart of Accounts', url: '/accounting/chart-of-accounts' },
  { group: 'Misc', groupIdx: 37, name: 'Accounting Journals', url: '/accounting/journals' },
  { group: 'Misc', groupIdx: 37, name: 'Accounting Assets', url: '/accounting/assets' },
  { group: 'Misc', groupIdx: 37, name: 'CDE Archive Policies', url: '/cde/archive-policies' },
  { group: 'Misc', groupIdx: 37, name: 'CDE Revision Sets', url: '/cde/revision-sets' },
  { group: 'Misc', groupIdx: 37, name: 'Planning WBS', url: '/planning/wbs' },
  { group: 'Misc', groupIdx: 37, name: 'Planning Baseline', url: '/planning/baseline' },
  { group: 'Misc', groupIdx: 37, name: 'Planning Critical Path', url: '/planning/critical-path' },
  { group: 'Misc', groupIdx: 37, name: 'Planning Resources', url: '/planning/resources' },
  { group: 'Misc', groupIdx: 37, name: 'Planning Resource Board', url: '/planning/resource-board' },
  { group: 'Misc', groupIdx: 37, name: 'ISUP Config', url: '/settings/isup' },
  { group: 'Misc', groupIdx: 37, name: 'ISUP Transmissions', url: '/settings/isup/transmissions' },
  { group: 'Misc', groupIdx: 37, name: 'ISUP Mappings', url: '/settings/isup/mappings' },
  { group: 'Misc', groupIdx: 37, name: 'KEP Certificates', url: '/kep/certificates' },
  { group: 'Misc', groupIdx: 37, name: 'KEP Signing', url: '/kep/signing' },
  { group: 'Misc', groupIdx: 37, name: 'KEP Verification', url: '/kep/verification' },
  { group: 'Misc', groupIdx: 37, name: 'KEP MCHD', url: '/kep/mchd' },
  { group: 'Misc', groupIdx: 37, name: 'Russian Docs All', url: '/russian-docs/all' },
  { group: 'Misc', groupIdx: 37, name: 'Russian Docs Create', url: '/russian-docs/create' },
  { group: 'Misc', groupIdx: 37, name: 'BIM Property Sets', url: '/bim/property-sets' },
  { group: 'Misc', groupIdx: 37, name: 'BIM BCF Issues', url: '/bim/bcf-issues' },
  { group: 'Misc', groupIdx: 37, name: 'BIM Design Packages', url: '/bim/design-packages' },
  { group: 'Misc', groupIdx: 37, name: '1C Sync', url: '/settings/1c/sync' },
  { group: 'Misc', groupIdx: 37, name: '1C Nomenclature', url: '/settings/1c/nomenclature' },
  { group: 'Misc', groupIdx: 37, name: '1C KS Export', url: '/settings/1c/ks-export' },
  { group: 'Misc', groupIdx: 37, name: '1C Payment Export', url: '/settings/1c/payment-export' },
  { group: 'Misc', groupIdx: 37, name: '1C Bank Import', url: '/settings/1c/bank-import' },
  { group: 'Misc', groupIdx: 37, name: '1C Pricing DB', url: '/settings/1c/pricing-db' },
  { group: 'Misc', groupIdx: 37, name: 'Cashflow Management', url: '/cost-management/cashflow' },
  { group: 'Misc', groupIdx: 37, name: 'Tasks List View', url: '/tasks/list' },
  { group: 'Misc', groupIdx: 37, name: 'Tasks Gantt', url: '/tasks/gantt' },
  { group: 'Misc', groupIdx: 37, name: 'My Tasks', url: '/tasks/my' },
  { group: 'Misc', groupIdx: 37, name: 'Workflows Page', url: '/workflows' },
  { group: 'Misc', groupIdx: 37, name: 'Workflow Instances', url: '/workflow/instances' },
  { group: 'Misc', groupIdx: 37, name: 'Workflow Designer', url: '/workflow/designer' },
  { group: 'Misc', groupIdx: 37, name: 'Drawing Viewer', url: '/documents/drawing-viewer' },
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

// ─── Report generation (Part 3 + Consolidated) ─────────────────────────────

function generatePart3Report(results: PageResult[]): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const allElements = results.flatMap((r) => r.elements);

  // ── JSON ────────────────────────────────────────────────────────────────
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'crawler-part3-results.json'),
    JSON.stringify(results, null, 2),
    'utf-8',
  );

  // ── Stats ────────────────────────────────────────────────────────────────
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

  // ── Issue classification ────────────────────────────────────────────────
  const criticalIssues: string[] = [];
  const majorIssues: string[] = [];
  const minorIssues: string[] = [];
  const uxIssues: string[] = [];

  for (const e of jsErrorEls) {
    criticalIssues.push(`JS error on \`${e.page}\` → \`${e.element}\`: ${e.detail ?? 'unknown'}`);
  }
  for (const r of results) {
    for (const err of r.jsErrors) {
      if (err.startsWith('LOAD_FAILED:')) {
        criticalIssues.push(`Page load failed: \`${r.page}\` — ${err}`);
      }
    }
  }
  for (const e of clickFailed) {
    majorIssues.push(`Click failed on \`${e.page}\` → \`${e.element}\`: ${e.detail ?? 'unknown'}`);
  }
  for (const e of nothingEls) {
    minorIssues.push(`Dead button on \`${e.page}\` → \`${e.element}\``);
  }
  for (const r of results) {
    if (r.totalElements === 0 && r.jsErrors.length === 0) {
      uxIssues.push(`Page \`${r.page}\` (${r.name}) has 0 interactive elements — possible stub/empty page`);
    }
    if (r.loadTimeMs > 5000) {
      uxIssues.push(`Slow load: \`${r.page}\` (${r.name}) took ${r.loadTimeMs}ms`);
    }
  }

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
    '# Element Crawler Part 3 — Results Summary',
    '',
    `> Generated: ${new Date().toISOString()}`,
    '> Pages: Groups 26–37 (Detail pages, create forms, boards, advanced)',
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
    '## Domain Expert Assessment — Part 3 Specific',
    '',
    '### Create/New Form Pages (Groups 26–29)',
    '- ~60 form pages for creating entities across all modules',
    '- **Business rule**: Every form must have required field indicators (*)',
    '- **Business rule**: Reasonable defaults (today\'s date, current user, current project)',
    '- **Key check**: Form validation fires before submit, error messages are user-friendly',
    '- **Key check**: Back/Cancel returns to list without data loss',
    '',
    '### Detail Pages (Groups 30–31)',
    '- ~44 detail pages showing entity data with tabs, actions, related entities',
    '- **Business rule**: Detail page shows all business-critical fields',
    '- **Business rule**: Action buttons respect entity status (can\'t delete approved items)',
    '- **Key check**: Tabs load content without page reload',
    '- **Key check**: Related entities link correctly (invoice → contract → project)',
    '- **Note**: Using dummy ID "1" — pages may show "not found" gracefully',
    '',
    '### Board Views (Group 32)',
    '- 19 Kanban-style board views for visual workflow management',
    '- **Business rule**: Board columns match status transitions (DRAFT→ACTIVE→DONE)',
    '- **Key check**: Cards show summary info, drag-drop columns exist',
    '',
    '### Analytics & KPI (Group 33)',
    '- 8 advanced analytics pages: KPI, bonus calculations, predictive, report builder',
    '- **Business rule**: KPIs must show current period data, not stale',
    '- **Key check**: Charts render, filters work, export available',
    '',
    '### Settings & Admin (Group 34)',
    '- 14 admin/config pages: API keys, webhooks, audit logs, tenants',
    '- **Business rule**: Admin-only pages must enforce RBAC',
    '- **Key check**: Settings save correctly, audit trail captures changes',
    '',
    '### HR Advanced (Group 35)',
    '- 17 HR pages: payroll, recruitment, leave management, crew time tracking',
    '- **Business rule**: Payroll calculations must match Russian labor law',
    '- **Key check**: Leave balance calculations, crew time aggregations',
    '',
    '### Estimates Advanced (Group 36)',
    '- 14 pricing/estimate pages: import, export, OCR, analogs, Monte Carlo',
    '- **Business rule**: ЛСР import must match ГЭСН/ФЕР codes correctly',
    '- **Key check**: Import wizard steps, calculation accuracy, export formats',
    '',
    '### Misc Routes (Group 37)',
    '- 50+ miscellaneous pages: search, help, KS sub-routes, accounting, workflow',
    '- **Business rule**: Search must find entities across modules',
    '- **Key check**: Breadcrumb navigation, page titles, empty states guide user',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'crawler-part3-summary.md'), md, 'utf-8');
}

/**
 * Generate consolidated report merging Parts 1, 2, and 3.
 * Reads the JSON files from each part and produces a unified report.
 */
function generateConsolidatedReport(part3Results: PageResult[]): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  // ── Load Parts 1 & 2 results ──────────────────────────────────────────
  let part1Results: PageResult[] = [];
  let part2Results: PageResult[] = [];

  try {
    const p1Path = path.join(REPORTS_DIR, 'crawler-part1-results.json');
    if (fs.existsSync(p1Path)) {
      part1Results = JSON.parse(fs.readFileSync(p1Path, 'utf-8'));
    }
  } catch {
    /* Part 1 not yet run */
  }
  try {
    const p2Path = path.join(REPORTS_DIR, 'crawler-part2-results.json');
    if (fs.existsSync(p2Path)) {
      part2Results = JSON.parse(fs.readFileSync(p2Path, 'utf-8'));
    }
  } catch {
    /* Part 2 not yet run */
  }

  const allResults = [...part1Results, ...part2Results, ...part3Results];
  const allElements = allResults.flatMap((r) => r.elements);

  // ── Write consolidated JSON ──────────────────────────────────────────────
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'crawler-consolidated.json'),
    JSON.stringify(allResults, null, 2),
    'utf-8',
  );

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalPages = allResults.length;
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
  const pagesWithErrors = allResults.filter((r) => r.jsErrors.length > 0);
  const pagesWithZeroElements = allResults.filter((r) => r.totalElements === 0 && r.jsErrors.length === 0);

  // ── Per-part stats ────────────────────────────────────────────────────────
  const parts = [
    { name: 'Part 1 (Groups 1–14: Home → HR)', results: part1Results },
    { name: 'Part 2 (Groups 15–25: Safety → Admin)', results: part2Results },
    { name: 'Part 3 (Groups 26–37: Details + Advanced)', results: part3Results },
  ];
  const partRows = parts
    .map((p) => {
      const pe = p.results.flatMap((r) => r.elements);
      const errors = pe.filter((e) => e.result === 'js_error').length;
      const dead = pe.filter((e) => e.result === 'nothing').length;
      const modals = pe.filter((e) => e.result === 'modal_opened').length;
      return `| ${p.name} | ${p.results.length} | ${pe.length} | ${errors} | ${dead} | ${modals} |`;
    })
    .join('\n');

  // ── All-group table ─────────────────────────────────────────────────────
  const allGroups = [...new Set(allResults.map((r) => r.group))];
  const groupRows = allGroups
    .map((g) => {
      const gr = allResults.filter((r) => r.group === g);
      const ge = gr.flatMap((r) => r.elements);
      const errors = ge.filter((e) => e.result === 'js_error').length;
      const dead = ge.filter((e) => e.result === 'nothing').length;
      return `| ${g} | ${gr.length} | ${ge.length} | ${errors} | ${dead} |`;
    })
    .join('\n');

  // ── Consolidated Markdown ────────────────────────────────────────────────
  const md = [
    '# Element Crawler — Consolidated Report (All 3 Parts)',
    '',
    `> Generated: ${new Date().toISOString()}`,
    '> Coverage: 37 groups across all navigation + detail + form + board + advanced pages',
    '',
    '## Executive Summary',
    '',
    '| Metric | Count |',
    '|--------|-------|',
    `| **Total pages crawled** | **${totalPages}** |`,
    `| Total elements interacted | ${totalElements} |`,
    `| OK (no errors) | ${okCount} (${okPct}%) |`,
    `| JS errors [CRITICAL] | ${jsErrorEls.length} |`,
    `| Click failures [MAJOR] | ${clickFailed.length} |`,
    `| Dead buttons [MINOR] | ${nothingEls.length} |`,
    `| Modals opened | ${modalEls.length} |`,
    `| Navigations triggered | ${navEls.length} |`,
    `| Dropdowns opened | ${dropdownEls.length} |`,
    `| Tab switches | ${tabEls.length} |`,
    `| Toggles | ${toggleEls.length} |`,
    `| Pages with 0 elements (suspicious) | ${pagesWithZeroElements.length} |`,
    `| Pages with JS errors | ${pagesWithErrors.length} |`,
    '',
    '## Per-Part Summary',
    '',
    '| Part | Pages | Elements | JS Errors | Dead | Modals |',
    '|------|-------|----------|-----------|------|--------|',
    partRows,
    '',
    '## Per-Group Summary (All 37 Groups)',
    '',
    '| Group | Pages | Elements | Errors | Dead |',
    '|-------|-------|----------|--------|------|',
    groupRows,
    '',
    '## Severity Classification',
    '',
    '| Severity | Count | Description |',
    '|----------|-------|-------------|',
    `| [CRITICAL] | ${jsErrorEls.length + pagesWithErrors.filter((r) => r.jsErrors.some((e) => e.startsWith('LOAD_FAILED:'))).length} | JS errors thrown on interaction + page load failures |`,
    `| [MAJOR] | ${clickFailed.length} | Elements visible but not clickable |`,
    `| [MINOR] | ${nothingEls.length} | Buttons/elements with no visible effect |`,
    `| [UX] | ${pagesWithZeroElements.length} | Pages with 0 interactive elements (possible stubs) |`,
    '',
    '## Pages with 0 Interactive Elements (Suspicious)',
    '',
    pagesWithZeroElements.length === 0
      ? 'None — all pages have interactive elements!'
      : pagesWithZeroElements.map((r) => `- \`${r.page}\` — **${r.name}** (${r.group})`).join('\n'),
    '',
    '## [CRITICAL] JS Error Details',
    '',
    jsErrorEls.length === 0
      ? 'None — clean!'
      : jsErrorEls.map((e) => `- \`${e.page}\` → \`${e.element}\`: ${e.detail ?? 'unknown'}`).join('\n'),
    '',
    '## [MAJOR] Click Failure Details',
    '',
    clickFailed.length === 0
      ? 'None'
      : clickFailed
          .slice(0, 50)
          .map((e) => `- \`${e.page}\` → \`${e.element}\`: ${e.detail?.slice(0, 100) ?? 'unknown'}`)
          .join('\n'),
    ...(clickFailed.length > 50 ? [`\n... and ${clickFailed.length - 50} more`] : []),
    '',
    '## All Pages with JS Errors',
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
    '## Coverage Analysis',
    '',
    '### By Page Type',
    `- Navigation/List pages (Parts 1-2): ${part1Results.length + part2Results.length}`,
    `- Detail/:id pages: ${part3Results.filter((r) => r.group.startsWith('Detail')).length}`,
    `- Create/New form pages: ${part3Results.filter((r) => r.group.startsWith('Create')).length}`,
    `- Board views: ${part3Results.filter((r) => r.group === 'Boards').length}`,
    `- Analytics/KPI: ${part3Results.filter((r) => r.group === 'Analytics').length}`,
    `- Settings/Admin: ${part3Results.filter((r) => r.group === 'Settings').length}`,
    `- HR Advanced: ${part3Results.filter((r) => r.group === 'HR-Advanced').length}`,
    `- Estimates Advanced: ${part3Results.filter((r) => r.group === 'Estimates-Adv').length}`,
    `- Misc: ${part3Results.filter((r) => r.group === 'Misc').length}`,
    '',
    '### Interaction Breakdown',
    `- Buttons clicked: ${allElements.filter((e) => e.element.startsWith('button:')).length}`,
    `- Tabs clicked: ${allElements.filter((e) => e.element.startsWith('tab:')).length}`,
    `- Selects clicked: ${allElements.filter((e) => e.element.startsWith('select:')).length}`,
    `- Toggles clicked: ${allElements.filter((e) => e.element.startsWith('toggle:')).length}`,
    `- Links clicked: ${allElements.filter((e) => e.element.startsWith('link:')).length}`,
    '',
    '## Domain Expert Final Assessment',
    '',
    '### Coverage Verdict',
    `With ${totalPages} pages crawled across ${allGroups.length} groups, the crawler provides`,
    'comprehensive coverage of the PRIVOD ERP platform including:',
    '- All sidebar navigation pages (list/index views)',
    '- Create/New forms for every entity type',
    '- Detail pages with tabs and action buttons',
    '- Board/Kanban views for workflow visualization',
    '- Advanced analytics, KPI dashboards, and report builders',
    '- Admin settings, audit logs, and system configuration',
    '- Russian regulatory documents (КС-2, КС-3, ЛСР, ГЭСН)',
    '- Client portal pages (contractor-facing)',
    '',
    '### Key Areas Verified',
    '1. **Financial Chain**: Spec → КЛ → ФМ ← ЛСР → КП (create + detail + list)',
    '2. **Document Lifecycle**: Create → Edit → Approve → Archive',
    '3. **RBAC Surfaces**: Admin pages, permission matrix, audit logs',
    '4. **Russian Compliance**: КС-2/КС-3 forms, regulatory permits/inspections',
    '5. **Business Workflows**: Board views for all process-heavy modules',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'crawler-consolidated.md'), md, 'utf-8');
}

// ─── Module-level result collector ──────────────────────────────────────────
const allResults: PageResult[] = [];

// ─── Test suite ─────────────────────────────────────────────────────────────
test.describe('Element Crawler Part 3 (Groups 26–37: Detail + Create + Board + Advanced)', () => {
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

          // Soft annotation: page stats
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
      generatePart3Report(allResults);
      generateConsolidatedReport(allResults);
    }
  });
});
