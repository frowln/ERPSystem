// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { useAuthStore } from '@/stores/authStore';

function setAuth(opts: { role?: string; roles?: string[] }) {
  useAuthStore.setState({
    isAuthenticated: true,
    user: {
      id: '1',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: opts.role ?? 'VIEWER',
      roles: opts.roles ?? [opts.role ?? 'VIEWER'],
      createdAt: '2026-01-01T00:00:00Z',
    } as ReturnType<typeof useAuthStore.getState>['user'],
    token: 'mock-token',
    refreshToken: null,
    redirectAfterLogin: null,
  });
}

function clearAuth() {
  useAuthStore.setState({
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    redirectAfterLogin: null,
  });
}

describe('usePermissions', () => {
  beforeEach(() => clearAuth());

  it('returns false for canAccess when no user is logged in', () => {
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canAccess('/settings')).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.primaryRole).toBe('VIEWER');
  });

  it('ADMIN can access everything', () => {
    setAuth({ role: 'ADMIN', roles: ['ADMIN'] });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canAccess('/settings')).toBe(true);
    expect(result.current.canAccess('/admin/users')).toBe(true);
    expect(result.current.canAccess('/budgets')).toBe(true);
    expect(result.current.canAccess('/safety')).toBe(true);
    expect(result.current.canAccess('/projects')).toBe(true);
  });

  it('VIEWER cannot access admin routes', () => {
    setAuth({ role: 'VIEWER', roles: ['VIEWER'] });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.canAccess('/settings')).toBe(false);
    expect(result.current.canAccess('/admin/users')).toBe(false);
  });

  it('VIEWER can access unprotected routes', () => {
    setAuth({ role: 'VIEWER', roles: ['VIEWER'] });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccess('/projects')).toBe(true);
    expect(result.current.canAccess('/')).toBe(true);
    expect(result.current.canAccess('/messaging')).toBe(true);
  });

  it('ACCOUNTANT can access finance routes', () => {
    setAuth({ role: 'ACCOUNTANT', roles: ['ACCOUNTANT'] });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccess('/invoices')).toBe(true);
    expect(result.current.canAccess('/payments')).toBe(true);
    expect(result.current.canAccess('/accounting')).toBe(true);
  });

  it('ACCOUNTANT cannot access admin routes', () => {
    setAuth({ role: 'ACCOUNTANT', roles: ['ACCOUNTANT'] });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccess('/admin/users')).toBe(false);
    expect(result.current.canAccess('/settings')).toBe(false);
  });

  it('ENGINEER can access operational routes', () => {
    setAuth({ role: 'ENGINEER', roles: ['ENGINEER'] });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccess('/planning/gantt')).toBe(true);
    expect(result.current.canAccess('/estimates')).toBe(true);
    expect(result.current.canAccess('/specifications')).toBe(true);
  });

  it('ENGINEER cannot access HR routes', () => {
    setAuth({ role: 'ENGINEER', roles: ['ENGINEER'] });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccess('/employees')).toBe(false);
    expect(result.current.canAccess('/hr/timesheet-t13')).toBe(false);
  });

  it('MANAGER can access manager-level routes', () => {
    setAuth({ role: 'MANAGER', roles: ['MANAGER'] });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccess('/budgets')).toBe(true);
    expect(result.current.canAccess('/portfolio')).toBe(true);
    expect(result.current.canAccess('/employees')).toBe(true);
  });

  it('MANAGER cannot access admin-only routes', () => {
    setAuth({ role: 'MANAGER', roles: ['MANAGER'] });
    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccess('/admin/users')).toBe(false);
    expect(result.current.canAccess('/settings')).toBe(false);
  });

  it('merges role + roles array', () => {
    setAuth({ role: 'VIEWER', roles: ['VIEWER', 'SAFETY_MANAGER'] });
    const { result } = renderHook(() => usePermissions());

    // SAFETY_MANAGER grants safety access
    expect(result.current.canAccess('/safety')).toBe(true);
    // But still no admin access
    expect(result.current.canAccess('/admin')).toBe(false);
  });

  it('primaryRole returns the singular role', () => {
    setAuth({ role: 'PROJECT_MANAGER', roles: ['PROJECT_MANAGER'] });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.primaryRole).toBe('PROJECT_MANAGER');
  });
});
