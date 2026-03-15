-- =============================================================================
-- V1185: Create slack_configs table for Slack integration
-- Stores webhook URL, bot token, and channel configuration per organization.
-- =============================================================================

CREATE TABLE IF NOT EXISTS slack_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_name  VARCHAR(255),
    webhook_url     VARCHAR(1000),
    bot_token       VARCHAR(500),
    channel_id      VARCHAR(100),
    enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_slack_cfg_org ON slack_configs (organization_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_slack_cfg_enabled ON slack_configs (enabled) WHERE deleted = FALSE;
