# AGENTS.md

## Cursor Cloud specific instructions

### Architecture
PRIVOD NEXT is a construction ERP (monorepo) with:
- **Backend**: Java 21 / Spring Boot 3.4 / Gradle 8.12 (in `/backend`)
- **Frontend**: React 19 / Vite 6 / TypeScript (in `/frontend`, uses `npm`)
- **Infrastructure**: PostgreSQL 16, Redis 7, MinIO, MailHog — all via Docker Compose

### Running services

**Infrastructure** (Docker Compose):
```
sudo docker compose -f docker-compose.yml -p privod_next up -d postgres redis minio minio-init mailhog
```
Ports: Postgres=15432, Redis=16379, MinIO API=19000, MinIO Console=19001, MailHog SMTP=11025, MailHog UI=18025.

**Backend** (Docker — recommended due to Flyway migration ordering issues):
```
sudo docker compose -f docker-compose.yml -p privod_next up -d --build backend
```
Backend runs on port **18080** (mapped from container 8080). Health: `curl http://localhost:18080/actuator/health`

**Frontend** (local dev server):
```
cd frontend && BACKEND_URL=http://localhost:18080 npm run dev
```
Runs on port **4000** with API proxy to backend.

### Critical gotchas

1. **Flyway migration ordering bug**: Migration V240 references `minstroy_price_indices` table which is only created in V1027. On a fresh database, you must pre-create this table AND run V1's `update_updated_at_column()` function before starting the backend. The database init sequence is:
   - Create extensions (uuid-ossp, pg_trgm, citext, unaccent, btree_gist)
   - Create function `update_updated_at_column()` (from V1)
   - Create table `minstroy_price_indices` (from V1027)
   - Then start the backend (Flyway baseline-on-migrate handles the rest)

2. **Injected secrets override local config**: Environment secrets like `DB_URL`, `DB_PASSWORD`, `JWT_SECRET` take precedence over `application.yml` defaults. When running locally against Docker infra, ensure `DB_URL=jdbc:postgresql://localhost:15432/privod2` is set correctly.

3. **`gradlew` is a stub**: The wrapper script just calls `exec gradle "$@"`. Gradle 8.12 must be installed system-wide (installed at `/opt/gradle-8.12/bin/gradle`).

4. **ESLint not in devDependencies**: The `npm run lint` script calls `eslint .` but ESLint isn't a declared dependency and there's no eslint config file. Use `npm run typecheck` for static analysis instead.

5. **ROI uses `customerPrice` not `estimatePrice`**: The Budget ROI endpoint (`GET /budgets/{id}/roi`) calculates revenue from `customerPrice × quantity`. Validation enforces `customerPrice ≤ estimatePrice`.

### Standard commands
See `Makefile` for all available targets. Key ones:
- `make test` — runs backend + frontend tests
- `make lint` — runs backend check + frontend lint
- Frontend tests: `cd frontend && npm run test:run` (611 tests via Vitest)
- Frontend typecheck: `cd frontend && npm run typecheck`
- Backend build: `cd backend && gradle build -x test`
- Backend tests: `cd backend && gradle test` (requires Testcontainers / Docker)

### Auth
Default admin: `admin@privod.ru` / `admin123` (seeded via V2 migration).
