import http from 'k6/http';
import { check } from 'k6';

// ---------------------------------------------------------------------------
// Environment configuration
// ---------------------------------------------------------------------------

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const TEST_USERS = {
  admin: {
    email: __ENV.ADMIN_EMAIL || 'admin@privod.ru',
    password: __ENV.ADMIN_PASSWORD || 'admin123',
  },
  manager: {
    email: __ENV.MANAGER_EMAIL || 'manager@privod.ru',
    password: __ENV.MANAGER_PASSWORD || 'manager123',
  },
  engineer: {
    email: __ENV.ENGINEER_EMAIL || 'engineer@privod.ru',
    password: __ENV.ENGINEER_PASSWORD || 'engineer123',
  },
};

// ---------------------------------------------------------------------------
// Common headers
// ---------------------------------------------------------------------------

export function jsonHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// ---------------------------------------------------------------------------
// Authentication helper — logs in and returns { accessToken, refreshToken }
// ---------------------------------------------------------------------------

export function authenticate(email, password) {
  const url = `${BASE_URL}/api/auth/login`;
  const payload = JSON.stringify({ email, password });

  const res = http.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'auth_login' },
  });

  const ok = check(res, {
    'auth: status 200': (r) => r.status === 200,
    'auth: has accessToken': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data && body.data.accessToken;
      } catch (_) {
        return false;
      }
    },
  });

  if (!ok) {
    console.error(`Authentication failed for ${email}: ${res.status} ${res.body}`);
    return { accessToken: null, refreshToken: null };
  }

  const body = JSON.parse(res.body);
  return {
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
  };
}

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

/** Minimum think-time between requests (seconds) */
export const THINK_TIME_MIN = 1;
/** Maximum think-time between requests (seconds) */
export const THINK_TIME_MAX = 3;
