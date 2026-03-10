import type { UserRole } from '@/types';

/**
 * Route permission configuration.
 * Maps route path prefixes to the roles that can access them.
 * Routes not listed here are accessible to all authenticated users.
 */

// Role groups for convenience
const ADMIN_ONLY: UserRole[] = ['ADMIN'];
const MANAGER_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER'];
const ENGINEER_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER', 'FOREMAN'];
const FINANCE_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ACCOUNTANT', 'FINANCE_MANAGER', 'FINANCIAL_CONTROLLER', 'COST_MANAGER'];
const SAFETY_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER', 'SAFETY_MANAGER', 'SAFETY_OFFICER'];
const HR_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'HR_MANAGER'];
const PROCUREMENT_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER', 'SUPPLY_MANAGER', 'PROCUREMENT_MANAGER', 'WAREHOUSE_MANAGER'];
const QUALITY_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER', 'QUALITY_MANAGER', 'QUALITY_INSPECTOR'];

export const routePermissions: Record<string, UserRole[]> = {
  // ── Admin-only routes ──────────────────────────────────────────────────
  'settings': ADMIN_ONLY,
  'admin': ADMIN_ONLY,
  'api-management': ADMIN_ONLY,
  'marketplace': ADMIN_ONLY,
  'integrations': ADMIN_ONLY,

  // ── Manager+ routes ────────────────────────────────────────────────────
  'budgets': MANAGER_PLUS,
  'budgets/new': MANAGER_PLUS,
  'revenue': MANAGER_PLUS,
  'portfolio': MANAGER_PLUS,
  'monte-carlo': MANAGER_PLUS,
  'tax-risk': MANAGER_PLUS,
  'financial-models': MANAGER_PLUS,

  // ── Finance routes ─────────────────────────────────────────────────────
  'accounting': FINANCE_PLUS,
  'invoices': FINANCE_PLUS,
  'payments': FINANCE_PLUS,
  'cash-flow': FINANCE_PLUS,
  'payroll': FINANCE_PLUS,
  'cost-management': FINANCE_PLUS,
  'bank-statement-matching': FINANCE_PLUS,
  'bank-export': FINANCE_PLUS,
  'treasury-calendar': FINANCE_PLUS,
  'tax-calendar': FINANCE_PLUS,
  'factoring-calculator': FINANCE_PLUS,
  'bdds': FINANCE_PLUS,
  'finance/expenses': FINANCE_PLUS,
  'finance/s-curve-cashflow': FINANCE_PLUS,
  'execution-chain': FINANCE_PLUS,
  'price-coefficients': FINANCE_PLUS,

  // ── HR routes ──────────────────────────────────────────────────────────
  'employees': HR_PLUS,
  'timesheets': HR_PLUS,
  'hr': HR_PLUS,
  'leave': HR_PLUS,
  'recruitment': HR_PLUS,
  'crew': HR_PLUS,
  'hr-russian': HR_PLUS,
  'self-employed': HR_PLUS,

  // ── Safety routes ──────────────────────────────────────────────────────
  'safety': SAFETY_PLUS,

  // ── Procurement & Warehouse routes ─────────────────────────────────────
  'procurement': PROCUREMENT_PLUS,
  'warehouse': PROCUREMENT_PLUS,
  'dispatch': PROCUREMENT_PLUS,

  // ── Quality & Regulatory routes ────────────────────────────────────────
  'quality': QUALITY_PLUS,
  'defects': QUALITY_PLUS,
  'punchlist': QUALITY_PLUS,
  'regulatory': QUALITY_PLUS,

  // ── Engineer+ routes (operational) ─────────────────────────────────────
  'planning': ENGINEER_PLUS,
  'estimates': ENGINEER_PLUS,
  'specifications': ENGINEER_PLUS,
  'documents/smart-recognition': ENGINEER_PLUS,
  'operations': ENGINEER_PLUS,
  'bim': ENGINEER_PLUS,

  // ── Fleet routes ───────────────────────────────────────────────────────
  'fleet': [...ENGINEER_PLUS, 'FLEET_MANAGER', 'LOGISTICS_MANAGER'],
  'iot': [...ENGINEER_PLUS, 'FLEET_MANAGER'],
};

/**
 * Check if a given path requires specific roles.
 * Returns the required roles, or undefined if accessible to all authenticated users.
 */
export function getRequiredRoles(path: string): UserRole[] | undefined {
  // Remove leading slash
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  // Check exact match first, then prefix match
  for (const [routePrefix, roles] of Object.entries(routePermissions)) {
    if (normalizedPath === routePrefix || normalizedPath.startsWith(routePrefix + '/')) {
      return roles;
    }
  }

  return undefined;
}
