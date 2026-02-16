// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { apiClient } from './client';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

// Mock react-hot-toast
const mockToastError = vi.fn();
vi.mock('react-hot-toast', () => ({
  default: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  },
}));

const mockUser: User = {
  id: '1',
  email: 'test@privod.ru',
  firstName: 'Тест',
  lastName: 'Тестов',
  role: 'ADMIN',
  roles: ['ADMIN'],
  createdAt: '2026-01-01T00:00:00Z',
};

const validToken = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ sub: '1', exp: 9999999999 }))}.signature`;

describe('apiClient', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    mockToastError.mockReset();
  });

  it('is configured with /api baseURL', () => {
    expect(apiClient.defaults.baseURL).toBe('/api');
  });

  it('has Content-Type application/json header', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('has 30 second timeout', () => {
    expect(apiClient.defaults.timeout).toBe(30000);
  });

  describe('auth store integration', () => {
    it('reads token from authStore', () => {
      useAuthStore.getState().setAuth(mockUser, validToken);
      expect(useAuthStore.getState().token).toBe(validToken);
    });

    it('logout clears auth state', () => {
      useAuthStore.getState().setAuth(mockUser, validToken);
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('interceptor configuration', () => {
    it('has request interceptors registered', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((apiClient.interceptors.request as any).handlers.length).toBeGreaterThan(0);
    });

    it('has response interceptors registered', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((apiClient.interceptors.response as any).handlers.length).toBeGreaterThan(0);
    });
  });
});
