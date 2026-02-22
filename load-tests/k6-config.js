// =============================================================================
// PRIVOD NEXT -- k6 Load Testing Shared Configuration
// =============================================================================

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
export const API_URL = `${BASE_URL}/api`;

// Default test credentials (DataInitializer seeds this admin user)
export const TEST_USER = {
  email: __ENV.TEST_EMAIL || 'admin@privod.ru',
  password: __ENV.TEST_PASSWORD || 'admin123',
};

// ---------------------------------------------------------------------------
// Global thresholds
// ---------------------------------------------------------------------------
export const thresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],
  http_req_failed: ['rate<0.01'],
  http_reqs: ['rate>10'],
};

// ---------------------------------------------------------------------------
// Staged load profiles
// ---------------------------------------------------------------------------
export const stages = {
  smoke: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '30s', target: 0 },
  ],
  load: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  stress: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 0 },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the stage array for the chosen scenario.
 * Usage: `k6 run -e SCENARIO=load scenarios/auth.js`
 */
export function getStages() {
  const scenario = (__ENV.SCENARIO || 'smoke').toLowerCase();
  return stages[scenario] || stages.smoke;
}

/**
 * Build an Authorization header object from a JWT access token.
 */
export function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Build headers for JSON POST/PUT without auth.
 */
export function jsonHeaders() {
  return {
    headers: {
      'Content-Type': 'application/json',
    },
  };
}
