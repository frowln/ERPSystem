import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, TEST_USERS, authHeaders, authenticate, THINK_TIME_MIN, THINK_TIME_MAX } from '../config.js';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const budgetListDuration = new Trend('finance_budget_list_duration', true);
const budgetDetailDuration = new Trend('finance_budget_detail_duration', true);
const invoiceListDuration = new Trend('finance_invoice_list_duration', true);
const budgetSummaryDuration = new Trend('finance_budget_summary_duration', true);
const financeErrorRate = new Rate('finance_error_rate');

// ---------------------------------------------------------------------------
// Standalone options
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    finance_flow: {
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
    finance_budget_list_duration: ['p(95)<1000'],
    finance_budget_detail_duration: ['p(95)<1000'],
    finance_invoice_list_duration: ['p(95)<1000'],
    finance_error_rate: ['rate<0.05'],
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
  return { token: creds.accessToken };
}

// ---------------------------------------------------------------------------
// Scenario function
// ---------------------------------------------------------------------------

export function financeScenario(token) {
  const headers = authHeaders(token);

  // --- 1. List budgets ----------------------------------------------------
  let budgetId = null;

  group('List budgets', () => {
    const res = http.get(`${BASE_URL}/api/budgets?page=0&size=20`, {
      headers,
      tags: { name: 'GET /api/budgets' },
    });

    budgetListDuration.add(res.timings.duration);

    const ok = check(res, {
      'list budgets: status 200': (r) => r.status === 200,
      'list budgets: success': (r) => {
        try { return JSON.parse(r.body).success === true; } catch (_) { return false; }
      },
    });

    financeErrorRate.add(!ok);

    // Extract a budget ID for the detail request
    if (ok) {
      try {
        const body = JSON.parse(res.body);
        const items = body.data.content || body.data;
        if (Array.isArray(items) && items.length > 0) {
          budgetId = items[Math.floor(Math.random() * items.length)].id;
        }
      } catch (_) { /* ignore */ }
    }
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 2. Budget detail ---------------------------------------------------
  if (budgetId) {
    group('Budget detail', () => {
      const res = http.get(`${BASE_URL}/api/budgets/${budgetId}`, {
        headers,
        tags: { name: 'GET /api/budgets/{id}' },
      });

      budgetDetailDuration.add(res.timings.duration);

      const ok = check(res, {
        'budget detail: status 200': (r) => r.status === 200,
        'budget detail: has id': (r) => {
          try { return JSON.parse(r.body).data.id === budgetId; } catch (_) { return false; }
        },
        'budget detail: has name': (r) => {
          try { return !!JSON.parse(r.body).data.name; } catch (_) { return false; }
        },
      });

      financeErrorRate.add(!ok);
    });

    sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

    // --- 3. Budget items ---------------------------------------------------
    group('Budget items', () => {
      const res = http.get(`${BASE_URL}/api/budgets/${budgetId}/items`, {
        headers,
        tags: { name: 'GET /api/budgets/{id}/items' },
      });

      const ok = check(res, {
        'budget items: status 200': (r) => r.status === 200,
      });

      financeErrorRate.add(!ok);
    });

    sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);
  }

  // --- 4. List invoices ---------------------------------------------------
  group('List invoices', () => {
    const res = http.get(`${BASE_URL}/api/invoices?page=0&size=20`, {
      headers,
      tags: { name: 'GET /api/invoices' },
    });

    invoiceListDuration.add(res.timings.duration);

    const ok = check(res, {
      'list invoices: status 200': (r) => r.status === 200,
      'list invoices: success': (r) => {
        try { return JSON.parse(r.body).success === true; } catch (_) { return false; }
      },
    });

    financeErrorRate.add(!ok);
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 5. Budget summary --------------------------------------------------
  group('Budget summary', () => {
    const res = http.get(`${BASE_URL}/api/budgets/summary`, {
      headers,
      tags: { name: 'GET /api/budgets/summary' },
    });

    budgetSummaryDuration.add(res.timings.duration);

    const ok = check(res, {
      'budget summary: status 200': (r) => r.status === 200,
    });

    financeErrorRate.add(!ok);
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);

  // --- 6. Invoice summary -------------------------------------------------
  group('Invoice summary', () => {
    const res = http.get(`${BASE_URL}/api/invoices/summary`, {
      headers,
      tags: { name: 'GET /api/invoices/summary' },
    });

    const ok = check(res, {
      'invoice summary: status 200': (r) => r.status === 200,
    });

    financeErrorRate.add(!ok);
  });

  sleep(Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN) + THINK_TIME_MIN);
}

// ---------------------------------------------------------------------------
// Default export
// ---------------------------------------------------------------------------

export default function (data) {
  financeScenario(data.token);
}
