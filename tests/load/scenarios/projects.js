import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, TEST_USERS, authHeaders, authenticate, THINK_TIME_MIN, THINK_TIME_MAX } from '../config.js';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const projectListDuration = new Trend('projects_list_duration', true);
const projectDetailDuration = new Trend('projects_detail_duration', true);
const projectCreateDuration = new Trend('projects_create_duration', true);
const projectErrorRate = new Rate('projects_error_rate');

// ---------------------------------------------------------------------------
// Standalone options
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    projects_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 15 },
        { duration: '2m', target: 15 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    projects_list_duration: ['p(95)<1000'],
    projects_detail_duration: ['p(95)<1000'],
    projects_create_duration: ['p(95)<1000'],
    projects_error_rate: ['rate<0.05'],
  },
};

// ---------------------------------------------------------------------------
// Setup — runs once, authenticates, and shares the token across VUs
// ---------------------------------------------------------------------------

export function setup() {
  const creds = authenticate(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!creds.accessToken) {
    throw new Error('Setup: could not authenticate — aborting test');
  }
  return { token: creds.accessToken };
}

// ---------------------------------------------------------------------------
// Scenario function
// ---------------------------------------------------------------------------

export function projectsScenario(token) {
  const headers = authHeaders(token);

  // --- 1. List projects ---------------------------------------------------
  group('List projects', () => {
    const res = http.get(`${BASE_URL}/api/projects?page=0&size=20`, {
      headers,
      tags: { name: 'GET /api/projects' },
    });

    projectListDuration.add(res.timings.duration);

    const ok = check(res, {
      'list projects: status 200': (r) => r.status === 200,
      'list projects: success flag': (r) => {
        try { return JSON.parse(r.body).success === true; } catch (_) { return false; }
      },
      'list projects: data is array or page': (r) => {
        try {
          const data = JSON.parse(r.body).data;
          return data !== null && data !== undefined;
        } catch (_) { return false; }
      },
    });

    projectErrorRate.add(!ok);
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 2. Get project detail (use first project from listing) -------------
  group('Get project detail', () => {
    // First, grab a project ID from the listing
    const listRes = http.get(`${BASE_URL}/api/projects?page=0&size=5`, {
      headers,
      tags: { name: 'GET /api/projects (for detail)' },
    });

    let projectId = null;
    try {
      const body = JSON.parse(listRes.body);
      const items = body.data.content || body.data;
      if (Array.isArray(items) && items.length > 0) {
        // Pick a random project from the list
        projectId = items[Math.floor(Math.random() * items.length)].id;
      }
    } catch (_) { /* ignore */ }

    if (!projectId) {
      console.warn('No projects found — skipping detail request');
      return;
    }

    const res = http.get(`${BASE_URL}/api/projects/${projectId}`, {
      headers,
      tags: { name: 'GET /api/projects/{id}' },
    });

    projectDetailDuration.add(res.timings.duration);

    const ok = check(res, {
      'project detail: status 200': (r) => r.status === 200,
      'project detail: has id': (r) => {
        try { return JSON.parse(r.body).data.id === projectId; } catch (_) { return false; }
      },
      'project detail: has name': (r) => {
        try { return !!JSON.parse(r.body).data.name; } catch (_) { return false; }
      },
    });

    projectErrorRate.add(!ok);
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 3. Create project --------------------------------------------------
  group('Create project', () => {
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const payload = JSON.stringify({
      name: `k6-load-test-${Date.now()}-${__VU}`,
      description: 'Project created by k6 load test — safe to delete',
      plannedStartDate: startDate,
      plannedEndDate: endDate,
      budgetAmount: 1000000,
      contractAmount: 1200000,
      type: 'CONSTRUCTION',
      category: 'load-test',
      priority: 'MEDIUM',
    });

    const res = http.post(`${BASE_URL}/api/projects`, payload, {
      headers,
      tags: { name: 'POST /api/projects' },
    });

    projectCreateDuration.add(res.timings.duration);

    const ok = check(res, {
      'create project: status 201': (r) => r.status === 201,
      'create project: has id': (r) => {
        try { return !!JSON.parse(r.body).data.id; } catch (_) { return false; }
      },
    });

    projectErrorRate.add(!ok);

    // Store created project id for potential cleanup
    if (ok) {
      try {
        const createdId = JSON.parse(res.body).data.id;
        // Best-effort cleanup: delete the project we just created
        http.del(`${BASE_URL}/api/projects/${createdId}`, null, {
          headers,
          tags: { name: 'DELETE /api/projects/{id} (cleanup)' },
        });
      } catch (_) { /* ignore cleanup failures */ }
    }
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 4. Dashboard summary -----------------------------------------------
  group('Dashboard summary', () => {
    const res = http.get(`${BASE_URL}/api/projects/dashboard/summary`, {
      headers,
      tags: { name: 'GET /api/projects/dashboard/summary' },
    });

    const ok = check(res, {
      'dashboard: status 200': (r) => r.status === 200,
    });

    projectErrorRate.add(!ok);
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default function (data) {
  projectsScenario(data.token);
}
