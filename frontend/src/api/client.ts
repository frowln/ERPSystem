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

// Refresh token rotation state
let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}[] = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      apiClient(config).then(resolve).catch(reject);
    }
  });
  failedQueue = [];
};

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
  async (error: AxiosError<{ message?: string; error?: { code?: number; message?: string } }>) => {
    if (error.code === DEMO_MODE_BLOCKED_ERROR_CODE) {
      notifyDemoModeBlockedAction();
      return Promise.reject(error);
    }

    // Callers can pass { headers: { 'x-silent-errors': 'true' } } to suppress global toasts
    if ((error.config as { _silentErrors?: boolean })?._silentErrors) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const errorData = error.response?.data as { message?: string; error?: { code?: number; message?: string } };
    const message =
      errorData?.error?.message ??
      errorData?.message ??
      t('errors.unexpectedError');

    if (status === 401) {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Don't retry refresh requests or already-retried requests
      if (originalRequest?.url?.includes('/auth/refresh') || originalRequest?._retry) {
        const authStore = useAuthStore.getState();
        if (window.location.pathname !== '/login') {
          authStore.setRedirectAfterLogin(window.location.pathname + window.location.search);
        }
        authStore.logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Queue requests while refreshing
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const authStore = useAuthStore.getState();
      const currentRefreshToken = authStore.refreshToken;

      if (!currentRefreshToken) {
        isRefreshing = false;
        processQueue(error);
        if (window.location.pathname !== '/login') {
          authStore.setRedirectAfterLogin(window.location.pathname + window.location.search);
        }
        authStore.logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post('/api/auth/refresh', { refreshToken: currentRefreshToken });
        const responseData = refreshResponse.data?.data ?? refreshResponse.data;
        const newAccessToken = responseData.accessToken;
        const newRefreshToken = responseData.refreshToken;

        if (authStore.user) {
          authStore.setAuth(authStore.user, newAccessToken, newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        isRefreshing = false;
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        if (window.location.pathname !== '/login') {
          authStore.setRedirectAfterLogin(window.location.pathname + window.location.search);
        }
        authStore.logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    const isGetRequest = error.config?.method?.toUpperCase() === 'GET';

    if (status === 400) {
      // UUID format errors on GET requests are usually from missing/empty data — suppress
      if (isGetRequest && (message.includes('Invalid ID format') || message.includes('UUID'))) {
        // Silent — page will show empty state
      } else if (message.includes('Invalid ID format') || message.includes('UUID')) {
        toast.error(t('errors.invalidIdFormat'));
      } else {
        toast.error(message || t('errors.badRequest'));
      }
    } else if (status === 403) {
      toast.error(t('errors.forbiddenAction'));
    } else if (status === 404) {
      // Don't show "Resource not found" on GET requests — page will show empty state
      if (!isGetRequest) {
        toast.error(t('errors.resourceNotFound'));
      }
    } else if (status === 422) {
      toast.error(message);
    } else if (status && status >= 500) {
      // Don't show server errors on GET list requests — page will show empty state
      if (!isGetRequest) {
        toast.error(t('errors.serverErrorRetry'));
      }
    } else if (!error.response) {
      toast.error(t('errors.noConnection'));
    }

    return Promise.reject(error);
  },
);
