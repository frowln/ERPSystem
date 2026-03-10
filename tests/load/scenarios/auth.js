import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, TEST_USERS, jsonHeaders, THINK_TIME_MIN, THINK_TIME_MAX } from '../config.js';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const loginDuration = new Trend('auth_login_duration', true);
const refreshDuration = new Trend('auth_refresh_duration', true);
const authErrorRate = new Rate('auth_error_rate');

// ---------------------------------------------------------------------------
// Standalone options (used when running this file directly)
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    auth_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    auth_login_duration: ['p(95)<500'],
    auth_refresh_duration: ['p(95)<500'],
    auth_error_rate: ['rate<0.01'],
  },
};

// ---------------------------------------------------------------------------
// Scenario function (exported for run-all.js)
// ---------------------------------------------------------------------------

export function authScenario() {
  // --- 1. Login -----------------------------------------------------------
  const loginPayload = JSON.stringify({
    email: TEST_USERS.admin.email,
    password: TEST_USERS.admin.password,
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: jsonHeaders(),
    tags: { name: 'POST /api/auth/login' },
  });

  loginDuration.add(loginRes.timings.duration);

  const loginOk = check(loginRes, {
    'login: status 200': (r) => r.status === 200,
    'login: success flag': (r) => {
      try { return JSON.parse(r.body).success === true; } catch (_) { return false; }
    },
    'login: accessToken present': (r) => {
      try { return !!JSON.parse(r.body).data.accessToken; } catch (_) { return false; }
    },
    'login: refreshToken present': (r) => {
      try { return !!JSON.parse(r.body).data.refreshToken; } catch (_) { return false; }
    },
    'login: user data present': (r) => {
      try { return !!JSON.parse(r.body).data.user; } catch (_) { return false; }
    },
  });

  authErrorRate.add(!loginOk);

  if (!loginOk) {
    console.warn(`Login failed: ${loginRes.status} ${loginRes.body}`);
    sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);
    return;
  }

  const loginBody = JSON.parse(loginRes.body);
  const accessToken = loginBody.data.accessToken;
  const refreshToken = loginBody.data.refreshToken;

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 2. Verify token — GET /api/auth/me ---------------------------------
  const meRes = http.get(`${BASE_URL}/api/auth/me`, {
    headers: jsonHeaders(accessToken),
    tags: { name: 'GET /api/auth/me' },
  });

  check(meRes, {
    'me: status 200': (r) => r.status === 200,
    'me: returns user': (r) => {
      try { return !!JSON.parse(r.body).data; } catch (_) { return false; }
    },
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 3. Refresh token ---------------------------------------------------
  const refreshPayload = JSON.stringify({ refreshToken });

  const refreshRes = http.post(`${BASE_URL}/api/auth/refresh`, refreshPayload, {
    headers: jsonHeaders(),
    tags: { name: 'POST /api/auth/refresh' },
  });

  refreshDuration.add(refreshRes.timings.duration);

  const refreshOk = check(refreshRes, {
    'refresh: status 200': (r) => r.status === 200,
    'refresh: new accessToken': (r) => {
      try { return !!JSON.parse(r.body).data.accessToken; } catch (_) { return false; }
    },
    'refresh: new refreshToken': (r) => {
      try { return !!JSON.parse(r.body).data.refreshToken; } catch (_) { return false; }
    },
  });

  authErrorRate.add(!refreshOk);

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);
}

// ---------------------------------------------------------------------------
// Default export (standalone mode)
// ---------------------------------------------------------------------------

export default function () {
  authScenario();
}
