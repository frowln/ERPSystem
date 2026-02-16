#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# PRIVOD NEXT — Development Environment Setup
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo " ПРИВОД NEXT — Настройка окружения"
echo "========================================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found"; exit 1; }
command -v docker compose >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || { echo "ERROR: docker compose not found"; exit 1; }

# Create .env from example if not exists
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo "[OK] .env created from .env.example"
else
    echo "[OK] .env already exists"
fi

# Start database and redis
echo ""
echo "Starting database and Redis..."
cd "$PROJECT_DIR"
docker compose up -d db redis

echo ""
echo "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U privod -d privod_next >/dev/null 2>&1; then
        echo "[OK] PostgreSQL is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "ERROR: PostgreSQL did not become ready in time"
        exit 1
    fi
    sleep 1
done

echo ""
echo "Waiting for Redis to be ready..."
for i in $(seq 1 15); do
    if docker compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo "[OK] Redis is ready"
        break
    fi
    if [ "$i" -eq 15 ]; then
        echo "ERROR: Redis did not become ready in time"
        exit 1
    fi
    sleep 1
done

# Backend setup
echo ""
echo "========================================="
echo " Backend setup (Java 21 / Spring Boot)"
echo "========================================="

if command -v java >/dev/null 2>&1; then
    JAVA_VER=$(java -version 2>&1 | head -1)
    echo "Java: $JAVA_VER"
else
    echo "WARNING: Java not found locally. Use Docker for backend."
fi

if [ -f "$PROJECT_DIR/backend/build.gradle.kts" ]; then
    echo "[OK] Backend project found"
else
    echo "WARNING: Backend project not found at $PROJECT_DIR/backend/"
fi

# Frontend setup
echo ""
echo "========================================="
echo " Frontend setup (React 19 / TypeScript)"
echo "========================================="

if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    echo "Node.js: $NODE_VER"

    if [ -f "$PROJECT_DIR/frontend/package.json" ]; then
        echo "Installing frontend dependencies..."
        cd "$PROJECT_DIR/frontend"
        npm install
        echo "[OK] Frontend dependencies installed"
    fi
else
    echo "WARNING: Node.js not found locally. Use Docker for frontend."
fi

echo ""
echo "========================================="
echo " Setup complete!"
echo "========================================="
echo ""
echo " Database:  localhost:5433  (user: privod, db: privod_next)"
echo " Redis:     localhost:6380"
echo ""
echo " Next steps:"
echo "   Backend:  cd backend && ./gradlew bootRun"
echo "   Frontend: cd frontend && npm run dev"
echo "   Full:     make up"
echo ""
