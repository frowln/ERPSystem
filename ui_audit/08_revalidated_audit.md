# Revalidated UX/UI + Frontend Audit (2026-02-15)

## Scope and method

- Sources: `frontend/src` (code), `frontend/e2e` (tests), router/layout/design-system modules.
- Runtime checks attempted against `http://127.0.0.1:13000` and `http://127.0.0.1:18080`.
- Environment note: backend endpoint returned `connection refused`; Docker daemon commands timed out during this pass. Live browser perf/Lighthouse could not be fully re-measured in this run.

## UI inventory (current snapshot from code)

- Route entries in router: **318** (`<Route path="...">` in `frontend/src/routes/index.tsx`).
- Navigation groups in sidebar: **18**, items: **167** (`frontend/src/design-system/components/Sidebar/index.tsx`).
- Core happy paths are present in routes:
  - `/projects/new` -> `/procurement/new` -> `/warehouse/movements/new` -> `/payments/new`
  - `/contracts/new` -> `/workflow/templates` -> `/ks2` -> `/ks3`
  - `/quality` -> `/punchlist/items` -> `/regulatory/permits`
  - `/mobile/reports` -> `/mobile/reports/new` -> `/mobile/photos`

## Revalidated status of previously reported issues

### Confirmed fixed since previous audit

- Global TopBar search **is wired** to `/search` on Enter (`frontend/src/design-system/components/TopBar/index.tsx`).
- Workflow links use `/workflow/templates` (no obsolete `/workflows` in designer/instance pages).
- `Button` supports `outline` variant (`frontend/src/design-system/components/Button/index.tsx`).
- Unknown route now renders `NotFoundPage` (`frontend/src/routes/index.tsx` + `frontend/src/pages/NotFoundPage.tsx`).
- Login page labels/password toggle accessibility improved (`frontend/src/modules/auth/LoginPage.tsx`).
- `DataTable` added row keyboard support + caption + checkbox labels (`frontend/src/design-system/components/DataTable/index.tsx`).

### Open critical/high findings (fact-based)

