#!/usr/bin/env bash
# =============================================================================
# PostgreSQL backup restore for Privod ERP
# Usage: ./restore-db.sh <backup_file>
#
# Accepts:
#   - Local file:  ./restore-db.sh /var/backups/privod/privod2_20260312.sql.gz
#   - GPG file:    ./restore-db.sh /var/backups/privod/privod2_20260312.sql.gz.gpg
#   - S3 path:     ./restore-db.sh s3://bucket/db-backups/privod2_20260312.sql.gz
#
# Environment variables:
#   DB_HOST     - PostgreSQL host     (default: localhost)
#   DB_PORT     - PostgreSQL port     (default: 5432)
#   DB_NAME     - database name       (default: privod2)
#   DB_USER     - database user       (default: privod)
#   PGPASSWORD  - database password   (required)
#   S3_ENDPOINT - S3 endpoint URL     (optional, for MinIO)
# =============================================================================
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup_file|s3://bucket/path>"
  exit 1
fi

INPUT="$1"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-privod2}"
DB_USER="${DB_USER:-privod}"

TMPDIR="${TMPDIR:-/tmp}"
RESTORE_FILE=""
CLEANUP_FILES=()

cleanup() {
  for f in "${CLEANUP_FILES[@]}"; do
    rm -f "$f"
  done
}
trap cleanup EXIT

# Step 1: Download from S3 if needed
if [[ "${INPUT}" == s3://* ]]; then
  LOCAL_FILE="${TMPDIR}/$(basename "${INPUT}")"
  S3_ARGS=""
  if [[ -n "${S3_ENDPOINT:-}" ]]; then
    S3_ARGS="--endpoint-url ${S3_ENDPOINT}"
  fi
  echo "[$(date -Iseconds)] Downloading from ${INPUT}..."
  aws s3 cp ${S3_ARGS} "${INPUT}" "${LOCAL_FILE}"
  CLEANUP_FILES+=("${LOCAL_FILE}")
  INPUT="${LOCAL_FILE}"
fi

# Step 2: Decrypt GPG if needed
if [[ "${INPUT}" == *.gpg ]]; then
  DECRYPTED="${INPUT%.gpg}"
  if [[ "${INPUT}" == "${TMPDIR}/"* ]]; then
    CLEANUP_FILES+=("${DECRYPTED}")
  fi
  echo "[$(date -Iseconds)] Decrypting GPG..."
  gpg --batch --yes --decrypt --output "${DECRYPTED}" "${INPUT}"
  INPUT="${DECRYPTED}"
fi

RESTORE_FILE="${INPUT}"

echo "[$(date -Iseconds)] Restoring ${RESTORE_FILE} into ${DB_NAME}@${DB_HOST}:${DB_PORT}"
echo "WARNING: This will overwrite existing data in ${DB_NAME}. Press Ctrl+C within 5 seconds to abort."
sleep 5

pg_restore \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --username="${DB_USER}" \
  --dbname="${DB_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --single-transaction \
  "${RESTORE_FILE}"

echo "[$(date -Iseconds)] Restore complete"
