-- =============================================================================
-- Multi-tenancy: Documents must be tenant-scoped.
--
-- Why:
-- - `documents` previously had no organization_id, so list/search endpoints could leak
--   documents across tenants when filters were omitted.
-- - Document author/access/comment flows must be constrained to the current tenant.
--
-- Backfill strategy (best-effort):
--  1) Prefer project.organization_id when documents.project_id is set
--  2) Otherwise fallback to author.user.organization_id when documents.author_id is set
--  3) Otherwise fallback to bootstrap/default organization
-- =============================================================================

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 1) Backfill from projects
UPDATE documents d
SET organization_id = p.organization_id
FROM projects p
WHERE d.organization_id IS NULL
  AND d.project_id IS NOT NULL
  AND p.id = d.project_id;

-- 2) Backfill from author user
UPDATE documents d
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE d.organization_id IS NULL
  AND d.author_id IS NOT NULL
  AND u.id = d.author_id;

-- 3) Final fallback
UPDATE documents
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE documents
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_org_project ON documents(organization_id, project_id);

