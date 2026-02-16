-- =============================================================================
-- Multi-tenancy: tenant-scope purchase requests by organization_id.
-- =============================================================================

ALTER TABLE purchase_requests
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 1) Prefer organization inherited from linked project.
UPDATE purchase_requests pr
SET organization_id = p.organization_id
FROM projects p
WHERE pr.organization_id IS NULL
  AND pr.project_id IS NOT NULL
  AND p.id = pr.project_id;

-- 2) Fallback to requester organization when project is absent.
UPDATE purchase_requests pr
SET organization_id = u.organization_id
FROM users u
WHERE pr.organization_id IS NULL
  AND pr.requested_by_id IS NOT NULL
  AND u.id = pr.requested_by_id;

-- 3) Deterministic bootstrap fallback for legacy rows.
UPDATE purchase_requests
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE purchase_requests
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pr_org ON purchase_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_pr_org_project ON purchase_requests(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_pr_org_status ON purchase_requests(organization_id, status);
