-- =============================================================================
-- Sequence for quality check codes (QC-00001, QC-00002, etc.)
-- =============================================================================
CREATE SEQUENCE quality_check_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Sequence for non-conformance codes (NCR-00001, NCR-00002, etc.)
-- =============================================================================
CREATE SEQUENCE non_conformance_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Quality Checks (Проверки качества)
-- =============================================================================
CREATE TABLE quality_checks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(20) UNIQUE,
    project_id          UUID NOT NULL,
    task_id             UUID,
    spec_item_id        UUID,
    check_type          VARCHAR(30) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    description         TEXT,
    planned_date        DATE,
    actual_date         DATE,
    inspector_id        UUID,
    inspector_name      VARCHAR(255),
    result              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    status              VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    findings            TEXT,
    recommendations     TEXT,
    attachment_urls     JSONB DEFAULT '[]'::jsonb,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_qc_check_type CHECK (check_type IN (
        'INCOMING_MATERIAL', 'INTERMEDIATE_WORK', 'HIDDEN_WORK', 'FINAL', 'LABORATORY'
    )),
    CONSTRAINT chk_qc_result CHECK (result IN ('PASS', 'CONDITIONAL_PASS', 'FAIL', 'PENDING')),
    CONSTRAINT chk_qc_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_qc_code ON quality_checks(code);
CREATE INDEX IF NOT EXISTS idx_qc_project ON quality_checks(project_id);
CREATE INDEX IF NOT EXISTS idx_qc_status ON quality_checks(status);
CREATE INDEX IF NOT EXISTS idx_qc_result ON quality_checks(result);
CREATE INDEX IF NOT EXISTS idx_qc_check_type ON quality_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_qc_planned_date ON quality_checks(planned_date);
CREATE INDEX IF NOT EXISTS idx_qc_active ON quality_checks(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_quality_checks_updated_at
    BEFORE UPDATE ON quality_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Non-Conformances (Несоответствия)
-- =============================================================================
CREATE TABLE non_conformances (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(20) UNIQUE,
    quality_check_id    UUID REFERENCES quality_checks(id) ON DELETE SET NULL,
    project_id          UUID NOT NULL,
    severity            VARCHAR(20) NOT NULL,
    description         TEXT NOT NULL,
    root_cause          TEXT,
    corrective_action   TEXT,
    preventive_action   TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    responsible_id      UUID,
    due_date            DATE,
    resolved_date       DATE,
    cost                NUMERIC(18, 2) DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_nc_severity CHECK (severity IN ('MINOR', 'MAJOR', 'CRITICAL')),
    CONSTRAINT chk_nc_status CHECK (status IN (
        'OPEN', 'INVESTIGATING', 'CORRECTIVE_ACTION', 'VERIFIED', 'CLOSED'
    )),
    CONSTRAINT chk_nc_cost CHECK (cost IS NULL OR cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_nc_code ON non_conformances(code);
CREATE INDEX IF NOT EXISTS idx_nc_quality_check ON non_conformances(quality_check_id);
CREATE INDEX IF NOT EXISTS idx_nc_project ON non_conformances(project_id);
CREATE INDEX IF NOT EXISTS idx_nc_status ON non_conformances(status);
CREATE INDEX IF NOT EXISTS idx_nc_severity ON non_conformances(severity);
CREATE INDEX IF NOT EXISTS idx_nc_due_date ON non_conformances(due_date);
CREATE INDEX IF NOT EXISTS idx_nc_active ON non_conformances(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_non_conformances_updated_at
    BEFORE UPDATE ON non_conformances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Quality Certificates (Сертификаты качества)
-- =============================================================================
CREATE TABLE quality_certificates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id         UUID,
    supplier_id         UUID,
    supplier_name       VARCHAR(500),
    certificate_number  VARCHAR(100) NOT NULL,
    issue_date          DATE NOT NULL,
    expiry_date         DATE,
    certificate_type    VARCHAR(30) NOT NULL,
    file_url            VARCHAR(1000),
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by_id      UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_cert_type CHECK (certificate_type IN (
        'GOST', 'TU', 'ISO', 'CONFORMITY', 'FIRE_SAFETY', 'SANITARY'
    ))
);

CREATE INDEX IF NOT EXISTS idx_cert_material ON quality_certificates(material_id);
CREATE INDEX IF NOT EXISTS idx_cert_supplier ON quality_certificates(supplier_id);
CREATE INDEX IF NOT EXISTS idx_cert_type ON quality_certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_cert_number ON quality_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_cert_expiry ON quality_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_cert_active ON quality_certificates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_quality_certificates_updated_at
    BEFORE UPDATE ON quality_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
