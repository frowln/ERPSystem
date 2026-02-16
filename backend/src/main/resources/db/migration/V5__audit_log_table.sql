-- =============================================================================
-- Audit logs table
-- =============================================================================
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID NOT NULL,
    action      VARCHAR(50) NOT NULL,
    field       VARCHAR(100),
    old_value   TEXT,
    new_value   TEXT,
    user_id     UUID,
    user_name   VARCHAR(255),
    timestamp   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address  VARCHAR(45),

    CONSTRAINT chk_audit_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'))
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
