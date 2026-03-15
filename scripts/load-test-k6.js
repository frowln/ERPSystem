/**
 * PRIVOD Platform — k6 Load Test Script
 * =======================================
 * Scenarios: 10 / 50 / 100 concurrent users
 *
 * Usage:
 *   brew install k6
 *   k6 run scripts/load-test-k6.js --env BASE_URL=http://localhost:8080
 *   k6 run scripts/load-test-k6.js --env BASE_URL=http://localhost:8080 --env USERS=50
 *
 * Or with stages (ramp 10→50→100):
 *   k6 run scripts/load-test-k6.js
 *
 * Results: stdout summary + optional JSON (k6 run --out json=results.json ...)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ────────────────────────────────────────────────
const errorRate = new Rate('errors');
const error5xx = new Counter('errors_5xx');
const projectListTrend = new Trend('api_projects_list', true);
const projectDetailTrend = new Trend('api_projects_detail', true);
const budgetsTrend = new Trend('api_budgets', true);
const taskCreateTrend = new Trend('api_tasks_create', true);
const dashboardTrend = new Trend('api_dashboard', true);
const loginTrend = new Trend('api_login', true);

// ─── Config ────────────────────────────────────────────────────────
const BASE = __ENV.BASE_URL || 'http://localhost:8080';
const EMAIL = __ENV.EMAIL || 'admin@privod.ru';
const PASSWORD = __ENV.PASSWORD || 'admin123';
const MAX_USERS = parseInt(__ENV.USERS || '100', 10);

// ─── Scenarios: Ramp-up 10 → 50 → 100 ─────────────────────────────
export const options = {
  scenarios: {
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },   // Warm-up: 10 users
        { duration: '1m', target: 10 },     // Hold 10 users for 1 min
        { duration: '30s', target: 50 },    // Ramp to 50
        { duration: '1m', target: 50 },     // Hold 50 users for 1 min
        { duration: '30s', target: MAX_USERS }, // Ramp to 100
        { duration: '2m', target: MAX_USERS },  // Hold 100 users for 2 min
        { duration: '30s', target: 0 },     // Ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],      // 95% of requests < 3s
    errors: ['rate<0.1'],                   // Error rate < 10%
    errors_5xx: ['count<50'],               // Less than 50 5xx errors total
    api_projects_list: ['p(95)<2000'],
    api_projects_detail: ['p(95)<1500'],
    api_budgets: ['p(95)<2000'],
    api_tasks_create: ['p(95)<3000'],
    api_dashboard: ['p(95)<5000'],          // Dashboard can be heavier
  },
};

// ─── Setup: Login once, share token ────────────────────────────────
export function setup() {
  const loginRes = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } },
  );

  loginTrend.add(loginRes.timings.duration);

  const body = loginRes.json();
  const token = body.data ? body.data.accessToken : body.accessToken;

  if (!token) {
    console.error(`Login failed: ${loginRes.status} ${loginRes.body}`);
    return { token: '' };
  }

  console.log(`Login OK — token acquired (${loginRes.timings.duration}ms)`);

  // Fetch one project ID for detail requests
  const projRes = http.get(`${BASE}/api/projects?page=0&size=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let projectId = null;
  try {
    const projBody = projRes.json();
    const list = projBody.data?.content || projBody.content || projBody.data || [];
    if (Array.isArray(list) && list.length > 0) {
      projectId = list[0].id;
    }
  } catch (_) { /* ignore */ }

  return { token, projectId };
}

// ─── Helpers ───────────────────────────────────────────────────────
function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

function checkResponse(res, name) {
  const ok = check(res, {
    [`${name}: status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${name}: body not empty`]: (r) => r.body && r.body.length > 0,
  });
  errorRate.add(!ok);
  if (res.status >= 500) {
    error5xx.add(1);
  }
  return ok;
}

