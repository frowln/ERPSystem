ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS secondary_secret VARCHAR(255);
ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS secret_rotation_at TIMESTAMP;
ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS resource_filter JSONB DEFAULT '{}';
-- resource_filter example: {"projectId": "uuid", "organizationId": "uuid"}
