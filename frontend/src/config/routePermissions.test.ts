import { describe, it, expect } from 'vitest';
import { getRequiredRoles, routePermissions } from './routePermissions';

describe('routePermissions', () => {
  it('defines permissions for admin routes', () => {
    expect(routePermissions['settings']).toContain('ADMIN');
    expect(routePermissions['admin']).toContain('ADMIN');
    expect(routePermissions['api-management']).toContain('ADMIN');
    expect(routePermissions['marketplace']).toContain('ADMIN');
    expect(routePermissions['integrations']).toContain('ADMIN');
  });

  it('defines permissions for finance routes', () => {
    expect(routePermissions['accounting']).toContain('ACCOUNTANT');
    expect(routePermissions['invoices']).toContain('FINANCE_MANAGER');
    expect(routePermissions['payments']).toContain('ADMIN');
    expect(routePermissions['cash-flow']).toContain('COST_MANAGER');
    expect(routePermissions['bank-export']).toContain('ACCOUNTANT');
  });

  it('defines permissions for engineer routes', () => {
    expect(routePermissions['planning']).toContain('ENGINEER');
    expect(routePermissions['quality']).toContain('QUALITY_MANAGER');
    expect(routePermissions['safety']).toContain('ADMIN');
    expect(routePermissions['safety']).toContain('SAFETY_MANAGER');
  });

  it('defines permissions for HR routes', () => {
    expect(routePermissions['employees']).toContain('HR_MANAGER');
    expect(routePermissions['hr']).toContain('ADMIN');
    expect(routePermissions['leave']).toContain('HR_MANAGER');
  });

  it('defines permissions for procurement routes', () => {
    expect(routePermissions['procurement']).toContain('PROCUREMENT_MANAGER');
    expect(routePermissions['warehouse']).toContain('WAREHOUSE_MANAGER');
  });
});

describe('getRequiredRoles', () => {
  it('returns roles for exact path match', () => {
    const roles = getRequiredRoles('settings');
    expect(roles).toBeDefined();
    expect(roles).toContain('ADMIN');
  });

  it('returns roles for prefixed path', () => {
    const roles = getRequiredRoles('settings/users');
    expect(roles).toBeDefined();
    expect(roles).toContain('ADMIN');
  });

  it('handles leading slash', () => {
    const roles = getRequiredRoles('/settings');
    expect(roles).toBeDefined();
    expect(roles).toContain('ADMIN');
  });

  it('returns undefined for unprotected routes', () => {
    const roles = getRequiredRoles('projects');
    expect(roles).toBeUndefined();
  });

  it('returns undefined for root path', () => {
    const roles = getRequiredRoles('/');
    expect(roles).toBeUndefined();
  });

  it('returns undefined for dashboard', () => {
    const roles = getRequiredRoles('dashboard');
    expect(roles).toBeUndefined();
  });

  it('returns finance roles for accounting sub-paths', () => {
    const roles = getRequiredRoles('accounting/journal');
    expect(roles).toBeDefined();
    expect(roles).toContain('ACCOUNTANT');
    expect(roles).toContain('ADMIN');
  });

  it('returns manager roles for budget routes', () => {
    const roles = getRequiredRoles('budgets');
    expect(roles).toBeDefined();
    expect(roles).toContain('MANAGER');
    expect(roles).toContain('ADMIN');
    expect(roles).not.toContain('VIEWER');
  });

  it('returns engineer roles for planning sub-paths', () => {
    const roles = getRequiredRoles('planning/gantt');
    expect(roles).toBeDefined();
    expect(roles).toContain('ENGINEER');
  });

  it('does not match partial prefix (settings vs set)', () => {
    // "set" should NOT match "settings"
    const roles = getRequiredRoles('set');
    expect(roles).toBeUndefined();
  });

  it('returns safety roles for safety sub-paths', () => {
    const roles = getRequiredRoles('safety/incidents');
    expect(roles).toBeDefined();
    expect(roles).toContain('SAFETY_MANAGER');
    expect(roles).toContain('SAFETY_OFFICER');
  });

  it('returns HR roles for employee routes', () => {
    const roles = getRequiredRoles('employees');
    expect(roles).toBeDefined();
    expect(roles).toContain('HR_MANAGER');
  });

  it('returns procurement roles for warehouse sub-paths', () => {
    const roles = getRequiredRoles('warehouse/stock');
    expect(roles).toBeDefined();
    expect(roles).toContain('WAREHOUSE_MANAGER');
  });
});
