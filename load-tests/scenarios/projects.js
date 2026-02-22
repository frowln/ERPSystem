// =============================================================================
// PRIVOD NEXT -- k6 Projects CRUD Scenario
// Tests: list, detail, create, update, dashboard summary
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
const projectListDuration = new Trend('project_list_duration', true);
const projectListFailRate = new Rate('project_list_fail_rate');

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------
export const options = {
  stages: getStages(),
  thresholds: {
    ...globalThresholds,
    project_list_duration: ['p(95)<500'],
    project_list_fail_rate: ['rate<0.01'],
  },
};

// ---------------------------------------------------------------------------
// Setup: login once and share the token across VUs
// ---------------------------------------------------------------------------
export function setup() {
  const payload = JSON.stringify({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });

  const res = http.post(`${API_URL}/auth/login`, payload, jsonHeaders());

  check(res, {
    'setup: login succeeded': (r) => r.status === 200,
  });

  if (res.status !== 200) {
    throw new Error(`Setup login failed: ${res.status} ${res.body}`);
  }

  const data = res.json().data;
  return { accessToken: data.accessToken };
}

// ---------------------------------------------------------------------------
// Default (main) function
// ---------------------------------------------------------------------------
export default function (data) {
  const token = data.accessToken;
  let createdProjectId = null;

  // ----- Group 1: List projects (paginated) -----
  group('List projects', () => {
    const res = http.get(
      `${API_URL}/projects?page=0&size=20&sort=createdAt,desc`,
      authHeaders(token),
    );

    projectListDuration.add(res.timings.duration);

    const ok = check(res, {
      'list status is 200': (r) => r.status === 200,
      'list returns page data': (r) => {
        const body = r.json();
        return body.data && typeof body.data.totalElements === 'number';
      },
    });

    projectListFailRate.add(!ok);
  });

  sleep(1);

  // ----- Group 2: List with search filter -----
  group('List projects with search', () => {
    const res = http.get(
      `${API_URL}/projects?search=test&page=0&size=10`,
      authHeaders(token),
    );

    check(res, {
      'filtered list status is 200': (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // ----- Group 3: Dashboard summary -----
  group('Dashboard summary', () => {
    const res = http.get(
      `${API_URL}/projects/dashboard/summary`,
      authHeaders(token),
    );

    check(res, {
      'dashboard status is 200': (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // ----- Group 4: Create a project -----
  group('Create project', () => {
    const uniqueSuffix = `${__VU}-${__ITER}-${Date.now()}`;
    const payload = JSON.stringify({
      name: `k6 Load Test Project ${uniqueSuffix}`,
      description: 'Project created by k6 load test — safe to delete',
      city: 'Moscow',
      region: 'Moscow Oblast',
      type: 'CONSTRUCTION',
      priority: 'MEDIUM',
      plannedStartDate: '2026-04-01',
      plannedEndDate: '2026-12-31',
      budgetAmount: 5000000,
      contractAmount: 6000000,
    });

    const res = http.post(`${API_URL}/projects`, payload, authHeaders(token));

    check(res, {
      'create status is 201': (r) => r.status === 201,
      'create returns project id': (r) => {
        const body = r.json();
        return body.data && body.data.id;
      },
    });

    if (res.status === 201) {
      createdProjectId = res.json().data.id;
    }
  });

  sleep(0.5);

  // ----- Group 5: Get single project detail -----
  group('Get project detail', () => {
    if (!createdProjectId) return;

    const res = http.get(
      `${API_URL}/projects/${createdProjectId}`,
      authHeaders(token),
    );

    check(res, {
      'detail status is 200': (r) => r.status === 200,
      'detail returns correct id': (r) => {
        const body = r.json();
        return body.data && body.data.id === createdProjectId;
      },
    });
  });

  sleep(0.5);

  // ----- Group 6: Update project -----
  group('Update project', () => {
    if (!createdProjectId) return;

    const payload = JSON.stringify({
      name: `k6 Updated Project ${__VU}-${__ITER}`,
      description: 'Updated by k6 load test',
      priority: 'HIGH',
    });

    const res = http.put(
      `${API_URL}/projects/${createdProjectId}`,
      payload,
      authHeaders(token),
    );

    check(res, {
      'update status is 200': (r) => r.status === 200,
      'update reflects new name': (r) => {
        const body = r.json();
        return body.data && body.data.name.startsWith('k6 Updated Project');
      },
    });
  });

  sleep(1);
}
