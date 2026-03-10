#!/bin/bash
# =============================================================================
# PRIVOD NEXT -- PostgreSQL Replication Initialization Script
# Runs on the PRIMARY server to configure streaming replication.
#
# Usage:
#   ./init-replication.sh
#
# This script is mounted into postgres-primary via docker-entrypoint-initdb.d
# and runs automatically on first database creation.
# =============================================================================

set -euo pipefail

DB="${POSTGRES_DB:-privod2}"
USER="${POSTGRES_USER:-privod}"
REPLICATION_USER="${REPLICATION_USER:-replicator}"
REPLICATION_PASSWORD="${REPLICATION_PASSWORD:-repl_s3cure_2025}"

echo "=== PRIVOD: Initializing replication configuration ==="

# ---------------------------------------------------------------------------
# 1. Create replication user
# ---------------------------------------------------------------------------
echo "--- Creating replication user: ${REPLICATION_USER} ---"
psql -v ON_ERROR_STOP=1 --username "$USER" --dbname "$DB" <<-EOSQL
    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${REPLICATION_USER}') THEN
            CREATE ROLE ${REPLICATION_USER} WITH REPLICATION LOGIN PASSWORD '${REPLICATION_PASSWORD}';
            RAISE NOTICE 'Replication user "%" created.', '${REPLICATION_USER}';
        ELSE
            RAISE NOTICE 'Replication user "%" already exists, skipping.', '${REPLICATION_USER}';
        END IF;
    END
    \$\$;
EOSQL

# ---------------------------------------------------------------------------
# 2. Update pg_hba.conf to allow replication connections
# ---------------------------------------------------------------------------
PG_HBA="${PGDATA}/pg_hba.conf"

if ! grep -q "replication.*${REPLICATION_USER}" "$PG_HBA" 2>/dev/null; then
    echo "--- Updating pg_hba.conf for replication access ---"
    cat >> "$PG_HBA" <<-EOF

# --- Replication access (added by init-replication.sh) ---
# Allow replication connections from any host in the Docker network
host    replication     ${REPLICATION_USER}     0.0.0.0/0     scram-sha-256
EOF
    echo "pg_hba.conf updated."
else
    echo "pg_hba.conf already contains replication entry, skipping."
fi

# ---------------------------------------------------------------------------
# 3. Create WAL archive directory
# ---------------------------------------------------------------------------
WAL_ARCHIVE_DIR="/var/lib/postgresql/wal_archive"
if [ ! -d "$WAL_ARCHIVE_DIR" ]; then
    echo "--- Creating WAL archive directory: ${WAL_ARCHIVE_DIR} ---"
    mkdir -p "$WAL_ARCHIVE_DIR"
    chown postgres:postgres "$WAL_ARCHIVE_DIR"
    chmod 700 "$WAL_ARCHIVE_DIR"
fi

# ---------------------------------------------------------------------------
# 4. Verify configuration
# ---------------------------------------------------------------------------
echo "--- Verifying replication configuration ---"
psql -v ON_ERROR_STOP=1 --username "$USER" --dbname "$DB" <<-EOSQL
    -- Show replication-related settings
    SELECT name, setting
    FROM pg_settings
    WHERE name IN (
        'wal_level',
        'max_wal_senders',
        'wal_keep_size',
        'synchronous_standby_names',
        'archive_mode',
        'archive_command',
        'hot_standby'
    )
    ORDER BY name;

    -- Show replication users
    SELECT rolname, rolreplication
    FROM pg_roles
    WHERE rolreplication = true;
EOSQL

echo ""
echo "=== PRIVOD: Replication initialization complete ==="
echo ""
echo "Next steps:"
echo "  1. Start the standby with: docker compose --profile replication up -d"
echo "  2. Check replication status:"
echo "     docker exec privod2_pg_primary psql -U privod -d privod2 -c 'SELECT * FROM pg_stat_replication;'"
echo ""
