# Implementation Playbook (Top Critical Fixes)

## 1) Remove hidden mock fallback on transactional pages

### Goal

Do not show synthetic data as if it were real backend data on critical ERP routes.

### Where to change

- `frontend/src/modules/projects/ProjectListPage.tsx`
- `frontend/src/modules/procurement/PurchaseRequestListPage.tsx`
- `frontend/src/modules/mobile/MobileReportsPage.tsx`
- Similar pattern across modules with `placeholderData` and `mock*` arrays.

### How

1. Introduce `isDemoMode` flag in a shared app config/store.
2. Keep `placeholderData` only for skeleton continuity, not for semantic fallback.
3. Replace logic:
   - from: `apiData?.content?.length > 0 ? apiData.content : mockData`
   - to:
     - `apiData?.content ?? []` in normal mode,
     - explicit mock branch only when `isDemoMode === true`.
4. In non-demo mode render:
   - loading state,
   - empty state,
   - error/retry state.
5. For transactional actions (`create/update/delete`), disable in demo mode and show explanation banner.

### Acceptance

- No implicit mock fallback on critical routes.
- User always understands data source (real vs demo).

---

## 2) Replace unsafe destructive confirmation flow

### Goal

Eliminate native `window.confirm` and standardize enterprise-safe confirmations.

### Where to change

- 31 modules currently using `window.confirm`, including:
  - `frontend/src/modules/projects/ProjectListPage.tsx`
  - `frontend/src/modules/contracts/ContractListPage.tsx`
  - `frontend/src/modules/rfi/RfiListPage.tsx`
  - `frontend/src/modules/warehouse/MovementDetailPage.tsx`
  - and others from `10_findings_revalidated.csv` (`RV-004`).

### How

1. Add reusable `ConfirmDialog` in design system:
   - title, description,
   - list of affected objects,
   - explicit destructive button style,
   - optional typed confirmation for bulk operations.
2. Replace each `window.confirm` usage with DS modal flow.
3. Include action context in mutation payload (for backend audit logging where available).
4. Add optional undo snackbar for reversible operations.

### Acceptance

- `window.confirm(` absent from `frontend/src`.
- All destructive actions use one consistent dialog component.

---

## 3) Harden modal and shared A11y baseline

### Goal

Reach WCAG 2.2 AA baseline in shared DS components used across the app.

### Where to change

- `frontend/src/design-system/components/Modal/index.tsx`
- `frontend/src/design-system/components/TopBar/index.tsx`
- `frontend/src/design-system/components/PageHeader/index.tsx`
- `frontend/src/design-system/components/DataTable/index.tsx`
- `frontend/src/design-system/components/Sidebar/index.tsx`

### How

1. `Modal`:
   - generate unique `titleId`/`descriptionId`,
   - set `aria-labelledby`/`aria-describedby`,
   - add robust focus trap loop (Tab/Shift+Tab),
   - restore focus to opener on close,
   - set close button `aria-label`.
2. Icon-only controls in DS:
   - require explicit `aria-label`.
3. `DataTable`:
   - add `scope="col"` for header cells,
   - map sort state to `aria-sort`,
   - ensure toolbar icon actions have aria labels.

### Acceptance

- Shared components pass keyboard + screen reader smoke checks.
- No icon-only control without accessible name in DS core.

---

## 4) Implement real mobile draft + offline queue

### Goal

Field users can save and submit reports reliably with intermittent connectivity.

### Where to change

- `frontend/src/modules/mobile/MobileReportNewPage.tsx`
- `frontend/src/modules/mobile/MobileReportsPage.tsx`
- `frontend/src/api/mobile.ts`
- App shell/service worker integration.

### How

1. Use `mobileApi.createFieldReport` for draft creation.
2. Save draft ID locally and support reopen/edit.
3. Add submit path via `mobileApi.submitFieldReport`.
4. Add offline queue:
   - enqueue writes while offline,
   - sync on reconnect,
   - show status per report (`pending/synced/error`).
5. Resolve conflicts with explicit user choice (keep local vs server version).

### Acceptance

- Draft survives reload and reconnect.
- Offline writes are visible, recoverable, and eventually synced.

---

## 5) Establish QA gates that protect dense enterprise UI

### Goal

Prevent design and behavior regressions before release.

### Where to change

- `frontend/e2e/playwright.config.ts`
- `frontend/e2e/smoke/*.spec.ts`
- New visual test suite and critical path suite
- New component tests in `frontend/src/**`

### How

1. Add visual regression specs with baseline screenshots:
   - critical routes,
   - viewports: 320 / 768 / 1440 / 1920.
2. Extend e2e from smoke to business outcomes:
   - project -> procurement -> movement -> payment flow.
3. Add component tests for DS primitives and high-risk list/form pages.
4. Update Playwright runtime profile for docker-first environments (when host Node is unavailable).

### Acceptance

- CI blocks on visual, component, and critical-path regressions.
- Test suite behavior matches actual router/runtime behavior.
