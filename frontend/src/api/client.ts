import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import {
  DEMO_MODE_BLOCKED_ERROR_CODE,
  getDemoModeBlockedMessage,
  isDemoMode,
  notifyDemoModeBlockedAction,
} from '@/lib/demoMode';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';

const WRITE_HTTP_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const DEMO_MODE_WRITE_ALLOWLIST_PREFIXES = ['/auth/'];

const isDemoModeWriteAllowed = (url?: string): boolean => {
  if (!url) return false;
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return DEMO_MODE_WRITE_ALLOWLIST_PREFIXES.some((prefix) => normalizedUrl.startsWith(prefix));
};

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = (config.method ?? 'get').toLowerCase();
    if (isDemoMode && WRITE_HTTP_METHODS.has(method) && !isDemoModeWriteAllowed(config.url)) {
      return Promise.reject(
        new AxiosError(getDemoModeBlockedMessage(), DEMO_MODE_BLOCKED_ERROR_CODE, config),
      );
    }

    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor: extract data from ApiResponse wrapper and handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps all responses in ApiResponse<T> with { success, data, ... }
    // Extract data if response has ApiResponse structure
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'success' in response.data) {
      if (response.data.success) {
        // Replace response.data with the actual data
        response.data = response.data.data;
      } else {
        // Handle error response
        const errorData = response.data as { success: false; error: { code: number; message: string } };
        throw new Error(errorData.error?.message || t('errors.unexpectedError'));
      }
    }
    return response;
  },
  (error: AxiosError<{ message?: string; error?: { code?: number; message?: string } }>) => {
    if (error.code === DEMO_MODE_BLOCKED_ERROR_CODE) {
      notifyDemoModeBlockedAction();
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const errorData = error.response?.data as { message?: string; error?: { code?: number; message?: string } };
    const message =
      errorData?.error?.message ??
      errorData?.message ??
      t('errors.unexpectedError');

    if (status === 401) {
      const authStore = useAuthStore.getState();
      // Save current path for redirect after re-login
      if (window.location.pathname !== '/login') {
        authStore.setRedirectAfterLogin(window.location.pathname + window.location.search);
      }
      authStore.logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (status === 400) {
      // Check if it's a UUID format error (from mock data)
      if (message.includes('Invalid ID format') || message.includes('UUID')) {
        toast.error(t('errors.invalidIdFormat'));
      } else {
        toast.error(message || t('errors.badRequest'));
      }
    } else if (status === 403) {
      toast.error(t('errors.forbiddenAction'));
    } else if (status === 404) {
      toast.error(t('errors.resourceNotFound'));
    } else if (status === 422) {
      toast.error(message);
    } else if (status && status >= 500) {
      toast.error(t('errors.serverErrorRetry'));
    } else if (!error.response) {
      toast.error(t('errors.noConnection'));
    }

    return Promise.reject(error);
  },
);
