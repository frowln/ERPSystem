-- =============================================================================
-- V105: Multi-tenancy for bid scoring comparisons
-- =============================================================================

ALTER TABLE bid_comparisons
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 1) Prefer organization inherited from linked project.
UPDATE bid_comparisons bc
SET organization_id = p.organization_id
FROM projects p
WHERE bc.organization_id IS NULL
  AND bc.project_id IS NOT NULL
  AND p.id = bc.project_id;

-- 2) Fallback to creator organization when project is absent.
UPDATE bid_comparisons bc
SET organization_id = u.organization_id
FROM users u
WHERE bc.organization_id IS NULL
  AND bc.created_by_id IS NOT NULL
  AND u.id = bc.created_by_id;

-- 3) Deterministic bootstrap fallback for legacy rows.
UPDATE bid_comparisons
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE bid_comparisons
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bid_comparison_org ON bid_comparisons(organization_id);
CREATE INDEX IF NOT EXISTS idx_bid_comparison_org_project ON bid_comparisons(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_bid_comparison_org_status ON bid_comparisons(organization_id, status);