// ─── Main VU Loop ──────────────────────────────────────────────────
export default function (data) {
  const { token, projectId } = data;

  if (!token) {
    console.error('No token — skipping iteration');
    sleep(5);
    return;
  }

  const params = authHeaders(token);

  // 1. GET /api/projects (list)
  group('GET /api/projects', () => {
    const res = http.get(
      `${BASE}/api/projects?page=0&size=20`,
      Object.assign({}, params, { tags: { name: 'GET /api/projects' } }),
    );
    projectListTrend.add(res.timings.duration);
    checkResponse(res, 'projects-list');
  });

  sleep(0.5 + Math.random());

  // 2. GET /api/projects/:id (detail)
  group('GET /api/projects/:id', () => {
    const id = projectId || '00000000-0000-0000-0000-000000000001';
    const res = http.get(
      `${BASE}/api/projects/${id}`,
      Object.assign({}, params, { tags: { name: 'GET /api/projects/:id' } }),
    );
    projectDetailTrend.add(res.timings.duration);
    checkResponse(res, 'project-detail');
  });

  sleep(0.5 + Math.random());

  // 3. GET /api/finance/budgets (list)
  group('GET /api/finance/budgets', () => {
    const res = http.get(
      `${BASE}/api/finance/budgets?page=0&size=20`,
      Object.assign({}, params, { tags: { name: 'GET /api/finance/budgets' } }),
    );
    budgetsTrend.add(res.timings.duration);
    checkResponse(res, 'budgets');
  });

  sleep(0.5 + Math.random());

  // 4. POST /api/tasks (create task)
  group('POST /api/tasks', () => {
    const vuId = __VU;
    const iter = __ITER;
    const payload = JSON.stringify({
      title: `K6-LoadTest-VU${vuId}-${iter}-${Date.now()}`,
      description: 'Load test task — auto-created by k6',
      priority: 'MEDIUM',
      status: 'TODO',
      projectId: projectId || undefined,
    });
    const res = http.post(
      `${BASE}/api/tasks`,
      payload,
      Object.assign({}, params, { tags: { name: 'POST /api/tasks' } }),
    );
    taskCreateTrend.add(res.timings.duration);
    checkResponse(res, 'task-create');
  });

  sleep(0.5 + Math.random());

  // 5. GET /api/analytics/dashboard
  group('GET /api/analytics/dashboard', () => {
    const res = http.get(
      `${BASE}/api/analytics/dashboard`,
      Object.assign({}, params, { tags: { name: 'GET /api/analytics/dashboard' } }),
    );
    dashboardTrend.add(res.timings.duration);
    checkResponse(res, 'dashboard');
  });

  sleep(1 + Math.random() * 2);
}

// ─── Teardown: Print summary ───────────────────────────────────────
export function teardown(data) {
  console.log('═══════════════════════════════════════════');
  console.log('  PRIVOD Load Test Complete');
  console.log('  Check summary above for thresholds');
  console.log('═══════════════════════════════════════════');
}

// ─── Custom text summary ───────────────────────────────────────────
export function handleSummary(data) {
  const fmt = (ms) => (ms ? `${ms.toFixed(0)}ms` : 'N/A');
  const m = data.metrics;

  const report = `
╔═══════════════════════════════════════════════════════════════╗
║          PRIVOD Platform — Load Test Results                  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Total Requests:     ${String(m.http_reqs?.values?.count || 0).padStart(8)}                            ║
║  Total Duration:     ${fmt(m.iteration_duration?.values?.avg).padStart(8)} avg iteration           ║
║  Error Rate:         ${((m.errors?.values?.rate || 0) * 100).toFixed(1).padStart(7)}%                            ║
║  5xx Errors:         ${String(m.errors_5xx?.values?.count || 0).padStart(8)}                            ║
║                                                               ║
║  ── Response Times (p95) ──────────────────────────────────── ║
║  GET  /api/projects        ${fmt(m.api_projects_list?.values?.['p(95)']).padStart(8)}                    ║
║  GET  /api/projects/:id    ${fmt(m.api_projects_detail?.values?.['p(95)']).padStart(8)}                    ║
║  GET  /api/finance/budgets ${fmt(m.api_budgets?.values?.['p(95)']).padStart(8)}                    ║
║  POST /api/tasks           ${fmt(m.api_tasks_create?.values?.['p(95)']).padStart(8)}                    ║
║  GET  /api/analytics/dash  ${fmt(m.api_dashboard?.values?.['p(95)']).padStart(8)}                    ║
║                                                               ║
║  ── Max Response Times ────────────────────────────────────── ║
║  GET  /api/projects        ${fmt(m.api_projects_list?.values?.max).padStart(8)}                    ║
║  GET  /api/projects/:id    ${fmt(m.api_projects_detail?.values?.max).padStart(8)}                    ║
║  GET  /api/finance/budgets ${fmt(m.api_budgets?.values?.max).padStart(8)}                    ║
║  POST /api/tasks           ${fmt(m.api_tasks_create?.values?.max).padStart(8)}                    ║
║  GET  /api/analytics/dash  ${fmt(m.api_dashboard?.values?.max).padStart(8)}                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

  return {
    stdout: report,
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}
