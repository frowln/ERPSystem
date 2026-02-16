import type { UserRole } from '@/types';

/**
 * Route permission configuration.
 * Maps route path prefixes to the roles that can access them.
 * Routes not listed here are accessible to all authenticated users.
 */

// Role groups for convenience
const ADMIN_ONLY: UserRole[] = ['ADMIN'];
const MANAGER_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER'];
const ENGINEER_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER'];
const FINANCE_PLUS: UserRole[] = ['ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ACCOUNTANT', 'FINANCE_MANAGER', 'FINANCIAL_CONTROLLER'];

export const routePermissions: Record<string, UserRole[]> = {
  // Admin-only routes
  'settings': ADMIN_ONLY,
  'admin': ADMIN_ONLY,
  'api-management': ADMIN_ONLY,

  // Manager+ routes
  'budgets': MANAGER_PLUS,
  'budgets/new': MANAGER_PLUS,
  'revenue': MANAGER_PLUS,
  'portfolio': MANAGER_PLUS,
  'monte-carlo': MANAGER_PLUS,
  'tax-risk': MANAGER_PLUS,

  // Finance routes
  'accounting': FINANCE_PLUS,
  'invoices': FINANCE_PLUS,
  'payments': FINANCE_PLUS,
  'cash-flow': FINANCE_PLUS,
  'payroll': FINANCE_PLUS,
  'cost-management': FINANCE_PLUS,

  // Engineer+ routes (most operational routes)
  'planning': ENGINEER_PLUS,
  'estimates': ENGINEER_PLUS,
  'specifications': ENGINEER_PLUS,
  'quality': ENGINEER_PLUS,
  'safety': ENGINEER_PLUS,
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