| ID | Severity | Area | Fact (evidence) | Repro | Fix direction |
|---|---|---|---|---|---|
| RV-001 | critical | Data integrity | `placeholderData` appears **225** times in **192** TSX files | Search `placeholderData:` across `frontend/src` | Introduce explicit demo mode flag; block transactional actions with demo data |
| RV-002 | critical | Core UX | Project/procurement/mobile flows fallback to mock datasets | Open `ProjectListPage`, `PurchaseRequestListPage`, `MobileReportsPage` code | Remove fallback in prod paths, show empty/error states instead |
| RV-003 | critical | Destructive UX | `window.confirm(` used in **31** modules | Search `window.confirm(` | Replace with DS confirm modal + undo/audit metadata |
| RV-004 | critical | Mobile workflow | "Save draft" only shows toast + navigate (`MobileReportNewPage`) | Click "Сохранить черновик" in code path | Persist draft (API/local), restore on reopen |
| RV-005 | critical | Mobile architecture | `mobileApi` write/sync methods exist but not used in UI | Search `mobileApi.` in TSX (only `getFieldReports`) | Wire `create/update/submit/sync` and offline queue |
| RV-006 | critical | Offline readiness | No service worker/offline implementation found | Search `serviceWorker/workbox/navigator.serviceWorker` | Add PWA shell + queued writes + conflict UI |
| RV-007 | high | Accessibility | Icon-only controls without names in DS surfaces (TopBar/PageHeader/Modal/DataTable/Sidebar quick signals) | Inspect button tags in DS components | Add `aria-label` for all icon-only actions |
| RV-008 | high | Accessibility | Modal title id hardcoded `modal-title` | Open `design-system/components/Modal` | Generate unique IDs per instance |
| RV-009 | high | Accessibility | Modal focuses container but lacks focus loop trap | Keyboard tab cycle in modal logic | Add focus trap sentinels + restore trigger focus |
| RV-010 | high | Accessibility | `DataTable` headers lack explicit `scope` and `aria-sort` | Inspect `<th>` rendering in `DataTable` | Add semantic header attributes |
| RV-011 | high | Product maturity | `/documents` still points to placeholder page | Router maps to `pages/placeholders/DocumentListPage` | Replace with production module page |
| RV-012 | high | QA | Component tests in `src`: **0** files | Glob `**/*.{test,spec}.{ts,tsx}` in `frontend/src` | Add DS and critical page component tests |
| RV-013 | high | QA | Visual regression assertions: **0** (`toHaveScreenshot`) | Search in `frontend/e2e` | Add viewport baselines for critical routes |
| RV-014 | high | QA drift | Smoke test expects unknown route redirect to `/`, but app has `NotFoundPage` | `navigation.spec.ts` vs router | Update tests to current product behavior |
| RV-015 | high | IA/credibility | Sidebar counters hardcoded (`badge: 3`, `badge: 5`) | Inspect sidebar nav config | Feed counters from API/query state |
| RV-016 | high | IA/credibility | TopBar notification dot is static | `TopBar` renders fixed dot element | Replace with real unread state + empty state |
| RV-017 | high | i18n | TSX files importing `@/i18n`: **0** | Search imports in `frontend/src` | Start incremental message externalization |
| RV-018 | high | i18n/format | `format.ts` hardcodes `ru-RU` and `ru` locale | Inspect formatter utilities | Use active locale from i18n context |
| RV-019 | high | Forms A11y | Many forms use raw `<label>` + `Input` without explicit id/htmlFor coupling | Example: `WorkflowDesignerPage` | Enforce labeled control contract (lint + DS helper) |
| RV-020 | high | Performance | DataTable renders full row model client-side | Inspect `DataTable` row model setup | Add server paging + virtual rows for large datasets |
| RV-021 | high | Performance | No virtualization library usage detected | Search `react-virtual`, `react-window` | Add virtualization in heavy tables |
| RV-022 | high | Performance | Chunk splitting is coarse (`vendor/charts/table/query`) | `frontend/vite.config.ts` manualChunks | Split by route-domain chunks and heavy editors/charts |
| RV-023 | high | UX correctness | "Удалить" action in projects sets status `CANCELLED` | `ProjectListPage` mutation | Rename action or perform real deletion semantics |
| RV-024 | high | Search UX | Global search falls back to mock results | `GlobalSearchPage` mock fallback logic | Separate demo/search-fallback path; clearly indicate source |
| RV-025 | medium | Enterprise UX | Saved views/presets not implemented | No saved-view feature in lists | Add per-user saved filters/sorts/columns |
| RV-026 | medium | Enterprise UX | No autosave in long forms (projects/procurement/warehouse/payments) | Inspect form pages | Add shared autosave SDK and conflict handling |
| RV-027 | medium | IA | Sidebar has 167 items without role-based simplification | Sidebar config | Introduce role-based navigation presets |
| RV-028 | medium | IA | TopBar search is plain redirect, not command palette/object actions | `TopBar` behavior | Add command palette with recent entities/actions |
| RV-029 | medium | Accessibility | Notification icon button has no `aria-label` | `TopBar` button | Add labels/tooltips consistently |
| RV-030 | medium | Accessibility | Back icon button in `PageHeader` has no `aria-label` | `PageHeader` back button | Add semantic label |
| RV-031 | medium | Accessibility | Modal close icon button has no `aria-label` | `Modal` close button | Add `aria-label="Закрыть"` |
| RV-032 | medium | Accessibility | DataTable toolbar icon actions rely on `title` only | DataTable toolbar buttons | Add `aria-label` + keyboard hints |
| RV-033 | medium | QA | E2E mostly smoke/visibility checks, little business outcome validation | Inspect `e2e/smoke/*.spec.ts` | Add transactional assertions (create/update/state transitions) |
| RV-034 | medium | DX/quality gates | Playwright config assumes local `npm run dev` on `localhost:3000` (host has no Node) | `e2e/playwright.config.ts` | Add docker-compatible test profile and baseURL matrix |

## Release roadmap (3 releases)

### R1 - Stabilize trust (2-4 weeks)

1. **Real data over mock fallback**
   - Scope: RV-001, RV-002, RV-024.
   - Acceptance:
     - No transactional page mutates mock state in production mode.
     - UI shows explicit `loading/empty/error` states from API outcomes.
   - Code touchpoints: `frontend/src/modules/**/ListPage.tsx`, `GlobalSearchPage.tsx`, query wrappers.

2. **Safe destructive actions**
   - Scope: RV-003, RV-023.
   - Acceptance:
     - No `window.confirm(` in `frontend/src`.
     - DS confirmation modal used with object summary + irreversible-warning copy.
   - Code touchpoints: 31 affected module pages + shared modal action helper.

3. **Critical accessibility baseline**
   - Scope: RV-007..RV-010, RV-029..RV-032.
   - Acceptance:
     - Icon-only controls have accessible names.
     - Modal IDs unique and keyboard focus trap validated.
     - DataTable headers expose sort semantics.
   - Code touchpoints: `TopBar`, `PageHeader`, `Modal`, `DataTable`, `Sidebar`.

