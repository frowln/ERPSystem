// =============================================================================
// PRIVOD NEXT -- k6 Search Performance Scenario
// Tests: global search, autocomplete, recent searches, popular searches
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
const searchDuration = new Trend('search_duration', true);
const searchFailRate = new Rate('search_fail_rate');

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------
export const options = {
  stages: getStages(),
  thresholds: {
    ...globalThresholds,
    search_duration: ['p(95)<300'],
    search_fail_rate: ['rate<0.01'],
  },
};

// ---------------------------------------------------------------------------
// Search terms — rotate through realistic queries
// ---------------------------------------------------------------------------
const SEARCH_QUERIES = [
  'project',
  'budget',
  'invoice',
  'safety',
  'material',
  'concrete',
  'report',
  'contract',
  'inspection',
  'schedule',
];

const AUTOCOMPLETE_PREFIXES = [
  'pro',
  'bud',
  'inv',
  'saf',
  'mat',
  'con',
  'rep',
  'sch',
];

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

  // Pick a search term based on VU and iteration to distribute queries
  const queryIndex = (__VU + __ITER) % SEARCH_QUERIES.length;
  const query = SEARCH_QUERIES[queryIndex];
  const prefixIndex = (__VU + __ITER) % AUTOCOMPLETE_PREFIXES.length;
  const prefix = AUTOCOMPLETE_PREFIXES[prefixIndex];

  // ----- Group 1: Global full-text search -----
  group('Global search', () => {
    const res = http.get(
      `${API_URL}/search?query=${encodeURIComponent(query)}&page=0&size=20`,
      authHeaders(token),
    );

    searchDuration.add(res.timings.duration);

    const ok = check(res, {
      'search status is 200': (r) => r.status === 200,
      'search returns page data': (r) => {
        const body = r.json();
        return body.data && typeof body.data.totalElements === 'number';
      },
    });

    searchFailRate.add(!ok);
  });

  sleep(0.5);

  // ----- Group 2: Search with entity type filter -----
  group('Search with entity filter', () => {
    const res = http.get(
      `${API_URL}/search?query=${encodeURIComponent(query)}&entityType=PROJECT&page=0&size=10`,
      authHeaders(token),
    );

    searchDuration.add(res.timings.duration);

    const ok = check(res, {
      'filtered search status is 200': (r) => r.status === 200,
    });

    searchFailRate.add(!ok);
  });

  sleep(0.5);

  // ----- Group 3: Search with smaller page size -----
  group('Search with small page', () => {
    const res = http.get(
      `${API_URL}/search?query=${encodeURIComponent(query)}&page=0&size=5`,
      authHeaders(token),
    );

    searchDuration.add(res.timings.duration);

    const ok = check(res, {
      'small page search status is 200': (r) => r.status === 200,
    });

    searchFailRate.add(!ok);
  });

  sleep(0.5);

  // ----- Group 4: Autocomplete -----
  group('Autocomplete', () => {
    const res = http.get(
      `${API_URL}/search/autocomplete?prefix=${encodeURIComponent(prefix)}`,
      authHeaders(token),
    );

    searchDuration.add(res.timings.duration);

    const ok = check(res, {
      'autocomplete status is 200': (r) => r.status === 200,
      'autocomplete returns array': (r) => {
        const body = r.json();
        return body.data && Array.isArray(body.data);
      },
    });

    searchFailRate.add(!ok);
  });

  sleep(0.5);

  // ----- Group 5: Recent searches -----
  group('Recent searches', () => {
    const res = http.get(
      `${API_URL}/search/recent`,
      authHeaders(token),
    );

    check(res, {
      'recent searches status is 200': (r) => r.status === 200,
      'recent searches returns array': (r) => {
        const body = r.json();
        return body.data && Array.isArray(body.data);
      },
    });
  });

  sleep(0.5);

  // ----- Group 6: Popular searches -----
  group('Popular searches', () => {
    const res = http.get(
      `${API_URL}/search/popular`,
      authHeaders(token),
    );

    check(res, {
      'popular searches status is 200': (r) => r.status === 200,
      'popular searches returns array': (r) => {
        const body = r.json();
        return body.data && Array.isArray(body.data);
      },
    });
  });

  sleep(1);
}
