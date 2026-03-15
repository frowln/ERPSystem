#!/usr/bin/env bash
# =============================================================================
# Health monitor — checks all services and alerts via Telegram
# Run via cron every 5 minutes: */5 * * * * /opt/privod/scripts/health-monitor.sh
#
# Environment variables:
#   APP_URL            - backend URL            (default: http://localhost:8080)
#   TELEGRAM_BOT_TOKEN - Telegram bot token     (optional, for alerts)
#   TELEGRAM_CHAT_ID   - Telegram chat ID       (optional, for alerts)
#   DB_PASSWORD        - PostgreSQL password     (default: privod_dev)
#   DB_PORT            - PostgreSQL port         (default: 15432)
#   DB_USER            - PostgreSQL user         (default: privod)
# =============================================================================
set -euo pipefail

APP_URL="${APP_URL:-http://localhost:8080}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
STATUS_FILE="/tmp/privod-health-status"

check_endpoint() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"
    local timeout=10

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout $timeout "$url" || echo "000")

    if [ "$HTTP_CODE" = "$expected_code" ]; then
        echo "OK|${name}"
        return 0
    else
        echo "FAIL|${name}|expected=${expected_code}|got=${HTTP_CODE}"
        return 1
    fi
}

send_telegram() {
    local message="$1"
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="$TELEGRAM_CHAT_ID" \
            -d text="$message" \
            -d parse_mode="Markdown" > /dev/null 2>&1
    fi
}

FAILED=""
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check endpoints
for check in \
    "API Health|${APP_URL}/api/health|200" \
    "Actuator|${APP_URL}/actuator/health|200" \
    "Frontend|http://localhost:4000|200" \
; do
    IFS='|' read -r name url code <<< "$check"
    result=$(check_endpoint "$name" "$url" "$code") || FAILED="${FAILED}\n${result}"
done

# Check Docker containers
for container in privod-postgres privod-redis privod-minio; do
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "$container"; then
        echo "OK|Docker: ${container}"
    else
        FAILED="${FAILED}\nFAIL|Docker: ${container}|not running"
    fi
done

# Check disk space (alert if >85%)
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 85 ]; then
    FAILED="${FAILED}\nDisk usage: ${DISK_USAGE}%"
fi

# Check PostgreSQL connections
PG_CONNECTIONS=$(PGPASSWORD="${DB_PASSWORD:-privod_dev}" psql -h localhost -p "${DB_PORT:-15432}" -U "${DB_USER:-privod}" -d privod2 -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "-1")
if [ "$PG_CONNECTIONS" -gt 80 ]; then
    FAILED="${FAILED}\nPostgreSQL connections: ${PG_CONNECTIONS}/100"
fi

# Compare with previous status to avoid alert spam
PREV_STATUS=$(cat "$STATUS_FILE" 2>/dev/null || echo "")
CURRENT_STATUS="$FAILED"

if [ -n "$FAILED" ] && [ "$CURRENT_STATUS" != "$PREV_STATUS" ]; then
    send_telegram "*PRIVOD: Problems detected*\n\n${TIMESTAMP}${FAILED}\n\nCheck server immediately."
    echo "[${TIMESTAMP}] ALERT sent:${FAILED}"
elif [ -z "$FAILED" ] && [ -n "$PREV_STATUS" ]; then
    send_telegram "*PRIVOD: All services recovered*\n\n${TIMESTAMP}\n\nAll components are running normally."
    echo "[${TIMESTAMP}] Recovery alert sent"
fi

echo "$CURRENT_STATUS" > "$STATUS_FILE"

if [ -z "$FAILED" ]; then
    echo "[${TIMESTAMP}] All checks passed"
else
    echo "[${TIMESTAMP}] Failures detected:${FAILED}"
    exit 1
fi