4. **Mobile draft correctness**
   - Scope: RV-004, RV-005, RV-006.
   - Acceptance:
     - Draft save creates persisted draft entity.
     - Reopen restores draft with timestamp.
     - Offline queue and retry status visible.
   - Code touchpoints: `modules/mobile/*`, `api/mobile.ts`.

### R2 - Enterprise productivity (4-6 weeks)

5. **Large-table performance architecture**
   - Scope: RV-020, RV-021, RV-022.
   - Acceptance:
     - Server pagination for high-volume pages.
     - Virtualized rendering enabled on target datasets.
     - Route-level JS budget defined and checked in CI.
   - Code touchpoints: `DataTable`, list APIs, `vite.config.ts`.

6. **Localization readiness**
   - Scope: RV-017, RV-018.
   - Acceptance:
     - At least top workflows externalized to i18n dictionaries.
     - Formatting uses active locale provider, no hardcoded locale in shared formatters.
   - Code touchpoints: `i18n`, `lib/format.ts`, top 20 most-used pages.

7. **Power-user list ergonomics**
   - Scope: RV-025, RV-026.
   - Acceptance:
     - Saved views per user with default pinning.
     - Autosave enabled on long forms with stale draft reconciliation.
   - Code touchpoints: query state persistence layer, form pages.

8. **Navigation simplification**
   - Scope: RV-027, RV-028, RV-015, RV-016.
   - Acceptance:
     - Role presets reduce visible nav volume.
     - Search/command palette opens entities and actions.
     - Notification/badge values are API-driven and resilient to failures.
   - Code touchpoints: `Sidebar`, `TopBar`, search module, auth role mapping.

### R3 - Best-in-class polish (6-8 weeks)

9. **QA maturity uplift**
   - Scope: RV-012, RV-013, RV-014, RV-033, RV-034.
   - Acceptance:
     - Component tests cover DS primitives and critical forms/tables.
     - Visual baselines exist for key routes and 320/768/1440/1920 viewports.
     - E2E covers end-to-end business paths with state assertions.
     - Test profile supports docker-first local/dev/CI topology.
   - Code touchpoints: `frontend/e2e`, `frontend/src`, CI pipeline config.

10. **Placeholder debt retirement**
    - Scope: RV-011 and remaining placeholder modules.
    - Acceptance:
      - `/documents` and other placeholder entry points replaced by production modules.
      - 0 placeholder routes on critical navigation paths.
    - Code touchpoints: `routes/index.tsx`, `pages/placeholders/*`, module pages.

## Updated verdict

- **Best design 2026/2027: NOT ACHIEVED (current state).**
- Main blockers:
  - Real-data trust gap (mock/placeholder fallback in transactional surface).
  - Accessibility baseline gaps in shared components.
  - Performance architecture not yet ready for long, dense enterprise datasets.
  - QA depth insufficient for preventing visual/behavioral regressions.
- Path to best-in-class exists and is actionable through R1-R3 above.

---

## Addendum (2026-02-16) — metrics re-check + key corrections

This addendum exists because several counters in the tables above were stale vs the current repository state.

### What changed since this doc was written (facts from repo)

- Routes: **321** `<Route path=...>` entries across `frontend/src/routes/*.tsx` (not 318).
- `placeholderData:`: **107** occurrences in **86** files (not 225/192).
- `window.confirm(`: **0** matches in `frontend/src` (not 31).
- i18n: **33** TSX files import `@/i18n` (not 0). Still far from full adoption.
- Frontend tests in `frontend/src`: **14** files (not 0). Coverage depth still insufficient for DS+critical flows.
- Visual regression: `toHaveScreenshot(` calls = **1** (exists, but not enough to act as a quality gate).
- Offline/PWA: service worker registration exists (`frontend/src/main.tsx`) and `public/sw.js` implements basic app-shell caching.

### One critical functional fix applied while auditing

- `frontend/src/api/client.ts`: response interceptor previously checked `'SUCCESS' in response.data` which does not match backend `ApiResponse<T>` (`success` boolean).
- Fixed to check `'success' in response.data`, so `ApiResponse` unwrapping now works correctly for all API modules using `apiClient`.

### Updated interpretation of the key blockers

- The **trust gap** remains, but it is more precise to say: `placeholderData` is still widely used in detail/forms and some pages, and it must be constrained to explicit demo mode (never silent fallback).
- The **destructive confirmation** blocker is **resolved in code** (no `window.confirm`), but the UX still needs consistency and audit-friendly copy patterns.
- The **offline** blocker is **partially** addressed (SW exists), but it is not yet “field-grade offline-first” (no API caching strategy, conflict UI, and deterministic sync UX across domains).

### Canonical report

If you need the single consolidated report (Parts I–VII in one document), use:

- `ui_audit/20_full_audit_report_ru.md`
