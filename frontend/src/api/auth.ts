import { apiClient } from './client';
import type { AuthResponse, LoginRequest, User, UserRole } from '@/types';

// Priority order for deriving the primary role from roles array
const ROLE_PRIORITY: UserRole[] = [
  'ADMIN',
  'PROJECT_MANAGER',
  'MANAGER',
  'FINANCE_MANAGER',
  'FINANCIAL_CONTROLLER',
  'ACCOUNTANT',
  'ENGINEER',
  'FOREMAN',
  'SUPPLY_MANAGER',
  'PROCUREMENT_MANAGER',
  'WAREHOUSE_MANAGER',
  'ESTIMATOR',
  'COST_MANAGER',
  'QUALITY_MANAGER',
  'QUALITY_INSPECTOR',
  'SAFETY_MANAGER',
  'SAFETY_OFFICER',
  'HR_MANAGER',
  'DOCUMENT_MANAGER',
  'DOCUMENT_CONTROLLER',
  'VIEWER',
];

/** Map backend user (roles: string[]) to frontend User (role: UserRole + roles) */
function normalizeUser(raw: Record<string, unknown>): User {
  const roles = Array.isArray(raw.roles) ? (raw.roles as string[]) : [];
  const role = ROLE_PRIORITY.find((r) => roles.includes(r))
    ?? ((roles[0] as UserRole | undefined) ?? 'VIEWER');
  return { ...(raw as unknown as User), roles, role };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }>('/auth/login', data);
    return {
      token: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: normalizeUser(response.data.user),
    };
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }>('/auth/register', data);
    return {
      token: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: normalizeUser(response.data.user),
    };
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>('/auth/refresh');
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<Record<string, unknown>>('/auth/me');
    return normalizeUser(response.data);
  },
};
