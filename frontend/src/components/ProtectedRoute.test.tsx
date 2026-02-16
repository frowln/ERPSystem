// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';

// Mock react-router-dom Navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

function setAuth(opts: {
  isAuthenticated: boolean;
  role?: string;
  roles?: string[];
}) {
  useAuthStore.setState({
    isAuthenticated: opts.isAuthenticated,
    user: opts.isAuthenticated
      ? ({
          id: '1',
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          role: opts.role ?? 'VIEWER',
          roles: opts.roles ?? [opts.role ?? 'VIEWER'],
          createdAt: '2026-01-01T00:00:00Z',
        } as unknown as ReturnType<typeof useAuthStore.getState>['user'])
      : null,
    token: opts.isAuthenticated ? 'mock-token' : null,
    refreshToken: null,
    redirectAfterLogin: null,
  });
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      redirectAfterLogin: null,
    });
  });

  it('redirects to login when not authenticated', () => {
    setAuth({ isAuthenticated: false });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="content">Secret</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('navigate').getAttribute('data-to')).toBe('/login');
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('renders children when authenticated without role requirements', () => {
    setAuth({ isAuthenticated: true, role: 'VIEWER' });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="content">Visible</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('content')).toBeDefined();
    expect(screen.queryByTestId('navigate')).toBeNull();
  });

  it('renders children when user has the required role', () => {
    setAuth({ isAuthenticated: true, role: 'ADMIN', roles: ['ADMIN'] });

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRoles={['ADMIN'] as never[]}>
          <div data-testid="content">Admin Panel</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('content')).toBeDefined();
  });

  it('shows forbidden fallback when user lacks required role', () => {
    setAuth({ isAuthenticated: true, role: 'VIEWER', roles: ['VIEWER'] });

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRoles={['ADMIN'] as never[]}>
          <div data-testid="content">Admin Only</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    // Should NOT show content
    expect(screen.queryByTestId('content')).toBeNull();
    // Should NOT redirect to login
    expect(screen.queryByTestId('navigate')).toBeNull();
  });

  it('allows when user has one of multiple required roles', () => {
    setAuth({ isAuthenticated: true, role: 'MANAGER', roles: ['MANAGER'] });

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRoles={['ADMIN', 'MANAGER'] as never[]}>
          <div data-testid="content">Manager Area</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('content')).toBeDefined();
  });

  it('checks roles array for role match', () => {
    setAuth({ isAuthenticated: true, role: 'VIEWER', roles: ['VIEWER', 'ENGINEER'] });

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRoles={['ENGINEER'] as never[]}>
          <div data-testid="content">Engineer Area</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('content')).toBeDefined();
  });

  it('renders children when requiredRoles is empty', () => {
    setAuth({ isAuthenticated: true, role: 'VIEWER' });

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRoles={[]}>
          <div data-testid="content">Open</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('content')).toBeDefined();
  });
});
