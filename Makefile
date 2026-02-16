# =============================================================================
# PRIVOD NEXT -- Build & Run
# =============================================================================

.PHONY: help up down restart logs ps \
        infra-up db-shell db-reset redis-shell \
        backend-build backend-test backend-logs backend-restart \
        frontend-dev frontend-build frontend-test frontend-logs \
        prod-up prod-down prod-logs \
        migrate seed test lint clean full-audit ui-audit

COMPOSE     = docker compose -f docker-compose.yml -p privod_next
COMPOSE_PROD = docker compose -f docker-compose.prod.yml -p privod_prod

# -----------------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------------
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# -----------------------------------------------------------------------------
# Docker Compose (Development)
# -----------------------------------------------------------------------------
up: ## Start all services (dev)
	$(COMPOSE) up -d --build

down: ## Stop all services
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

logs: ## Tail all logs
	$(COMPOSE) logs -f --tail=100

ps: ## Show running containers
	$(COMPOSE) ps

# -----------------------------------------------------------------------------
# Infrastructure Only (for local dev without Docker backend/frontend)
# -----------------------------------------------------------------------------
infra-up: ## Start only infra (postgres, redis, minio, mailhog)
	$(COMPOSE) up -d postgres redis minio minio-init mailhog

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
migrate: ## Run Flyway migrations via backend startup cycle
	$(COMPOSE) up -d postgres redis
	$(COMPOSE) restart backend
	@echo "Migrations triggered. Check 'make backend-logs' for Flyway details."

seed: ## Apply demo seed SQL scripts into dev database
	$(COMPOSE) up -d postgres redis backend
	$(COMPOSE) restart backend
	@echo "Demo seed data ensured via Flyway (db/migration + db/seed)."

db-shell: ## Open psql shell
	$(COMPOSE) exec postgres psql -U privod -d privod2

db-reset: ## Drop and recreate database (DESTRUCTIVE)
	$(COMPOSE) exec postgres psql -U privod -d postgres -c "DROP DATABASE IF EXISTS privod2;"
	$(COMPOSE) exec postgres psql -U privod -d postgres -c "CREATE DATABASE privod2 OWNER privod;"
	$(COMPOSE) exec postgres psql -U privod -d privod2 -f /docker-entrypoint-initdb.d/01-init-extensions.sh || true
	@echo "Database reset. Run 'make backend-restart' to apply migrations."

redis-shell: ## Open redis-cli
	$(COMPOSE) exec redis redis-cli

# -----------------------------------------------------------------------------
# Backend
# -----------------------------------------------------------------------------
backend-build: ## Build backend JAR
	cd backend && ./gradlew build -x test

backend-test: ## Run backend tests
	cd backend && ./gradlew test

backend-logs: ## Tail backend logs
	$(COMPOSE) logs -f backend

backend-restart: ## Restart backend
	$(COMPOSE) restart backend

# -----------------------------------------------------------------------------
# Frontend
# -----------------------------------------------------------------------------
frontend-dev: ## Start frontend dev server (local, not Docker)
	cd frontend && npm run dev

frontend-build: ## Build frontend for production
	cd frontend && npm run build

frontend-test: ## Run frontend tests
	cd frontend && npm run test

frontend-logs: ## Tail frontend logs
	$(COMPOSE) logs -f frontend

# -----------------------------------------------------------------------------
# MinIO / Storage
# -----------------------------------------------------------------------------
minio-logs: ## Tail MinIO logs
	$(COMPOSE) logs -f minio

# -----------------------------------------------------------------------------
# Production
# -----------------------------------------------------------------------------
prod-up: ## Start production stack
	$(COMPOSE_PROD) up -d --build

prod-down: ## Stop production stack
	$(COMPOSE_PROD) down

prod-logs: ## Tail production logs
	$(COMPOSE_PROD) logs -f --tail=100

# -----------------------------------------------------------------------------
# Quality
# -----------------------------------------------------------------------------
test: backend-test frontend-test ## Run all tests

lint: ## Lint all code
	cd backend && ./gradlew check
	cd frontend && npm run lint

# -----------------------------------------------------------------------------
# Migration tools
# -----------------------------------------------------------------------------
audit-odoo: ## Run Odoo audit scripts (read-only)
	cd migration/scripts && python3 extract_all.py
	cd migration/scripts && python3 audit_db_readonly.py

full-audit: ## Full parity audit (legacy->new coverage, routes, readiness %)
	cd migration/scripts && python3 full_system_audit.py
	cd migration/scripts && python3 generate_parity_matrix.py
	cd migration/scripts && python3 build_competitive_strategy.py
	cd migration/scripts && python3 ui_gap_audit.py

ui-audit: ## Frontend UI gap audit (mock/placeholder/console action signals)
	cd migration/scripts && python3 ui_gap_audit.py

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------
clean: ## Remove all containers, volumes, and build artifacts
	$(COMPOSE) down -v --remove-orphans
	cd backend && ./gradlew clean || true
	cd frontend && rm -rf node_modules dist || true
