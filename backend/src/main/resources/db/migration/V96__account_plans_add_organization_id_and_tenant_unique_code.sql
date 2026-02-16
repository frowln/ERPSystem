-- =============================================================================
-- Multi-tenancy: tenant-scope account plans by organization_id.
-- =============================================================================

ALTER TABLE account_plans
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Best-effort backfill from existing account entries where possible.
UPDATE account_plans p
SET organization_id = e.organization_id
FROM account_entries e
WHERE p.organization_id IS NULL
  AND e.debit_account_id = p.id
  AND e.organization_id IS NOT NULL;

UPDATE account_plans p
SET organization_id = e.organization_id
FROM account_entries e
WHERE p.organization_id IS NULL
  AND e.credit_account_id = p.id
  AND e.organization_id IS NOT NULL;

-- Fallback for plans not yet used in entries.
UPDATE account_plans
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE account_plans
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE account_plans
    DROP CONSTRAINT IF EXISTS uq_account_plan_code;

ALTER TABLE account_plans
    ADD CONSTRAINT uq_account_plan_org_code UNIQUE (organization_id, code);

CREATE INDEX IF NOT EXISTS idx_account_plan_org ON account_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_account_plan_org_code ON account_plans(organization_id, code);

