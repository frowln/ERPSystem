// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '@/types';

const mockUser: User = {
  id: '1',
  email: 'test@privod.ru',
  firstName: 'Тест',
  lastName: 'Тестов',
  role: 'ADMIN',
  roles: ['ADMIN'],
  createdAt: '2026-01-01T00:00:00Z',
};

// JWT with exp = 9999999999 (far future)
const validToken = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub: '1', exp: 9999999999 }))}.signature`;
// JWT with exp = 1 (expired — Jan 1 1970)
const expiredToken = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub: '1', exp: 1 }))}.signature`;

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('setAuth sets user, token, and isAuthenticated', () => {
    useAuthStore.getState().setAuth(mockUser, validToken, 'refresh-123');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(validToken);
    expect(state.refreshToken).toBe('refresh-123');
  });

  it('logout clears all auth state', () => {
    useAuthStore.getState().setAuth(mockUser, validToken);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('setUser updates only user', () => {
    useAuthStore.getState().setAuth(mockUser, validToken);
    const updatedUser = { ...mockUser, firstName: 'Обновлён' };
    useAuthStore.getState().setUser(updatedUser);
    expect(useAuthStore.getState().user?.firstName).toBe('Обновлён');
    expect(useAuthStore.getState().token).toBe(validToken);
  });

  it('setToken updates only token', () => {
    useAuthStore.getState().setAuth(mockUser, validToken);
    useAuthStore.getState().setToken('new-token');
    expect(useAuthStore.getState().token).toBe('new-token');
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('validateToken returns true for valid token', () => {
    useAuthStore.getState().setAuth(mockUser, validToken);
    expect(useAuthStore.getState().validateToken()).toBe(true);
  });

  it('validateToken returns false and logs out for expired token', () => {
    useAuthStore.getState().setAuth(mockUser, expiredToken);
    expect(useAuthStore.getState().validateToken()).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('validateToken returns false when no token', () => {
    expect(useAuthStore.getState().validateToken()).toBe(false);
  });

  it('setRedirectAfterLogin stores and clears redirect URL', () => {
    useAuthStore.getState().setRedirectAfterLogin('/projects/123');
    expect(useAuthStore.getState().redirectAfterLogin).toBe('/projects/123');
    useAuthStore.getState().setRedirectAfterLogin(null);
    expect(useAuthStore.getState().redirectAfterLogin).toBeNull();
  });
});
