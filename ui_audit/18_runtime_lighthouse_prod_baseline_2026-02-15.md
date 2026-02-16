# Runtime Lighthouse Production Baseline (2026-02-15)

Context:
- Target runtime: production preview from built bundle (`vite preview` in Docker, port `13001`)
- Tooling: Lighthouse CLI in Playwright container
- Chrome path: `/ms-playwright/chromium-1208/chrome-linux/chrome`
- Mode: production artifact (no dev/HMR overhead)

## Route Metrics

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TTI | TBT | Speed Index |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 83 | 92 | 78 | 91 | 3.41s | 3.52s | 3.52s | 0ms | 3.41s |
| `/projects` | 80 | 92 | 78 | 91 | 3.49s | 3.72s | 3.72s | 0ms | 4.68s |
| `/mobile/dashboard` | 82 | 92 | 78 | 91 | 3.36s | 3.48s | 3.48s | 0ms | 4.62s |
| `/operations/work-orders/1` | 83 | 92 | 78 | 91 | 3.48s | 3.57s | 3.57s | 0ms | 3.48s |

## Raw Artifacts

- `ui_audit/lighthouse_home_prod.json`
- `ui_audit/lighthouse_projects_prod.json`
- `ui_audit/lighthouse_mobile_dashboard_prod.json`
- `ui_audit/lighthouse_workorder_prod.json`

## Notes

- Production baseline shows expected improvement over dev runtime baseline from `ui_audit/17_runtime_lighthouse_dev_baseline_2026-02-15.md`.
- Main optimization candidates from bundle output remain route-level heavy chunks (`charts`, `index`, `types`, `table`).
- This closes the production Lighthouse baseline blocker for perf governance on critical routes.
