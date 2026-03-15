-- Add external_id to counterparties for 1C Ref_Key tracking
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_counterparties_external_id ON counterparties(external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_counterparties_org_external_id ON counterparties(organization_id, external_id) WHERE external_id IS NOT NULL AND deleted = false;

COMMENT ON COLUMN counterparties.external_id IS '1C Ref_Key or other external system identifier';
