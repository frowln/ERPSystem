-- =============================================================================
-- V87: WebDAV multi-tenancy hardening
--
-- 1) Ensure webdav_configs.organization_id is populated (legacy rows may be NULL)
-- 2) Add organization_id to webdav_files so file listings/status are tenant-scoped
-- =============================================================================

-- Backfill org on configs (legacy)
UPDATE webdav_configs
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Add org to files
ALTER TABLE webdav_files
    ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE INDEX IF NOT EXISTS idx_webdav_file_org ON webdav_files(organization_id);

-- Backfill org on files (legacy)
UPDATE webdav_files
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

