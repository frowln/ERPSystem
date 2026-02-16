-- =============================================================================
-- Add organization_id to search_history to enable tenant-scoped analytics (recent/popular searches).
-- =============================================================================

ALTER TABLE search_history
    ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE INDEX IF NOT EXISTS idx_search_history_org ON search_history(organization_id);

-- Backfill organization_id from users table; fallback to bootstrap org for legacy NULLs.
UPDATE search_history sh
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE u.id = sh.user_id
  AND sh.organization_id IS NULL;

