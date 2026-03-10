import { sleep } from 'k6';
import { authenticate, TEST_USERS, THINK_TIME_MIN, THINK_TIME_MAX } from './config.js';
import { authScenario } from './scenarios/auth.js';
import { projectsScenario } from './scenarios/projects.js';
import { tasksScenario } from './scenarios/tasks.js';
import { financeScenario } from './scenarios/finance.js';
import http from 'k6/http';
import { BASE_URL, authHeaders } from './config.js';

// ---------------------------------------------------------------------------
// Global options — orchestrates all scenarios via a single ramping-vus
// executor. Each VU iteration randomly picks a scenario to execute,
// simulating a realistic mix of user workflows.
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    mixed_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up: 0 -> 50 VUs
        { duration: '5m', target: 50 },   // Sustain: 50 VUs
        { duration: '1m', target: 100 },  // Peak: 50 -> 100 VUs
        { duration: '3m', target: 100 },  // Sustain peak: 100 VUs
        { duration: '2m', target: 0 },    // Ramp down: 100 -> 0
      ],
      gracefulRampDown: '30s',
    },
  },

  thresholds: {
    // Global thresholds
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],

    // Per-scenario thresholds
    auth_login_duration: ['p(95)<500'],
    auth_refresh_duration: ['p(95)<500'],
    auth_error_rate: ['rate<0.01'],

    projects_list_duration: ['p(95)<1000'],
    projects_detail_duration: ['p(95)<1000'],
    projects_create_duration: ['p(95)<1000'],
    projects_error_rate: ['rate<0.05'],

    tasks_list_duration: ['p(95)<800'],
    tasks_create_duration: ['p(95)<800'],
    tasks_update_duration: ['p(95)<800'],
    tasks_error_rate: ['rate<0.05'],

    finance_budget_list_duration: ['p(95)<1000'],
    finance_budget_detail_duration: ['p(95)<1000'],
    finance_invoice_list_duration: ['p(95)<1000'],
    finance_error_rate: ['rate<0.05'],
  },
};

// ---------------------------------------------------------------------------
// Setup — authenticate once and gather context for all scenarios
// ---------------------------------------------------------------------------

export function setup() {
  const creds = authenticate(TEST_USERS.admin.email, TEST_USERS.admin.password);
  if (!creds.accessToken) {
    throw new Error('Setup: could not authenticate — aborting test run');
  }

  // Fetch a project ID for task scenarios
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

  console.log(`Setup complete. Project ID for tasks: ${projectId || 'none (will create without project)'}`);

  return {
    token: creds.accessToken,
    projectId,
  };
}

// ---------------------------------------------------------------------------
// Default function — weighted random scenario selection
//
// Weights reflect realistic usage distribution:
//   Auth:     10%  (users log in less frequently)
//   Projects: 25%  (common CRUD)
//   Tasks:    40%  (most frequent module)
//   Finance:  25%  (regular financial checks)
// ---------------------------------------------------------------------------

const SCENARIO_WEIGHTS = [
  { name: 'auth', weight: 10 },
  { name: 'projects', weight: 25 },
  { name: 'tasks', weight: 40 },
  { name: 'finance', weight: 25 },
];

function pickScenario() {
  const totalWeight = SCENARIO_WEIGHTS.reduce((sum, s) => sum + s.weight, 0);
  let r = Math.random() * totalWeight;
  for (const s of SCENARIO_WEIGHTS) {
    r -= s.weight;
    if (r <= 0) return s.name;
  }
  return SCENARIO_WEIGHTS[SCENARIO_WEIGHTS.length - 1].name;
}

export default function (data) {
  const scenario = pickScenario();

  switch (scenario) {
    case 'auth':
      authScenario();
      break;
    case 'projects':
      projectsScenario(data.token);
      break;
    case 'tasks':
      tasksScenario(data.token, data.projectId);
      break;
    case 'finance':
      financeScenario(data.token);
      break;
  }

  // Small inter-iteration pause
  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);
}

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------

export function teardown(data) {
  console.log('Load test complete.');
}
