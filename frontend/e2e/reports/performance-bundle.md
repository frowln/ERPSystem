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

