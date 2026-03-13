/**
 * Complete list of ALL navigation URLs from navigation.ts (244 items).
 * Used for exhaustive dark mode / visual consistency / a11y auditing.
 */

// ── Home ──
const HOME_URLS = ['/', '/analytics', '/reports'];

// ── Tasks ──
const TASK_URLS = ['/tasks'];

// ── Calendar ──
const CALENDAR_URLS = ['/calendar'];

// ── Planning ──
const PLANNING_URLS = [
  '/planning/gantt',
  '/planning/evm',
  '/planning/resource-planning',
  '/planning/work-volumes',
];

// ── Processes ──
const PROCESS_URLS = [
  '/pm/rfis',
  '/pm/submittals',
  '/pm/issues',
  '/workflow/templates',
  '/workflow/approval-inbox',
  '/change-management/dashboard',
];

// ── Projects ──
const PROJECT_URLS = ['/projects', '/site-assessments', '/portfolio/health'];

// ── CRM ──
const CRM_URLS = [
  '/crm/leads',
  '/crm/dashboard',
  '/counterparties',
  '/portfolio/opportunities',
  '/portfolio/tenders',
  '/bid-packages',
];

// ── Documents ──
const DOCUMENT_URLS = [
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
];

// ── Design (PIR) ──
const DESIGN_URLS = [
  '/design/versions',
  '/design/reviews',
  '/design/reviews/board',
  '/design/sections',
];

// ── Exec Docs ──
const EXEC_DOC_URLS = [
  '/exec-docs/aosr',
  '/exec-docs/ks6',
  '/exec-docs/incoming-control',
  '/exec-docs/welding',
  '/exec-docs/special-journals',
];

// ── Finance ──
const FINANCE_URLS = [
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
];

// ── Pricing ──
const PRICING_URLS = [
  '/specifications',
  '/specifications/competitive-registry',
  '/estimates',
  '/estimates/minstroy',
  '/estimates/pivot',
  '/estimates/volume-calculator',
  '/estimates/pricing/databases',
  '/price-coefficients',
];

// ── Supply & Warehouse ──
const SUPPLY_URLS = [
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
];

// ── HR ──
const HR_URLS = [
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
];

// ── Safety ──
const SAFETY_URLS = [
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
];

// ── Quality & Regulatory ──
const QUALITY_URLS = [
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
];

// ── Fleet & IoT ──
const FLEET_URLS = [
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

// ── Site & BIM ──
const SITE_URLS = [
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
];

// ── Closeout ──
const CLOSEOUT_URLS = [
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
];

// ── Maintenance ──
const MAINTENANCE_URLS = [
  '/maintenance/dashboard',
  '/maintenance/requests',
  '/maintenance/equipment',
];

// ── Legal ──
const LEGAL_URLS = ['/legal/cases', '/legal/templates', '/insurance-certificates'];

// ── Portal ──
const PORTAL_URLS = [
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
];

// ── Messenger ──
const MESSENGER_URLS = ['/messaging'];

// ── Mail ──
const MAIL_URLS = ['/mail'];

// ── Admin ──
const ADMIN_URLS = [
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

/** All 244 navigation URLs grouped by module */
export const URL_GROUPS = {
  home: HOME_URLS,
  tasks: TASK_URLS,
  calendar: CALENDAR_URLS,
  planning: PLANNING_URLS,
  processes: PROCESS_URLS,
  projects: PROJECT_URLS,
  crm: CRM_URLS,
  documents: DOCUMENT_URLS,
  design: DESIGN_URLS,
  execDocs: EXEC_DOC_URLS,
  finance: FINANCE_URLS,
  pricing: PRICING_URLS,
  supply: SUPPLY_URLS,
  hr: HR_URLS,
  safety: SAFETY_URLS,
  quality: QUALITY_URLS,
  fleet: FLEET_URLS,
  site: SITE_URLS,
  closeout: CLOSEOUT_URLS,
  maintenance: MAINTENANCE_URLS,
  legal: LEGAL_URLS,
  portal: PORTAL_URLS,
  messenger: MESSENGER_URLS,
  mail: MAIL_URLS,
  admin: ADMIN_URLS,
} as const;

/** Flat array of all URLs */
export const ALL_URLS: string[] = Object.values(URL_GROUPS).flat();

/** Top 30 critical pages for responsive / a11y deep testing */
export const TOP_30_PAGES: string[] = [
  '/',
  '/projects',
  '/tasks',
  '/invoices',
  '/specifications',
  '/employees',
  '/timesheets',
  '/safety/incidents',
  '/warehouse/materials',
  '/planning/gantt',
  '/cash-flow',
  '/crm/leads',
  '/defects',
  '/portal',
  '/messaging',
  '/mail',
  '/analytics',
  '/financial-models',
  '/estimates',
  '/commercial-proposals',
  '/calendar',
  '/fleet',
  '/admin/users',
  '/quality/checklists',
  '/procurement',
  '/closeout/dashboard',
  '/support/dashboard',
  '/portfolio/health',
  '/contracts',
  '/budgets',
];

/** Viewport configurations for responsive testing */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'mobile' as const },
  tablet: { width: 768, height: 1024, name: 'tablet' as const },
  desktop: { width: 1440, height: 900, name: 'desktop' as const },
} as const;
