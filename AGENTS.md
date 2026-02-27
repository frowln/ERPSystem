# AGENTS.md

## Cursor Cloud specific instructions

### Architecture Overview
PRIVOD NEXT is a construction ERP platform with a Java 21 Spring Boot backend and a React 19 / TypeScript frontend. See `Makefile` for common commands and `docker-compose.yml` for service definitions.

### Required Infrastructure
Start infrastructure before running backend/frontend locally:
```
docker compose -f docker-compose.yml -p privod_next up -d postgres redis minio minio-init mailhog
```
Ports: PostgreSQL 15432, Redis 16379, MinIO 19000/19001, MailHog SMTP 11025 / Web 18025.

### Backend (Spring Boot)
- **Build**: `cd backend && ./gradlew build -x test`
- **Run**: `cd backend && DB_URL=jdbc:postgresql://localhost:15432/privod2 SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun`
- **Important**: The environment injects a `DB_URL` secret that may point to a different database. Always override `DB_URL` to `jdbc:postgresql://localhost:15432/privod2` when running locally against Docker infrastructure.
- The `gradlew` script is a stub that delegates to `gradle`. Gradle 8.12 must be installed on the host (not bundled as a wrapper JAR).
- **Flyway migration bug**: Migration V240 references table `minstroy_price_indices` (created in V1027). Before first backend startup on a fresh database, pre-create the table:
  ```sql
  docker exec privod_next_postgres psql -U privod -d privod2 -c "
  CREATE TABLE IF NOT EXISTS minstroy_price_indices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID, region VARCHAR(255), quarter VARCHAR(20),
      section_name VARCHAR(255), index_value NUMERIC(10,4),
      source VARCHAR(500), created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ, deleted BOOLEAN DEFAULT false
  );"
  ```
- Backend health check: `curl http://localhost:8080/actuator/health`
- Backend tests (`./gradlew test`) have pre-existing compilation errors in several test files that reference unimplemented classes. Use `./gradlew financeGateTest` for a working isolated test suite.

### Frontend (React / Vite)
- **Install deps**: `cd frontend && npm ci`
- **Run**: `cd frontend && npm run dev` (serves on port 4000)
- **Tests**: `cd frontend && npm run test:run` (52 test files, 611 tests)
- **Typecheck**: `cd frontend && npm run typecheck`
- **Lint**: `npm run lint` requires ESLint, which is not listed in `devDependencies`. Use `npm run typecheck` as the code quality check instead.

### Test User
Register via API or use the login page:
```
curl http://localhost:4000/api/auth/register -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!","email":"admin@privod.test","firstName":"Admin","lastName":"User"}'
```
Login: email `admin@privod.test`, password `Admin123!`.
