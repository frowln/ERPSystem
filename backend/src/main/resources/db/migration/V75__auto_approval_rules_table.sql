-- =============================================================================
-- V75: Auto Approval Rules — Правила автоматического согласования
-- =============================================================================

CREATE TABLE auto_approval_rules (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                        VARCHAR(500) NOT NULL,
    description                 TEXT,
    entity_type                 VARCHAR(30) NOT NULL,
    conditions                  JSONB,
    auto_approve_threshold      NUMERIC(19, 2),
    required_approvers          INTEGER NOT NULL DEFAULT 1,
    escalation_timeout_hours    INTEGER NOT NULL DEFAULT 24,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    project_id                  UUID,
    organization_id             UUID,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_aar_entity_type CHECK (entity_type IN (
        'CONTRACT', 'PURCHASE_REQUEST', 'INVOICE', 'PAYMENT', 'CHANGE_ORDER'
    )),
    CONSTRAINT chk_aar_required_approvers CHECK (required_approvers >= 1),
    CONSTRAINT chk_aar_escalation_timeout CHECK (escalation_timeout_hours >= 1)
);

CREATE INDEX IF NOT EXISTS idx_aar_entity_type ON auto_approval_rules(entity_type);
CREATE INDEX IF NOT EXISTS idx_aar_org ON auto_approval_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_aar_project ON auto_approval_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_aar_active ON auto_approval_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_aar_not_deleted ON auto_approval_rules(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_auto_approval_rules_updated_at
    BEFORE UPDATE ON auto_approval_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
