#!/usr/bin/env bash
# =============================================================================
# PRIVOD NEXT -- Demo Environment: One-Command Setup
#
# Usage:
#   ./scripts/demo-setup.sh           # build + start + seed
#   ./scripts/demo-setup.sh --no-seed # build + start without seeding
#   ./scripts/demo-setup.sh --reset   # destroy volumes and rebuild from scratch
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.demo.yml"
COMPOSE="docker compose -f $COMPOSE_FILE -p privod_demo"

# Default options
SKIP_SEED=false
RESET=false

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --no-seed)  SKIP_SEED=true ;;
    --reset)    RESET=true ;;
    --help|-h)
      echo "Usage: $0 [--no-seed] [--reset] [--help]"
      echo ""
      echo "  --no-seed   Skip demo data seeding"
      echo "  --reset     Destroy existing volumes and rebuild from scratch"
      echo "  --help      Show this help"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Run $0 --help for usage"
      exit 1
      ;;
  esac
done

echo ""
echo "========================================================"
echo "  ПРИВОД — Запуск демо-среды"
echo "========================================================"
echo ""

# ---------------------------------------------------------------------------
# Prerequisites check
# ---------------------------------------------------------------------------
command -v docker >/dev/null 2>&1 || {
  echo "ОШИБКА: docker не найден. Установите Docker Desktop."
  echo "  https://docs.docker.com/get-docker/"
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "ОШИБКА: docker compose не найден."
  echo "  Обновите Docker Desktop до последней версии."
  exit 1
}

# Check Docker daemon is running
docker info >/dev/null 2>&1 || {
  echo "ОШИБКА: Docker daemon не запущен. Запустите Docker Desktop."
  exit 1
}

# ---------------------------------------------------------------------------
# Reset if requested
# ---------------------------------------------------------------------------
if [ "$RESET" = true ]; then
  echo "[1/5] Удаление старых контейнеров и данных..."
  $COMPOSE down -v --remove-orphans 2>/dev/null || true
  echo "       Готово."
else
  echo "[1/5] Проверка состояния..."
  # Stop existing containers if any, keep volumes
  $COMPOSE down --remove-orphans 2>/dev/null || true
  echo "       Готово."
fi

# ---------------------------------------------------------------------------
# Build and start
# ---------------------------------------------------------------------------
echo ""
echo "[2/5] Сборка и запуск сервисов (первый раз может занять 5-10 минут)..."
$COMPOSE up -d --build
echo "       Контейнеры запущены."

# ---------------------------------------------------------------------------
# Wait for backend health
# ---------------------------------------------------------------------------
echo ""
echo "[3/5] Ожидание готовности backend (Spring Boot ~60-90 сек)..."

MAX_WAIT=180
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "       Backend готов! (${ELAPSED}s)"
    break
  fi

  # Check if container is still running
  if ! docker ps --format '{{.Names}}' | grep -q 'privod_demo_backend'; then
    echo ""
    echo "ОШИБКА: Контейнер backend остановился."
    echo "Смотрите логи: $COMPOSE logs backend"
    exit 1
  fi

  sleep 3
  ELAPSED=$((ELAPSED + 3))

  # Progress indicator every 15 seconds
  if [ $((ELAPSED % 15)) -eq 0 ]; then
    echo "       ... ожидание (${ELAPSED}s / ${MAX_WAIT}s)"
  fi
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo ""
  echo "ОШИБКА: Backend не запустился за ${MAX_WAIT} секунд."
  echo "Смотрите логи: $COMPOSE logs backend"
  exit 1
fi

# ---------------------------------------------------------------------------
# Seed demo data
# ---------------------------------------------------------------------------
if [ "$SKIP_SEED" = false ]; then
  echo ""
  echo "[4/5] Загрузка демо-данных..."

  # Check if node is available for the seed script
  if command -v node >/dev/null 2>&1; then
    # Use the existing seed script, pointed at the demo backend
    API_ROOT=http://localhost:8080/api \
    PRIVOD_EMAIL=admin@demo.privod.ru \
    PRIVOD_PASSWORD=Demo123! \
      node "$SCRIPT_DIR/seed_full_finmodel_demo.mjs" && {
        echo "       Демо-данные загружены."
      } || {
        echo "       ПРЕДУПРЕЖДЕНИЕ: Не удалось загрузить демо-данные."
        echo "       Можно загрузить вручную: node scripts/seed_full_finmodel_demo.mjs"
      }
  else
    echo "       ПРЕДУПРЕЖДЕНИЕ: Node.js не найден, демо-данные не загружены."
    echo "       Установите Node.js и запустите:"
    echo "         API_ROOT=http://localhost:8080/api node scripts/seed_full_finmodel_demo.mjs"
  fi
else
  echo ""
  echo "[4/5] Загрузка демо-данных пропущена (--no-seed)."
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "[5/5] Проверка сервисов..."
echo ""
$COMPOSE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || $COMPOSE ps
echo ""
echo "========================================================"
echo "  ПРИВОД — Демо-среда запущена!"
echo "========================================================"
echo ""
echo "  Frontend:       http://localhost:3000"
echo "  Backend API:    http://localhost:8080/api"
echo "  Swagger UI:     http://localhost:3000/swagger-ui/"
echo "  MinIO Console:  http://localhost:9001  (minioadmin / minioadmin)"
echo ""
echo "  PostgreSQL:     localhost:15432  (privod / demo_password / privod2_demo)"
echo "  Redis:          localhost:16379"
echo ""
echo "  Демо-аккаунты:"
echo "    Админ:      admin@demo.privod.ru     / Demo123!"
echo "    Менеджер:   manager@demo.privod.ru   / Demo123!"
echo "    Инженер:    engineer@demo.privod.ru  / Demo123!"
echo "    Бухгалтер:  accountant@demo.privod.ru / Demo123!"
echo "    Наблюдатель: viewer@demo.privod.ru   / Demo123!"
echo ""
echo "  Управление:"
echo "    Логи:       docker compose -f docker-compose.demo.yml logs -f"
echo "    Остановка:  docker compose -f docker-compose.demo.yml down"
echo "    Сброс:      ./scripts/demo-setup.sh --reset"
echo ""
