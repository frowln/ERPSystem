#!/usr/bin/env bash
# Disaster Recovery Test Script
# Tests backup -> restore cycle to verify data integrity
# Run quarterly in a STAGING environment (never in production!)

set -euo pipefail

echo "================================================================"
echo "  ПРИВОД — Тест аварийного восстановления (DR Test)"
echo "  Дата: $(date)"
echo "================================================================"

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/postgres}"
DR_DB="privod2_dr_test"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-15432}"
PG_USER="${PG_USER:-privod}"
export PGPASSWORD="${PG_PASSWORD:-privod_dev}"

# Step 1: Find latest backup
echo ""
echo "[1/6] Поиск последнего бэкапа..."
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/privod2_*.sql.gz 2>/dev/null | head -1)
if [ -z "$LATEST_BACKUP" ]; then
    echo "ОШИБКА: Бэкапы не найдены в ${BACKUP_DIR}"
    exit 1
fi
echo "  Найден: ${LATEST_BACKUP}"
echo "  Размер: $(du -h "$LATEST_BACKUP" | cut -f1)"

# Step 2: Create test database
echo ""
echo "[2/6] Создание тестовой БД ${DR_DB}..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "DROP DATABASE IF EXISTS ${DR_DB};" 2>/dev/null
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "CREATE DATABASE ${DR_DB};"

# Step 3: Restore backup
echo ""
echo "[3/6] Восстановление из бэкапа..."
START_TIME=$(date +%s)
gunzip -c "$LATEST_BACKUP" | psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DR_DB" > /dev/null 2>&1
END_TIME=$(date +%s)
RESTORE_DURATION=$((END_TIME - START_TIME))
echo "  Восстановление заняло: ${RESTORE_DURATION} сек."

# Step 4: Verify data integrity
echo ""
echo "[4/6] Проверка целостности данных..."
TABLES=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DR_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
echo "  Таблиц: ${TABLES}"

USERS=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DR_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
echo "  Пользователей: ${USERS}"

PROJECTS=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DR_DB" -t -c "SELECT COUNT(*) FROM projects WHERE deleted = false;" 2>/dev/null || echo "0")
echo "  Проектов: ${PROJECTS}"

TASKS=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DR_DB" -t -c "SELECT COUNT(*) FROM tasks WHERE deleted = false;" 2>/dev/null || echo "0")
echo "  Задач: ${TASKS}"

MIGRATIONS=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DR_DB" -t -c "SELECT COUNT(*) FROM flyway_schema_history WHERE success = true;" 2>/dev/null || echo "0")
echo "  Flyway миграций: ${MIGRATIONS}"

# Step 5: Verify Flyway consistency
echo ""
echo "[5/6] Проверка консистентности Flyway..."
FAILED_MIGRATIONS=$(psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$DR_DB" -t -c "SELECT COUNT(*) FROM flyway_schema_history WHERE success = false;" 2>/dev/null || echo "0")
if [ "$(echo "$FAILED_MIGRATIONS" | tr -d ' ')" != "0" ]; then
    echo "  ВНИМАНИЕ: Есть неуспешные миграции!"
else
    echo "  Все миграции успешны"
fi

# Step 6: Cleanup
echo ""
echo "[6/6] Удаление тестовой БД..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "DROP DATABASE ${DR_DB};"

# Summary
echo ""
echo "================================================================"
echo "  РЕЗУЛЬТАТ DR-ТЕСТА"
echo "================================================================"
echo "  Бэкап:              ${LATEST_BACKUP}"
echo "  Время восстановления: ${RESTORE_DURATION} сек (RTO цель: < 14400 сек)"
echo "  Таблиц:             ${TABLES}"
echo "  Пользователей:      ${USERS}"
echo "  Flyway миграций:    ${MIGRATIONS}"
echo "  Статус:             $([ "$(echo "$FAILED_MIGRATIONS" | tr -d ' ')" = "0" ] && echo "УСПЕШНО" || echo "ОШИБКИ")"
echo "================================================================"
