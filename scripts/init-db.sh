#!/bin/bash
# =============================================================================
# PRIVOD NEXT -- PostgreSQL Initialization Script
# Runs automatically on first database creation via docker-entrypoint-initdb.d
# =============================================================================

set -euo pipefail

echo "=== PRIVOD NEXT: Initializing PostgreSQL extensions ==="

# Use the POSTGRES_DB and POSTGRES_USER environment variables set in docker-compose
DB="${POSTGRES_DB:-privod2}"
USER="${POSTGRES_USER:-privod}"

# ---------------------------------------------------------------------------
# Create extensions in the application database
# ---------------------------------------------------------------------------
psql -v ON_ERROR_STOP=1 --username "$USER" --dbname "$DB" <<-EOSQL

    -- UUID generation (v4, v7, etc.)
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Trigram matching for full-text / fuzzy search
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";

    -- Case-insensitive text type
    CREATE EXTENSION IF NOT EXISTS "citext";

    -- Unaccent for search normalization (e.g., removing diacritics)
    CREATE EXTENSION IF NOT EXISTS "unaccent";

    -- Btree GiST support (used for exclusion constraints, range types)
    CREATE EXTENSION IF NOT EXISTS "btree_gist";

    -- Verify extensions are installed
    SELECT extname, extversion FROM pg_extension ORDER BY extname;

EOSQL

echo "=== PRIVOD NEXT: PostgreSQL initialization complete ==="
