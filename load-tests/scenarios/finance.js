// =============================================================================
// PRIVOD NEXT -- k6 Finance Scenario
// Tests: budgets list/detail/items, invoices list, payments list, budget item creation
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
const financeListDuration = new Trend('finance_list_duration', true);
const financeListFailRate = new Rate('finance_list_fail_rate');

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------
export const options = {
  stages: getStages(),
  thresholds: {
    ...globalThresholds,
    finance_list_duration: ['p(95)<500'],
    finance_list_fail_rate: ['rate<0.01'],
  },
};

// ---------------------------------------------------------------------------
// Setup: login once
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
  let firstBudgetId = null;

  // ----- Group 1: List budgets -----
  group('List budgets', () => {
    const res = http.get(
      `${API_URL}/budgets?page=0&size=20`,
      authHeaders(token),
    );

    financeListDuration.add(res.timings.duration);

    const ok = check(res, {
      'budgets list status is 200': (r) => r.status === 200,
      'budgets list returns page data': (r) => {
        const body = r.json();
        return body.data && typeof body.data.totalElements === 'number';
      },
    });

    financeListFailRate.add(!ok);

    // Grab the first budget ID for subsequent requests
    if (res.status === 200) {
      const content = res.json().data.content;
      if (content && content.length > 0) {
        firstBudgetId = content[0].id;
      }
    }
  });

  sleep(1);

  // ----- Group 2: Budget summary -----
  group('Budget summary', () => {
    const res = http.get(
      `${API_URL}/budgets/summary`,
      authHeaders(token),
    );

    check(res, {
      'budget summary status is 200': (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // ----- Group 3: Get single budget detail -----
  group('Get budget detail', () => {
    if (!firstBudgetId) return;

    const res = http.get(
      `${API_URL}/budgets/${firstBudgetId}`,
      authHeaders(token),
    );

    check(res, {
      'budget detail status is 200': (r) => r.status === 200,
      'budget detail returns id': (r) => {
        const body = r.json();
        return body.data && body.data.id;
      },
    });
  });

  sleep(0.5);

  // ----- Group 4: Get budget items -----
  group('Get budget items', () => {
    if (!firstBudgetId) return;

    const res = http.get(
      `${API_URL}/budgets/${firstBudgetId}/items`,
      authHeaders(token),
    );

    check(res, {
      'budget items status is 200': (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // ----- Group 5: Create budget item -----
  group('Create budget item', () => {
    if (!firstBudgetId) return;

    const payload = JSON.stringify({
      name: `k6 Load Test Item ${__VU}-${__ITER}-${Date.now()}`,
      category: 'MATERIALS',
      itemType: 'MATERIAL',
      quantity: 100,
      unit: 'pcs',
      costPrice: 250.00,
      estimatePrice: 300.00,
      coefficient: 1.0,
      vatRate: 20.0,
      notes: 'Created by k6 load test — safe to delete',
    });

    const res = http.post(
      `${API_URL}/budgets/${firstBudgetId}/items`,
      payload,
      authHeaders(token),
    );

    check(res, {
      'create item status is 201 or 200': (r) =>
        r.status === 201 || r.status === 200,
    });
  });

  sleep(0.5);

  // ----- Group 6: List invoices -----
  group('List invoices', () => {
    const res = http.get(
      `${API_URL}/invoices?page=0&size=20`,
      authHeaders(token),
    );

    financeListDuration.add(res.timings.duration);

    const ok = check(res, {
      'invoices list status is 200': (r) => r.status === 200,
    });

    financeListFailRate.add(!ok);
  });

  sleep(0.5);

  // ----- Group 7: Invoice summary -----
  group('Invoice summary', () => {
    const res = http.get(
      `${API_URL}/invoices/summary`,
      authHeaders(token),
    );

    check(res, {
      'invoice summary status is 200': (r) => r.status === 200,
    });
  });

  sleep(0.5);

  // ----- Group 8: List payments -----
  group('List payments', () => {
    const res = http.get(
      `${API_URL}/payments?page=0&size=20`,
      authHeaders(token),
    );

    financeListDuration.add(res.timings.duration);

    const ok = check(res, {
      'payments list status is 200': (r) => r.status === 200,
    });

    financeListFailRate.add(!ok);
  });

  sleep(0.5);

  // ----- Group 9: Payment summary -----
  group('Payment summary', () => {
    const res = http.get(
      `${API_URL}/payments/summary`,
      authHeaders(token),
    );

    check(res, {
      'payment summary status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}
