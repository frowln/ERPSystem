# PRIVOD Platform — Autopilot Instructions

## Quick Reference
- **Frontend**: `cd frontend` — React 19 + TypeScript 5.7 + Vite 6 (port 4000)
- **Backend**: `cd backend` — Java 21 + Spring Boot 3.4.1 + Gradle
- **DB**: PostgreSQL localhost:15432, database `privod2`, user `privod` / `privod_dev`
- **Flyway**: 301 migrations (V0001–V1123). Next: **V1124+**

## PATH (REQUIRED before any npm/node/gradle command)
```bash
export PATH="/Users/damirkasimov/Library/Application Support/JetBrains/IntelliJIdea2024.2/node/versions/24.11.1/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
```

## Verification Gate — run from `frontend/` BEFORE completing any task
```bash
node ./node_modules/.bin/tsc --noEmit --project tsconfig.json  # 0 errors
npx vitest run --dir src                                        # all pass
npm run build                                                   # success
```
If backend changed — from `backend/`:
```bash
export PATH="/opt/homebrew/bin:$PATH" && ./gradlew compileJava
```

## Autopilot Protocol
1. Read `.claude/current-plan.md` — see assigned tasks
2. Work through tasks top-to-bottom, mark `[x]` when done
3. Run verification gate after each logical unit of work
4. If verification fails — fix before moving on, never skip
5. Commit with conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`
6. Stop hook blocks you if unchecked tasks remain — keep working

## Architecture

### Frontend (`frontend/src/`)
| Dir | Purpose |
|-----|---------|
| `api/` | Axios API functions (client.ts has JWT interceptor) |
| `components/` | Shared components |
| `config/` | `navigation.ts`, `routePermissions.ts` |
| `design-system/` | Tokens, base UI (DataTable, FormField, StatusBadge, etc.) |
| `hooks/` | Custom React hooks |
| `i18n/` | `ru.ts` (primary) + `en.ts` (~25k lines each, must stay in sync) |
| `modules/` | ~85 feature modules (pages + types + components) |
| `routes/` | Domain route files (`projectRoutes.tsx`, `financeRoutes.tsx`, etc.) |
| `stores/` | Zustand stores |
| `types/` | Shared TypeScript types |

### Backend (`backend/src/main/java/com/privod/platform/`)
| Dir | Purpose |
|-----|---------|
| `modules/<name>/domain/` | JPA entities |
| `modules/<name>/repository/` | Spring Data repos |
| `modules/<name>/service/` | Business logic |
| `modules/<name>/web/` | REST controllers + DTOs |
| `infrastructure/` | Security, config, filters |

### Stack summary
- State: Zustand 5 + persist · Server data: TanStack React Query
- Styling: Tailwind CSS + `cn()` from `@/lib/cn` · Dark mode: `class` strategy
- Icons: Lucide React · Forms: react-hook-form + Zod
- i18n: `t(key)` from `@/i18n` · API: Axios with JWT
- RBAC: roles `ADMIN | MANAGER | ENGINEER | ACCOUNTANT | VIEWER`
- Backend: Spring Security + JWT, MapStruct + Lombok, Redis, MinIO, WebSocket STOMP

## Coding Rules

### MUST
- `t('key')` for ALL user-visible strings — both `ru.ts` AND `en.ts`
- Dark mode: `bg-white dark:bg-neutral-900`, `text-gray-900 dark:text-white`
- Use `cn()` for conditional Tailwind classes
- Use design-system components (`@/design-system/`)
- API via `src/api/` functions + React Query hooks — never raw `fetch()`
- Tests: `// @vitest-environment jsdom` directive at top of test files
- JSONB fields in backend: `@JdbcTypeCode(SqlTypes.JSON)` annotation
- New Flyway migrations: V1124+ — sequential, immutable once created

### MUST NOT
- Edit existing Flyway migrations — ever
- Modify `package.json`, `build.gradle.kts`, `docker-compose.yml` without approval
- Delete `node_modules/` without user approval (corruption risk)
- Import across modules (modules are isolated)
- Add dependencies without explicit request
- Use `console.log` in production code (only in tests)
- Touch files in `scripts/`, `deploy/`, `monitoring/`, `nginx/` unless instructed

