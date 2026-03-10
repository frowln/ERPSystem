import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, TEST_USERS, authHeaders, authenticate, THINK_TIME_MIN, THINK_TIME_MAX } from '../config.js';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const taskListDuration = new Trend('tasks_list_duration', true);
const taskCreateDuration = new Trend('tasks_create_duration', true);
const taskUpdateDuration = new Trend('tasks_update_duration', true);
const taskErrorRate = new Rate('tasks_error_rate');

// ---------------------------------------------------------------------------
// Standalone options
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    tasks_flow: {
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
    tasks_list_duration: ['p(95)<800'],
    tasks_create_duration: ['p(95)<800'],
    tasks_update_duration: ['p(95)<800'],
    tasks_error_rate: ['rate<0.05'],
  },
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export function setup() {
  const creds = authenticate(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!creds.accessToken) {
    throw new Error('Setup: could not authenticate — aborting test');
  }

  // Try to get an existing project ID for task creation
  const headers = authHeaders(creds.accessToken);
  const projectsRes = http.get(`${BASE_URL}/api/projects?page=0&size=5`, { headers });
  let projectId = null;
  try {
    const body = JSON.parse(projectsRes.body);
    const items = body.data.content || body.data;
    if (Array.isArray(items) && items.length > 0) {
      projectId = items[0].id;
    }
  } catch (_) { /* ignore */ }

  return { token: creds.accessToken, projectId };
}

// ---------------------------------------------------------------------------
// Scenario function
// ---------------------------------------------------------------------------

export function tasksScenario(token, projectId) {
  const headers = authHeaders(token);
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  // --- 1. List tasks (paginated) ------------------------------------------
  group('List tasks', () => {
    const queryParams = projectId
      ? `?projectId=${projectId}&page=0&size=20`
      : '?page=0&size=20';

    const res = http.get(`${BASE_URL}/api/tasks${queryParams}`, {
      headers,
      tags: { name: 'GET /api/tasks' },
    });

    taskListDuration.add(res.timings.duration);

    const ok = check(res, {
      'list tasks: status 200': (r) => r.status === 200,
      'list tasks: success': (r) => {
        try { return JSON.parse(r.body).success === true; } catch (_) { return false; }
      },
      'list tasks: has content': (r) => {
        try {
          const data = JSON.parse(r.body).data;
          return data !== null && data !== undefined;
        } catch (_) { return false; }
      },
    });

    taskErrorRate.add(!ok);
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 2. Create task -----------------------------------------------------
  let createdTaskId = null;

  group('Create task', () => {
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const payload = JSON.stringify({
      title: `k6-task-${Date.now()}-VU${__VU}`,
      description: 'Task created by k6 load test — safe to delete',
      projectId: projectId || undefined,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      plannedStartDate: startDate,
      plannedEndDate: endDate,
      estimatedHours: Math.floor(Math.random() * 40) + 1,
      progress: 0,
    });

    const res = http.post(`${BASE_URL}/api/tasks`, payload, {
      headers,
      tags: { name: 'POST /api/tasks' },
    });

    taskCreateDuration.add(res.timings.duration);

    const ok = check(res, {
      'create task: status 201': (r) => r.status === 201,
      'create task: has id': (r) => {
        try { return !!JSON.parse(r.body).data.id; } catch (_) { return false; }
      },
      'create task: title matches': (r) => {
        try { return JSON.parse(r.body).data.title.startsWith('k6-task-'); } catch (_) { return false; }
      },
    });

    taskErrorRate.add(!ok);

    if (ok) {
      try {
        createdTaskId = JSON.parse(res.body).data.id;
      } catch (_) { /* ignore */ }
    }
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 3. Update task (change status/progress) ----------------------------
  if (createdTaskId) {
    group('Update task', () => {
      const payload = JSON.stringify({
        title: `k6-task-updated-${Date.now()}-VU${__VU}`,
        progress: Math.floor(Math.random() * 100),
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        notes: 'Updated by k6 load test',
      });

      const res = http.put(`${BASE_URL}/api/tasks/${createdTaskId}`, payload, {
        headers,
        tags: { name: 'PUT /api/tasks/{id}' },
      });

      taskUpdateDuration.add(res.timings.duration);

      const ok = check(res, {
        'update task: status 200': (r) => r.status === 200,
        'update task: id matches': (r) => {
          try { return JSON.parse(r.body).data.id === createdTaskId; } catch (_) { return false; }
        },
      });

      taskErrorRate.add(!ok);
    });

    sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

    // --- 4. Get task detail -----------------------------------------------
    group('Get task detail', () => {
      const res = http.get(`${BASE_URL}/api/tasks/${createdTaskId}`, {
        headers,
        tags: { name: 'GET /api/tasks/{id}' },
      });

      const ok = check(res, {
        'task detail: status 200': (r) => r.status === 200,
        'task detail: has title': (r) => {
          try { return !!JSON.parse(r.body).data.title; } catch (_) { return false; }
        },
      });

      taskErrorRate.add(!ok);
    });

    sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);
  }
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default function (data) {
  tasksScenario(data.token, data.projectId);
}
