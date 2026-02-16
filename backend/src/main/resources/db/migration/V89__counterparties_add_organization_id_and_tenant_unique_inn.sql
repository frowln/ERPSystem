-- =============================================================================
-- Multi-tenancy: Counterparties must be tenant-scoped.
--
-- Why:
-- - `counterparties` previously had no organization_id, which allows cross-tenant leakage
--   and makes enterprise multi-tenant impossible.
-- - `inn` must be unique per tenant, not globally.
-- =============================================================================

ALTER TABLE counterparties
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Backfill legacy rows to the bootstrap/default organization
UPDATE counterparties
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE counterparties
    ALTER COLUMN organization_id SET NOT NULL;

-- Replace global uniqueness on INN with tenant-scoped uniqueness
ALTER TABLE counterparties
    DROP CONSTRAINT IF EXISTS uq_counterparty_inn;

ALTER TABLE counterparties
    ADD CONSTRAINT uq_counterparty_org_inn UNIQUE (organization_id, inn);

-- Helpful indexes for common tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_counterparty_org ON counterparties(organization_id);
CREATE INDEX IF NOT EXISTS idx_counterparty_org_name ON counterparties(organization_id, name);

