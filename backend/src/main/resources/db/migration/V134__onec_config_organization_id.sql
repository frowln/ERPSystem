-- Add organization_id to onec_configs for multi-tenant isolation
ALTER TABLE onec_configs ADD COLUMN organization_id UUID;

CREATE INDEX IF NOT EXISTS idx_onec_cfg_org ON onec_configs(organization_id) WHERE deleted = FALSE;

-- Update default sync interval from 60 to 15 minutes
ALTER TABLE onec_configs ALTER COLUMN sync_interval_minutes SET DEFAULT 15;
