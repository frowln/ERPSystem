#!/usr/bin/env bash
# =============================================================================
# Automated PostgreSQL backup for Privod ERP
# Usage: ./backup-db.sh [retention_days]
#
# Environment variables:
#   DB_HOST     - PostgreSQL host     (default: localhost)
#   DB_PORT     - PostgreSQL port     (default: 5432)
#   DB_NAME     - database name       (default: privod2)
#   DB_USER     - database user       (default: privod)
#   PGPASSWORD  - database password   (required)
#   BACKUP_DIR  - backup directory    (default: /var/backups/privod)
#   S3_BUCKET     - S3/MinIO bucket     (optional, for offsite copy)
#   S3_ENDPOINT   - S3 endpoint URL     (optional)
#   GPG_RECIPIENT - GPG key recipient   (optional, encrypts backup)
# =============================================================================
set -euo pipefail

RETENTION_DAYS="${1:-90}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-privod2}"
DB_USER="${DB_USER:-privod}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/privod}"

BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting backup of ${DB_NAME}@${DB_HOST}:${DB_PORT}"

# Dump and compress
pg_dump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --username="${DB_USER}" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  "${DB_NAME}" > "${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date -Iseconds)] Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Optional GPG encryption
if [ -n "${GPG_RECIPIENT:-}" ]; then
    echo "Encrypting backup with GPG for ${GPG_RECIPIENT}..."
    gpg --batch --yes --trust-model always --recipient "${GPG_RECIPIENT}" --encrypt "${BACKUP_FILE}"
    rm -f "${BACKUP_FILE}"
    BACKUP_FILE="${BACKUP_FILE}.gpg"
    echo "Encrypted: ${BACKUP_FILE}"
fi

# Upload to S3/MinIO if configured
if [[ -n "${S3_BUCKET:-}" ]]; then
  S3_ARGS=""
  if [[ -n "${S3_ENDPOINT:-}" ]]; then
    S3_ARGS="--endpoint-url ${S3_ENDPOINT}"
  fi
  aws s3 cp ${S3_ARGS} "${BACKUP_FILE}" "s3://${S3_BUCKET}/db-backups/$(basename "${BACKUP_FILE}")"
  echo "[$(date -Iseconds)] Uploaded to s3://${S3_BUCKET}/db-backups/"
fi

# Remove old backups
if [[ "${RETENTION_DAYS}" -gt 0 ]]; then
  DELETED=$(find "${BACKUP_DIR}" \( -name "${DB_NAME}_*.sql.gz" -o -name "${DB_NAME}_*.sql.gz.gpg" \) -mtime "+${RETENTION_DAYS}" -delete -print | wc -l)
  echo "[$(date -Iseconds)] Removed ${DELETED} backup(s) older than ${RETENTION_DAYS} days"
fi

echo "[$(date -Iseconds)] Backup complete"
