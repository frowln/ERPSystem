# AGENTS.md

## Cursor Cloud specific instructions

### Architecture Overview

Privod Next is a construction industry ERP with a Java 21 / Spring Boot 3.4 backend and a React 19 / TypeScript / Vite 6 frontend. Infrastructure (PostgreSQL 16, Redis 7) runs via Docker Compose.

### Running Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| PostgreSQL + Redis | `docker compose up -d postgres redis` (from repo root) | 15432, 16379 | Required before backend |
| Backend | `cd backend && DB_URL="jdbc:postgresql://localhost:15432/privod2" SPRING_PROFILES_ACTIVE=dev SPRING_FLYWAY_ENABLED=false ./gradlew bootRun --no-daemon` | 8080 | See Flyway note below |
| Frontend | `cd frontend && npm run dev -- --host 0.0.0.0` | 4000 | Vite proxies `/api` → backend:8080 |

### Critical Gotchas

1. **Flyway migrations are broken on fresh DB.** Migration V240 references table `minstroy_price_indices` created by V1027 (ordering conflict). Workaround: start backend with `SPRING_FLYWAY_ENABLED=false` and rely on `ddl-auto: update`. This means some columns may be missing — add them manually via `psql` if you get "column does not exist" errors (e.g. `is_current`, `doc_version` on `commercial_proposals`; `sla_status` on `support_tickets`).

2. **`DB_URL` env var override.** A pre-existing `DB_URL` secret may point to a different database name (`privod_next` instead of `privod2`). Always explicitly set `DB_URL=jdbc:postgresql://localhost:15432/privod2` when starting the backend locally.

3. **`gradlew` is a stub.** It just runs `exec gradle "$@"`. You must install Gradle 8.12 globally first: download from `https://services.gradle.org/distributions/gradle-8.12-bin.zip` and symlink to `/usr/local/bin/gradle`.

4. **Docker in Cloud Agent.** Requires fuse-overlayfs storage driver and iptables-legacy. See setup instructions in the system prompt.

5. **CORS.** The Vite dev server runs on port 4000 (not 3000). The Vite proxy strips the `Origin` header, so CORS config doesn't need updating. Always access the app via `http://localhost:4000`.

6. **Admin credentials (dev profile).** `DataInitializer` seeds admin users on every boot: `admin@privod.com` / `admin123` and `admin@privod.ru` / `admin123`.

7. **ESLint not installed.** `npm run lint` fails because eslint is not in `package.json` devDependencies. This is a pre-existing repo issue.

### Standard Commands

- Lint: `cd backend && ./gradlew check` (backend); `cd frontend && npm run lint` (frontend, currently broken — see note above)
- Test: `cd frontend && npx vitest run --dir src` (52 files, 611 tests); `cd backend && ./gradlew test` (requires Testcontainers / Docker)
- Build: `cd frontend && npm run build`; `cd backend && ./gradlew build -x test`
- Type check: `cd frontend && npx tsc -b`

See `Makefile` at repo root for additional convenience targets.
