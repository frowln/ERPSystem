-- P3-05: Archiving & retention policies

CREATE TABLE IF NOT EXISTS cde_archive_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID        NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    classification  VARCHAR(30),
    retention_days  INT          NOT NULL DEFAULT 365,
    auto_archive    BOOLEAN      NOT NULL DEFAULT FALSE,
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT       NOT NULL DEFAULT 0,
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_cde_archive_policy_org ON cde_archive_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_cde_archive_policy_classification ON cde_archive_policies(classification);

-- Add archived_at column to document containers for tracking when archiving occurred
ALTER TABLE cde_document_containers
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS retention_policy_id UUID;
