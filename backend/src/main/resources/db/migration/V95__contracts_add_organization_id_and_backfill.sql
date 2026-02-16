-- =============================================================================
-- Multi-tenancy: tenant-scope contracts by organization_id.
--
-- Backfill strategy:
--  1) Prefer project.organization_id when contract.project_id is present
--  2) Fallback to default bootstrap organization
-- =============================================================================

ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 1) Backfill from linked project.
UPDATE contracts c
SET organization_id = p.organization_id
FROM projects p
WHERE c.organization_id IS NULL
  AND c.project_id IS NOT NULL
  AND p.id = c.project_id;

-- 2) Final fallback.
UPDATE contracts
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE contracts
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE contracts
    DROP CONSTRAINT IF EXISTS contracts_number_key;

ALTER TABLE contracts
    ADD CONSTRAINT uq_contract_org_number UNIQUE (organization_id, number);

CREATE INDEX IF NOT EXISTS idx_contract_org ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_org_project ON contracts(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_contract_org_number ON contracts(organization_id, number);

