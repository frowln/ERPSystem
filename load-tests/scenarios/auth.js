// =============================================================================
// PRIVOD NEXT -- k6 Auth Scenario
// Tests: login, /me validation, token refresh, change-password guard
// =============================================================================

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import {
  API_URL,
  TEST_USER,
  thresholds as globalThresholds,
  getStages,
  authHeaders,
  jsonHeaders,
} from '../k6-config.js';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------
const loginDuration = new Trend('login_duration', true);
const loginFailRate = new Rate('login_fail_rate');

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------
export const options = {
  stages: getStages(),
  thresholds: {
    ...globalThresholds,
    login_duration: ['p(95)<300'],
    login_fail_rate: ['rate<0.01'],
  },
};

// ---------------------------------------------------------------------------
// Default (main) function
// ---------------------------------------------------------------------------
export default function () {
  let accessToken = null;
  let refreshToken = null;

  // ----- Group 1: Login -----
  group('Login', () => {
    const payload = JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    const res = http.post(`${API_URL}/auth/login`, payload, jsonHeaders());

    loginDuration.add(res.timings.duration);

    const ok = check(res, {
      'login status is 200': (r) => r.status === 200,
      'response has accessToken': (r) => {
        const body = r.json();
        return body.data && body.data.accessToken;
      },
      'response has refreshToken': (r) => {
        const body = r.json();
        return body.data && body.data.refreshToken;
      },
    });

    loginFailRate.add(!ok);

    if (ok) {
      const data = res.json().data;
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
    }
  });

  sleep(1);

  // ----- Group 2: Validate token on protected endpoint -----
  group('Get current user (/me)', () => {
    if (!accessToken) return;

    const res = http.get(`${API_URL}/auth/me`, authHeaders(accessToken));

    check(res, {
      '/me status is 200': (r) => r.status === 200,
      '/me returns user data': (r) => {
        const body = r.json();
        return body.data && body.data.email;
      },
      '/me email matches login': (r) => {
        const body = r.json();
        return body.data && body.data.email === TEST_USER.email;
      },
    });
  });

  sleep(0.5);

  // ----- Group 3: Refresh token -----
  group('Refresh token', () => {
    if (!refreshToken) return;

    const payload = JSON.stringify({
      refreshToken: refreshToken,
    });

    const res = http.post(`${API_URL}/auth/refresh`, payload, jsonHeaders());

    check(res, {
      'refresh status is 200': (r) => r.status === 200,
      'refresh returns new accessToken': (r) => {
        const body = r.json();
        return body.data && body.data.accessToken;
      },
    });

    if (res.status === 200) {
      const data = res.json().data;
      accessToken = data.accessToken;
    }
  });

  sleep(0.5);

  // ----- Group 4: Verify refreshed token works -----
  group('Verify refreshed token', () => {
    if (!accessToken) return;

    const res = http.get(`${API_URL}/auth/me`, authHeaders(accessToken));

    check(res, {
      'refreshed token is valid': (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // ----- Group 5: Unauthorized access guard -----
  group('Unauthorized access rejected', () => {
    const res = http.get(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid-token-12345' },
    });

    check(res, {
      'invalid token returns 401': (r) => r.status === 401,
    });
  });

  sleep(1);
}
