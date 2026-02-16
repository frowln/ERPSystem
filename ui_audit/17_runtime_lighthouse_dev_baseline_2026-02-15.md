# Runtime Lighthouse Dev Baseline (2026-02-15)

Context:
- Target runtime: Docker dev stack (`frontend:13000`, `backend:18080`)
- Tooling: Lighthouse CLI in Playwright container
- Chrome path: `/ms-playwright/chromium-1208/chrome-linux/chrome`
- Mode: dev server (not production build)

## Route Metrics

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TTI | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 46 | 92 | 78 | 91 | 13.2s | 23.5s | 23.5s | 400ms |
| `/projects` | 53 | 92 | 78 | 91 | 13.3s | 23.4s | 23.4s | 150ms |
| `/mobile/dashboard` | 49 | 92 | 78 | 91 | 13.2s | 23.3s | 23.3s | 300ms |
| `/operations/work-orders/1` | 54 | 92 | 78 | 91 | 13.0s | 23.2s | 23.2s | 130ms |

## Raw Artifacts

- `ui_audit/lighthouse_home_dev.json`
- `ui_audit/lighthouse_projects_dev.json`
- `ui_audit/lighthouse_mobile_dashboard_dev.json`
- `ui_audit/lighthouse_workorder_dev.json`

## Notes

- These measurements are useful as a runtime baseline trend signal, but not yet production-grade bundle evidence.
- Performance values are materially impacted by dev/HMR runtime and broad frontend TypeScript/build debt.
- Next step is a production Lighthouse baseline after bundle/build stabilization on critical routes.
