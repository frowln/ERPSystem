# AGENTS.md

## Cursor Cloud specific instructions

### Architecture overview

PRIVOD NEXT is a construction ERP platform with:
- **Backend**: Java 21 / Spring Boot 3.4 / Gradle 8.12, running on port 8080
- **Frontend**: React 19 / TypeScript / Vite 6, dev server on port 4000
- **Infrastructure** (via Docker Compose): PostgreSQL 16 (port 15432), Redis 7 (port 16379), MinIO (ports 19000/19001), MailHog (ports 11025/18025)

### Starting infrastructure

```bash
sudo dockerd &>/tmp/dockerd.log &
sleep 5
sudo docker compose -f docker-compose.yml -p privod_next up -d postgres redis minio minio-init mailhog
```

### Flyway migration ordering caveat

Migration `V240__pricing_schema_reconcile.sql` references `minstroy_price_indices`, which is created by `V1027__estimate_normative_enhanced.sql`. On a fresh database, you must pre-create the table before running the backend:

```sql
sudo docker exec privod_next_postgres psql -U privod -d privod2 -c "
CREATE TABLE IF NOT EXISTS minstroy_price_indices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  region VARCHAR(200) NOT NULL,
  quarter VARCHAR(10) NOT NULL,
  section_code VARCHAR(50),
  section_name VARCHAR(500),
  index_value NUMERIC(10,4) NOT NULL,
  source VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted BOOLEAN NOT NULL DEFAULT FALSE
);
"
```

### Database password sync

The `DB_PASSWORD` environment variable (from injected secrets) may differ from the Docker Compose hardcoded Postgres password. After starting infrastructure, sync the password:

```bash
sudo docker exec privod_next_postgres psql -U privod -d privod2 -c "ALTER USER privod WITH PASSWORD '${DB_PASSWORD}';"
```

### Starting the backend

The backend needs explicit datasource env vars to override defaults when secrets are injected:

```bash
cd backend && SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:15432/privod2" \
  SPRING_DATASOURCE_USERNAME="${DB_USERNAME}" \
  SPRING_DATASOURCE_PASSWORD="${DB_PASSWORD}" \
  SPRING_PROFILES_ACTIVE=dev \
  STORAGE_ENDPOINT="http://localhost:19000" \
  STORAGE_ACCESS_KEY="${MINIO_ROOT_USER}" \
  STORAGE_SECRET_KEY="${MINIO_ROOT_PASSWORD}" \
  JWT_SECRET="${JWT_SECRET}" \
  ./gradlew bootRun
```

### Starting the frontend

```bash
cd frontend && BACKEND_URL="http://localhost:8080" npm run dev
```

The Vite dev server runs on port 4000 (not 3000 as in docker-compose).

### Commands reference

See `Makefile` for full command reference. Key commands:
- **Backend build**: `cd backend && ./gradlew build -x test`
- **Backend tests**: `cd backend && ./gradlew test` (uses Testcontainers, requires Docker)
- **Frontend tests**: `cd frontend && npm run test:run`
- **Frontend typecheck**: `cd frontend && npx tsc -b`
- **Frontend build**: `cd frontend && npm run build`

### Notes

- ESLint is listed in `package.json` scripts (`npm run lint`) but no ESLint dependency or config is installed. The `lint` command will fail.
- The `gradlew` file is a stub (`exec gradle "$@"`), not the standard Gradle Wrapper. Gradle 8.12 must be installed on PATH.
- User registration creates a `VIEWER` role. To test admin features (project CRUD, etc.), promote the user to `ADMIN` in the `user_roles` table and assign an `organization_id` in the `users` table.
- The `application.yml` defaults read env vars `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` etc. If these are set by injected secrets, they override defaults and must match the Docker infrastructure.
