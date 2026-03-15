#!/usr/bin/env bash
# =============================================================================
# MinIO S3 backup — sync all buckets to local backup directory
# Run daily after database backup (see also: backup-db.sh)
#
# Environment variables:
#   BACKUP_DIR       - backup directory       (default: /opt/backups/minio)
#   MINIO_ALIAS      - mc alias name          (default: privod)
#   MINIO_URL        - MinIO endpoint URL     (default: http://localhost:9000)
#   MINIO_ACCESS_KEY - MinIO access key       (default: minioadmin)
#   MINIO_SECRET_KEY - MinIO secret key       (default: minioadmin)
#   RETENTION_DAYS   - days to keep backups   (default: 30)
#   TELEGRAM_BOT_TOKEN - Telegram bot token   (optional, for notifications)
#   TELEGRAM_CHAT_ID   - Telegram chat ID     (optional, for notifications)
# =============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/minio}"
MINIO_ALIAS="${MINIO_ALIAS:-privod}"
MINIO_URL="${MINIO_URL:-http://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y-%m-%d)
LOG_FILE="${BACKUP_DIR}/backup-minio-${DATE}.log"

# Create backup directory
mkdir -p "${BACKUP_DIR}/${DATE}"

echo "[$(date -Iseconds)] Starting MinIO backup..." | tee -a "$LOG_FILE"

# Configure mc alias (MinIO Client)
mc alias set "${MINIO_ALIAS}" "${MINIO_URL}" "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}" 2>&1 | tee -a "$LOG_FILE"

# List and sync all buckets
for BUCKET in $(mc ls "${MINIO_ALIAS}" | awk '{print $NF}' | tr -d '/'); do
    echo "[$(date -Iseconds)] Syncing bucket: ${BUCKET}" | tee -a "$LOG_FILE"
    mc mirror --overwrite "${MINIO_ALIAS}/${BUCKET}" "${BACKUP_DIR}/${DATE}/${BUCKET}" 2>&1 | tee -a "$LOG_FILE"
done

# Cleanup old backups
find "${BACKUP_DIR}" -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>&1 | tee -a "$LOG_FILE"

# Calculate backup size
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${DATE}" | cut -f1)
echo "[$(date -Iseconds)] Backup complete. Size: ${BACKUP_SIZE}" | tee -a "$LOG_FILE"

# Optional: Telegram notification
if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="${TELEGRAM_CHAT_ID}" \
        -d text="MinIO backup complete: ${BACKUP_SIZE} (${DATE})" > /dev/null
fi
