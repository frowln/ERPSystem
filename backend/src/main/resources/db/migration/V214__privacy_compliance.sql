-- =============================================================================
-- V214: Privacy Compliance (152-ФЗ «О персональных данных»)
-- Consent records, data subject requests, privacy policies, PII access audit
-- =============================================================================

-- Data processing consent records (Art. 9 152-ФЗ)
CREATE TABLE IF NOT EXISTS data_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    consent_type VARCHAR(50) NOT NULL,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    user_agent TEXT,
    consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    legal_basis VARCHAR(50) NOT NULL DEFAULT 'CONSENT',
    purpose TEXT NOT NULL,
    data_categories TEXT,
    retention_days INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_dc_org ON data_consents(organization_id);
CREATE INDEX IF NOT EXISTS idx_dc_user ON data_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_dc_type ON data_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_dc_active ON data_consents(is_active);

-- Data subject requests (Art. 14, 20, 21 152-ФЗ)
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    request_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    description TEXT,
    response_text TEXT,
    completed_at TIMESTAMPTZ,
    deadline_at TIMESTAMPTZ NOT NULL,
    processed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_dsr_org ON data_subject_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_dsr_user ON data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsr_deadline ON data_subject_requests(deadline_at);

-- Privacy policies
CREATE TABLE IF NOT EXISTS privacy_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    version_number VARCHAR(20) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_pp_org ON privacy_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_pp_current ON privacy_policies(is_current);

-- PII access audit log
CREATE TABLE IF NOT EXISTS pii_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    access_type VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_pal_org ON pii_access_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_pal_entity ON pii_access_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pal_user ON pii_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pal_accessed ON pii_access_logs(accessed_at);