## Testing Patterns
```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Store tests: reset in beforeEach, getState() directly
// Hook tests: renderHook() + unmount() to prevent leaks
// Mocks: vi.mock('react-router-dom', () => ({ useNavigate: vi.fn(), ... }))
```

## E2E Testing (Playwright)

### Commands (from `frontend/`)
```bash
npx playwright test --config=e2e/playwright.config.ts              # all tests
npx playwright test --config=e2e/playwright.config.ts e2e/tests/smoke/  # smoke only
npx playwright test --config=e2e/playwright.config.ts --grep "calc"     # calculations only
npx playwright test --config=e2e/playwright.config.ts --ui              # interactive UI
```

### Prerequisites
- Frontend dev server running on http://localhost:4000 (`npm run dev`)
- Backend running (Docker or local) with seeded data
- Docker containers healthy: `docker ps`

### E2E Architecture
```
e2e/
  fixtures/     — base.fixture.ts, auth.fixture.ts, api.fixture.ts, seed.fixture.ts
  pages/        — Page Object Model (BasePage + module-specific POMs)
  helpers/      — crud, calculation, rbac, form, table helpers
  tests/
    smoke/      — every page loads (Layer 1)
    crud/       — full CRUD per entity (Layer 2)
    calculations/ — every number verified (Layer 3)
    rbac/       — 5 roles × all operations (Layer 4)
    workflows/  — end-to-end business flows (Layer 5)
    edge/       — errors, empty states, large data (Layer 6)
    ux/         — dark mode, responsive, a11y, i18n (Layer 7)
  analysis/     — custom reporter, competitive scraper, metrics
  reports/      — auto-generated: improvements.md, competitive-analysis.md, coverage-matrix.md
```

### E2E Rules
- ALL test entities use `E2E-` prefix for identification/cleanup
- Use API fixture for data setup (faster than UI)
- Use UI for verification (tests what user sees)
- Every calculation must be explicitly asserted (not just screenshot)
- parseRussianNumber() for parsing `1 234 567,89` format
- Screenshot on failure is automatic (playwright.config.ts)
- Auth: `e2e/.auth/{role}.json` — one storageState file per role
- Test credentials from env vars, fallback: admin@privod.ru / admin123

### Master Plan
- Full plan: `.claude/plans/e2e-autopilot-master-plan.md`
- Session prompts: `.claude/plans/e2e-session-prompts.md`
- Financial chain spec: `.claude/plans/financial-chain-test-spec.md` (165 assertions, exact numbers)
- Business rules: `.claude/plans/business-rules-construction-erp.md` (domain expert brain)

### Domain Expert Mode
Every E2E test session must evaluate with BUSINESS SENSE, not just technical correctness.
The AI reads `business-rules-construction-erp.md` and checks:
- Are margins healthy? (15-40% normal, <0% RED, >80% suspicious)
- Is the document chain complete? (Spec→КЛ→FM→КП→Contract)
- Are dates in logical order? (created < modified, plan < actual)
- Are Russian regulatory requirements met? (КС-2/КС-3 totals, НДС=20%, 3+ vendors in КЛ)
- What would a Procore/PlanRadar user expect that we're missing?

## Known Technical Debt
- ~453 files with mock/TODO/placeholder patterns
- ~53 TODO/FIXME comments in frontend source
- ~20 hardcoded Russian strings in JSX (not using `t()`)
- 9 pages still using mock data instead of real API
- ~149 unrouted pages

## Critical Files — Handle With Care
- `i18n/ru.ts` + `en.ts` — 25k lines, nested objects, must stay structurally identical
- `config/navigation.ts` — all sidebar items; removing items breaks nav
- `config/routePermissions.ts` — RBAC matrix
- `backend/src/main/resources/application.yml` — all Spring config
- Any `V*__.sql` — immutable migration history
