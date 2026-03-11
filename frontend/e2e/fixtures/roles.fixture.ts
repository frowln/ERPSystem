/* eslint-disable react-hooks/rules-of-hooks */
/**
 * Roles fixture — multi-role testing infrastructure.
 *
 * Extends the base Playwright test fixture with:
 * - withRole(): run a test function as a specific role
 * - createRoleMatrix(): parametrized test across 5 roles
 * - Pre-authenticates all 5 roles, storing sessions in .auth/{role}.json
 *
 * Usage:
 *   import { test, expect } from '../fixtures/roles.fixture';
 *
 *   test('admin can create project', async ({ withRole }) => {
 *     await withRole('admin', async (page) => {
 *       await page.goto('/projects/new');
 *       await expect(page.getByRole('heading')).toBeVisible();
 *     });
 *   });
 */

import { test as base, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { type Role, loginAs, getAuthFilePath } from './auth.fixture';
import { authenticatedRequest } from './api.fixture';
import fs from 'fs';

// ── Types ──────────────────────────────────────────────────────────────────

type WithRoleFn = (
  role: Role,
  testFn: (page: Page, context: BrowserContext) => Promise<void>,
) => Promise<void>;

interface RoleFixtures {
  /** Run a test function as a specific role */
  withRole: WithRoleFn;
  /** Current browser instance for role switching */
  roleBrowser: Browser;
}

export type RoleExpectation = {
  role: Role;
  allowed: boolean;
};

export type OperationExpectations = {
  operation: string;
  route?: string;
  expectations: RoleExpectation[];
};

// ── All 5 test roles ───────────────────────────────────────────────────────

export const ALL_ROLES: Role[] = ['admin', 'manager', 'engineer', 'accountant', 'viewer'];

// ── Extended test fixture ──────────────────────────────────────────────────

export const test = base.extend<RoleFixtures>({
  roleBrowser: async ({ browser }, use) => {
    await use(browser);
  },

  withRole: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    const withRole: WithRoleFn = async (role, testFn) => {
      const { context, page } = await loginAs(browser, role);
      contexts.push(context);
      try {
        await testFn(page, context);
      } finally {
        await page.close();
        await context.close();
      }
    };

    await use(withRole);

    // Cleanup any remaining contexts
    for (const ctx of contexts) {
      try {
        await ctx.close();
      } catch {
        // Already closed
      }
    }
  },
});

export { expect };

// ── Pre-authenticate all roles (for global setup) ─────────────────────────

/**
 * Pre-authenticate all 5 roles and store sessions.
 * Call this in your global setup or auth.setup.ts.
 */
export async function preAuthenticateAllRoles(browser: Browser): Promise<void> {
  for (const role of ALL_ROLES) {
    const authFile = getAuthFilePath(role);

    // Skip if fresh auth exists (< 30 min old)
    if (fs.existsSync(authFile)) {
      const stats = fs.statSync(authFile);
      const ageMinutes = (Date.now() - stats.mtimeMs) / 60_000;
      if (ageMinutes < 30) continue;
    }

    try {
      const { context, page } = await loginAs(browser, role);
      await page.close();
      await context.close();
    } catch (err) {
      console.warn(`[roles] Failed to pre-authenticate ${role}:`, err);
    }
  }
}

// ── Role matrix test generator ─────────────────────────────────────────────

/**
 * Create a parametrized test matrix across 5 roles.
 *
 * Example:
 *   createRoleMatrix(
 *     'view projects page',
 *     [
 *       { role: 'admin', allowed: true },
 *       { role: 'manager', allowed: true },
 *       { role: 'engineer', allowed: true },
 *       { role: 'accountant', allowed: false },
 *       { role: 'viewer', allowed: true },
 *     ],
 *     async (page, role, allowed) => {
 *       await page.goto('/projects');
 *       if (allowed) {
 *         await expect(page.getByText('Проекты')).toBeVisible();
 *       } else {
 *         // Should see 403 or redirect
 *         await expect(page).not.toHaveURL(/\/projects/);
 *       }
 *     },
 *   );
 */
export function createRoleMatrix(
  testName: string,
  expectations: RoleExpectation[],
  testFn: (page: Page, role: Role, allowed: boolean) => Promise<void>,
): void {
  for (const { role, allowed } of expectations) {
    const desc = `[${role}] ${allowed ? '✓' : '✗'} ${testName}`;
    test(desc, async ({ withRole }) => {
      await withRole(role, async (page) => {
        await testFn(page, role, allowed);
      });
    });
  }
}

/**
 * Shorthand: generate expectations from the rbac-matrix for a given route.
 *
 * Usage with rbac-matrix:
 *   import { getRoutePermission } from '../data/rbac-matrix';
 *   const perm = getRoutePermission('budgets');
 *   if (perm) {
 *     createRoleMatrixFromPermission('access budgets', perm.canView, async (page, role, allowed) => { ... });
 *   }
 */
export function createRoleMatrixFromPermission(
  testName: string,
  permissionMap: Record<Role, boolean>,
  testFn: (page: Page, role: Role, allowed: boolean) => Promise<void>,
): void {
  const expectations: RoleExpectation[] = ALL_ROLES.map((role) => ({
    role,
    allowed: permissionMap[role],
  }));
  createRoleMatrix(testName, expectations, testFn);
}

// ── API-level role testing helpers ─────────────────────────────────────────

/**
 * Test that an API endpoint returns the expected status for each role.
 * Useful for testing backend RBAC without UI overhead.
 */
export async function testApiRoleAccess(
  method: string,
  endpoint: string,
  expectedAccess: Record<Role, boolean>,
  data?: Record<string, unknown>,
): Promise<Record<Role, { status: number; allowed: boolean; expected: boolean; pass: boolean }>> {
  const results: Record<string, { status: number; allowed: boolean; expected: boolean; pass: boolean }> = {};

  for (const role of ALL_ROLES) {
    const res = await authenticatedRequest(role, method, endpoint, data);
    const allowed = res.status !== 403 && res.status !== 401;
    const expected = expectedAccess[role];
    results[role] = {
      status: res.status,
      allowed,
      expected,
      pass: allowed === expected,
    };
  }

  return results as Record<Role, { status: number; allowed: boolean; expected: boolean; pass: boolean }>;
}
