## API Response Time Analysis

### Overview
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total API calls | 207 | — | — |
| Valid (with timing) | 0 | — | — |
| Average response | 0ms | <300ms | PASS |
| P95 response | 0ms | <1000ms | PASS |
| Slow (>1s) | 0 | 0 | PASS |
| Failed (>5s) | 0 | 0 | PASS |
| HTTP errors (4xx/5xx) | 7 | — | WARN |

### Response Time Grade Distribution
| Grade | Count | Percentage |
|-------|-------|------------|
| A (<100ms) | 0 | 0% |
| B (<300ms) | 0 | 0% |
| C (<1s) | 0 | 0% |
| F (>5s) | 0 | 0% |

### Top 10 Most-Called Endpoints
| Endpoint | Calls | Avg ms | Max ms | Errors |
|----------|-------|--------|--------|--------|
| GET http://localhost:4000/src/api/client.ts | 31 | 0 | 0 | 0 |
| GET http://localhost:4000/src/api/notifications.ts | 31 | 0 | 0 | 0 |
| GET http://localhost:4000/api/notifications/unread-count | 31 | 0 | 0 | 0 |
| GET http://localhost:4000/api/auth/me/permissions | 11 | 0 | 0 | 3 |
| GET http://localhost:4000/src/api/projects.ts | 7 | 0 | 0 | 0 |
| GET http://localhost:4000/api/projects | 6 | 0 | 0 | 0 |
| GET http://localhost:4000/src/api/finance.ts | 5 | 0 | 0 | 0 |
| GET http://localhost:4000/src/api/hr.ts | 4 | 0 | 0 | 0 |
| GET http://localhost:4000/api/support/tickets/tickets | 4 | 0 | 0 | 4 |
| GET http://localhost:4000/api/admin/users | 3 | 0 | 0 | 0 |

### Top 10 Slowest Endpoints
| Endpoint | Max ms | Calls | Avg ms | Grade |
|----------|--------|-------|--------|-------|
| GET http://localhost:4000/src/api/projects.ts | 0 | 7 | 0 | A |
| GET http://localhost:4000/src/api/analytics.ts | 0 | 2 | 0 | A |
| GET http://localhost:4000/src/api/client.ts | 0 | 31 | 0 | A |
| GET http://localhost:4000/src/api/notifications.ts | 0 | 31 | 0 | A |
| GET http://localhost:4000/api/analytics/dashboard | 0 | 1 | 0 | A |
| GET http://localhost:4000/api/analytics/dashboard/safety | 0 | 1 | 0 | A |
| GET http://localhost:4000/api/analytics/dashboard/tasks | 0 | 1 | 0 | A |
| GET http://localhost:4000/api/projects/dashboard/summary | 0 | 1 | 0 | A |
| GET http://localhost:4000/api/analytics/dashboard/financial | 0 | 1 | 0 | A |
| GET http://localhost:4000/api/projects | 0 | 6 | 0 | A |

### HTTP Errors
| Method | URL | Status |
|--------|-----|--------|
| GET | http://localhost:4000/api/auth/me/permissions | 429 |
| GET | http://localhost:4000/api/support/tickets/tickets | 400 |


### All API calls within threshold.
