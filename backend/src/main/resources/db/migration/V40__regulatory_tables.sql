-- =============================================================================
-- Sequences for regulatory module
-- =============================================================================
CREATE SEQUENCE regulatory_report_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE regulatory_inspection_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE prescription_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE construction_permit_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Regulatory Bodies (Регуляторные органы)
-- =============================================================================
CREATE TABLE regulatory_bodies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    code                VARCHAR(50) UNIQUE NOT NULL,
    region              VARCHAR(255),
    address             VARCHAR(500),
    contact_person      VARCHAR(255),
    phone               VARCHAR(50),
    email               VARCHAR(255),
    jurisdiction        VARCHAR(500),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_regulatory_body_code ON regulatory_bodies(code);
CREATE INDEX IF NOT EXISTS idx_regulatory_body_active ON regulatory_bodies(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_regulatory_bodies_updated_at
    BEFORE UPDATE ON regulatory_bodies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Report Templates (Шаблоны отчётов)
-- =============================================================================
CREATE TABLE report_templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type         VARCHAR(50) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    description         TEXT,
    required_fields     JSONB,
    frequency           VARCHAR(20) NOT NULL,
    template_file_url   VARCHAR(1000),
    regulations         TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_template_frequency CHECK (frequency IN ('MONTHLY', 'QUARTERLY', 'YEARLY', 'ON_DEMAND'))
);

CREATE INDEX IF NOT EXISTS idx_report_template_type ON report_templates(report_type);
CREATE INDEX IF NOT EXISTS idx_report_template_active ON report_templates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_report_templates_updated_at
    BEFORE UPDATE ON report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Regulatory Reports (Регуляторные отчёты)
-- =============================================================================
CREATE TABLE regulatory_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID,
    code                VARCHAR(50) UNIQUE,
    report_type         VARCHAR(50) NOT NULL,
    title               VARCHAR(500) NOT NULL,
    period              VARCHAR(100),
    due_date            DATE,
    submitted_at        TIMESTAMP WITH TIME ZONE,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    submitted_to_organ  VARCHAR(500),
    organ_response      TEXT,
    file_url            VARCHAR(1000),
    prepared_by_id      UUID,
    submitted_by_id     UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_report_status CHECK (status IN ('DRAFT', 'PREPARED', 'SUBMITTED', 'ACCEPTED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_reg_report_project ON regulatory_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reg_report_status ON regulatory_reports(status);
CREATE INDEX IF NOT EXISTS idx_reg_report_due_date ON regulatory_reports(due_date);
CREATE INDEX IF NOT EXISTS idx_reg_report_code ON regulatory_reports(code);
CREATE INDEX IF NOT EXISTS idx_reg_report_active ON regulatory_reports(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_regulatory_reports_updated_at
    BEFORE UPDATE ON regulatory_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Regulatory Inspections (Надзорные проверки)
-- =============================================================================
CREATE TABLE regulatory_inspections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID,
    inspection_date     DATE NOT NULL,
    inspector_name      VARCHAR(255),
    inspector_organ     VARCHAR(500),
    inspection_type     VARCHAR(20) NOT NULL,
    result              VARCHAR(20),
    violations          JSONB,
    prescriptions       JSONB,
    deadline_to_fix     DATE,
    act_number          VARCHAR(100),
    act_url             VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_reg_inspection_type CHECK (inspection_type IN ('PLANNED', 'UNPLANNED', 'FOLLOW_UP')),
    CONSTRAINT chk_reg_inspection_result CHECK (result IS NULL OR result IN ('PASS', 'VIOLATIONS', 'SUSPENSION'))
);

CREATE INDEX IF NOT EXISTS idx_reg_inspection_project ON regulatory_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_reg_inspection_date ON regulatory_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_reg_inspection_type ON regulatory_inspections(inspection_type);
CREATE INDEX IF NOT EXISTS idx_reg_inspection_active ON regulatory_inspections(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_regulatory_inspections_updated_at
    BEFORE UPDATE ON regulatory_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Prescriptions (Предписания)
-- =============================================================================
CREATE TABLE prescriptions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id       UUID REFERENCES regulatory_inspections(id) ON DELETE CASCADE,
    number              VARCHAR(50),
    description         TEXT NOT NULL,
    deadline            DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    completed_at        TIMESTAMP WITH TIME ZONE,
    evidence_url        VARCHAR(1000),
    responsible_id      UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_prescription_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'))
);

CREATE INDEX IF NOT EXISTS idx_prescription_inspection ON prescriptions(inspection_id);
CREATE INDEX IF NOT EXISTS idx_prescription_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescription_deadline ON prescriptions(deadline);
CREATE INDEX IF NOT EXISTS idx_prescription_active ON prescriptions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Construction Permits (Разрешения на строительство)
-- =============================================================================
CREATE TABLE construction_permits (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID,
    permit_number       VARCHAR(100) UNIQUE,
    issued_by           VARCHAR(500),
    issued_date         DATE,
    expires_date        DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    permit_type         VARCHAR(100),
    conditions          JSONB,
    file_url            VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_permit_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED'))
);

CREATE INDEX IF NOT EXISTS idx_construction_permit_project ON construction_permits(project_id);
CREATE INDEX IF NOT EXISTS idx_construction_permit_status ON construction_permits(status);
CREATE INDEX IF NOT EXISTS idx_construction_permit_number ON construction_permits(permit_number);
CREATE INDEX IF NOT EXISTS idx_construction_permit_active ON construction_permits(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_construction_permits_updated_at
    BEFORE UPDATE ON construction_permits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Occupancy Permits (Разрешения на ввод в эксплуатацию)
-- =============================================================================
CREATE TABLE occupancy_permits (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID,
    permit_number       VARCHAR(100) UNIQUE,
    issued_date         DATE,
    issued_by           VARCHAR(500),
    commission_members  JSONB,
    conditions          JSONB,
    file_url            VARCHAR(1000),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_occupancy_permit_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED'))
);

CREATE INDEX IF NOT EXISTS idx_occupancy_permit_project ON occupancy_permits(project_id);
CREATE INDEX IF NOT EXISTS idx_occupancy_permit_status ON occupancy_permits(status);
CREATE INDEX IF NOT EXISTS idx_occupancy_permit_number ON occupancy_permits(permit_number);
CREATE INDEX IF NOT EXISTS idx_occupancy_permit_active ON occupancy_permits(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_occupancy_permits_updated_at
    BEFORE UPDATE ON occupancy_permits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
