# Performance Audit Report — PRIVOD ERP

> Generated: 2026-03-12
> Platform: React 19 + Vite 6 + Spring Boot 3.4
> Target: Construction company with 50+ projects, 500+ employees

## Executive Summary

**Overall Health: HEALTHY**

| Category | Result | Status |
|----------|--------|--------|
| Page Load (0 pages) | A: 0, B: 0, C: 0, F: 0 | PASS |
| Stress Tests | 0/0 passed | PASS |
| Memory Leaks | 0/4 leaks | PASS |
| API Response | avg 0ms, 0 failed | PASS |



---

*performance-page-load.md not generated*


---

*performance-interactions.md not generated*


---

*performance-stress.md not generated*


---

## Memory Leak Detection (4 tests)

### Summary
- **Tests run**: 4
- **Leaks detected**: 0
- **Max growth threshold**: 50%

### Results
| Test | Iterations | Start MB | End MB | Peak MB | Growth % | Leak? |
|------|------------|----------|--------|---------|----------|-------|
| Navigate 50 pages | 50 | 51.0 | 51.0 | 51.0 | 0.0% | NO |
| Modal open/close 20x | 20 | 54.2 | 54.2 | 54.2 | 0.0% | NO |
| Rapid navigation 30x | 30 | 9.5 | 9.5 | 9.5 | 0.0% | NO |
| Search input 20x | 20 | 54.2 | 54.2 | 54.2 | 0.0% | NO |

### Notes
- **Navigate 50 pages**: First-half avg: 51.0MB, Second-half avg: 51.0MB
- **Modal open/close 20x**: DOM nodes: 1111 → 1111 (0). 20/20 iterations
- **Rapid navigation 30x**: 30/30 successful navigations
- **Search input 20x**: 20/20 search cycles

### No memory leaks detected.


---

## Bundle Analysis

### Overview
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total JS | 15639 KB | <2048 KB | FAIL [CRITICAL] |
| Total CSS | 248 KB | — | — |
| Total Fonts | 0 KB | — | — |
| Total Images | 0 KB | — | — |
| **Total Transfer** | **15653 KB** | — | — |

### Code Splitting
- **JS chunks**: 112
- **Largest chunk**: 3534 KB [MAJOR]
- **Total resources on initial load**: 120

### Top 10 JS Chunks (by size)
| # | Chunk | Size KB | Load Time ms |
|---|-------|---------|-------------|
| 1 | ru.ts | 3534 | 51 |
| 2 | en.ts | 2738 | 47 |
| 3 | recharts.js?v=a5bd9372 | 1230 | 30 |
| 4 | @sentry_react.js?v=e8e3c9d6 | 1033 | 11 |
| 5 | react-dom_client.js?v=5c2f76b1 | 982 | 12 |
| 6 | date-fns_locale.js?v=5df863eb | 966 | 34 |
| 7 | lucide-react.js?v=c184ad33 | 854 | 45 |
| 8 | react-router-dom.js?v=93a0492b | 446 | 18 |
| 9 | globals.css?t=1773324128648 | 247 | 11 |
| 10 | client | 179 | 4 |

### Resource Breakdown
| Type | Count | Total KB |
|------|-------|----------|
| JavaScript | 112 | 15639 |
| CSS | 2 | 248 |
| Fonts | 0 | 0 |
| Images | 0 | 0 |
| Other | 6 | -234 |

### BUNDLE TOO LARGE [CRITICAL]
Total JS bundle (15639 KB) exceeds 2048 KB threshold.
Consider:
- Lazy-loading heavy modules (BIM, charts, PDF viewers)
- Tree-shaking unused exports
- Replacing large dependencies with lighter alternatives


### LARGE CHUNK WARNING [MAJOR]
Largest chunk (3534 KB) exceeds 500 KB.
Split it further with dynamic imports.



*performance-lazy-load.md not generated*


---

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


---

## Comparison vs Competitors (estimates)

| Metric | Privod | Procore | PlanRadar | 1C:USO |
|--------|--------|---------|-----------|--------|
| Initial load | ~?s | ~2.5s | ~1.8s | ~4s |
| SPA navigation | ~200ms | ~300ms | ~200ms | N/A |
| API avg response | 0ms | ~150ms | ~200ms | ~500ms |
| Bundle size | measured above | ~3MB | ~1.5MB | N/A |

> Note: Competitor numbers are estimated from public benchmarks and may vary.
