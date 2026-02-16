-- =============================================================================
-- V65: PTO extended tables (KS-6, KS-6a, KS-11, hidden work acts,
--      safety trainings, safety certificates)
-- =============================================================================

-- -------------------------------------------------------
-- KS-6: Journal of executed works
-- -------------------------------------------------------
CREATE TABLE ks6_journals (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL REFERENCES projects(id),
    start_date              DATE NOT NULL,
    responsible_engineer    VARCHAR(255),
    status                  VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_ks6_status CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_ks6_project ON ks6_journals(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_ks6_status ON ks6_journals(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_ks6_active ON ks6_journals(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ks6_journals_updated_at
    BEFORE UPDATE ON ks6_journals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- KS-6a: Monthly work volume log records
-- -------------------------------------------------------
CREATE TABLE ks6a_records (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ks6_journal_id          UUID NOT NULL REFERENCES ks6_journals(id) ON DELETE CASCADE,
    month_year              DATE NOT NULL,
    work_name               VARCHAR(500) NOT NULL,
    unit                    VARCHAR(50),
    planned_volume          NUMERIC(15,3),
    first_decade            NUMERIC(15,3) DEFAULT 0,
    second_decade           NUMERIC(15,3) DEFAULT 0,
    third_decade            NUMERIC(15,3) DEFAULT 0,
    total_actual            NUMERIC(15,3) DEFAULT 0,
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_ks6a_volumes CHECK (
        (planned_volume IS NULL OR planned_volume >= 0) AND
        (first_decade IS NULL OR first_decade >= 0) AND
        (second_decade IS NULL OR second_decade >= 0) AND
        (third_decade IS NULL OR third_decade >= 0) AND
        (total_actual IS NULL OR total_actual >= 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_ks6a_journal ON ks6a_records(ks6_journal_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_ks6a_month ON ks6a_records(month_year);
CREATE INDEX IF NOT EXISTS idx_ks6a_active ON ks6a_records(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ks6a_records_updated_at
    BEFORE UPDATE ON ks6a_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- KS-11: Acceptance acts (Акт приёмки объекта)
-- -------------------------------------------------------
CREATE TABLE ks11_acceptance_acts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL REFERENCES projects(id),
    act_date                DATE NOT NULL,
    commission_members      JSONB NOT NULL DEFAULT '[]',
    decision                VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    defects                 TEXT,
    notes                   TEXT,
    status                  VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_ks11_status CHECK (status IN ('DRAFT', 'IN_REVIEW', 'SIGNED', 'REJECTED', 'ARCHIVED')),
    CONSTRAINT chk_ks11_decision CHECK (decision IN ('PENDING', 'ACCEPTED', 'ACCEPTED_WITH_REMARKS', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_ks11_project ON ks11_acceptance_acts(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_ks11_status ON ks11_acceptance_acts(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_ks11_date ON ks11_acceptance_acts(act_date);
CREATE INDEX IF NOT EXISTS idx_ks11_active ON ks11_acceptance_acts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ks11_acceptance_acts_updated_at
    BEFORE UPDATE ON ks11_acceptance_acts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Hidden work acts (Акты скрытых работ)
-- -------------------------------------------------------
CREATE TABLE hidden_work_acts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL REFERENCES projects(id),
    act_date                DATE NOT NULL,
    work_description        TEXT NOT NULL,
    location                VARCHAR(500),
    inspector_id            UUID REFERENCES users(id),
    contractor_id           UUID REFERENCES users(id),
    status                  VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    photo_ids               JSONB NOT NULL DEFAULT '[]',
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_hidden_work_status CHECK (status IN ('DRAFT', 'IN_REVIEW', 'ON_SIGNING', 'SIGNED', 'REJECTED', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_hidden_work_project ON hidden_work_acts(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_hidden_work_status ON hidden_work_acts(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_hidden_work_inspector ON hidden_work_acts(inspector_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_hidden_work_date ON hidden_work_acts(act_date);
CREATE INDEX IF NOT EXISTS idx_hidden_work_active ON hidden_work_acts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_hidden_work_acts_updated_at
    BEFORE UPDATE ON hidden_work_acts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Safety trainings (Инструктажи по ТБ)
-- -------------------------------------------------------
CREATE TABLE safety_trainings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title                   VARCHAR(500) NOT NULL,
    type                    VARCHAR(50) NOT NULL,
    project_id              UUID REFERENCES projects(id),
    training_date           DATE NOT NULL,
    instructor              VARCHAR(255) NOT NULL,
    participants            JSONB NOT NULL DEFAULT '[]',
    topics                  TEXT,
    duration_hours          NUMERIC(5,2),
    status                  VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_training_type CHECK (type IN ('INTRODUCTORY', 'PRIMARY', 'REPEATED', 'UNSCHEDULED', 'TARGETED', 'FIRE_SAFETY')),
    CONSTRAINT chk_training_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_training_duration CHECK (duration_hours IS NULL OR duration_hours > 0)
);

CREATE INDEX IF NOT EXISTS idx_training_project ON safety_trainings(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_training_type ON safety_trainings(type) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_training_date ON safety_trainings(training_date);
CREATE INDEX IF NOT EXISTS idx_training_status ON safety_trainings(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_training_active ON safety_trainings(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_safety_trainings_updated_at
    BEFORE UPDATE ON safety_trainings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- Safety certificates (Удостоверения по ТБ)
-- -------------------------------------------------------
CREATE TABLE safety_certificates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id             UUID NOT NULL REFERENCES users(id),
    type                    VARCHAR(100) NOT NULL,
    number                  VARCHAR(100) NOT NULL,
    issue_date              DATE NOT NULL,
    expiry_date             DATE NOT NULL,
    issuing_authority       VARCHAR(500) NOT NULL,
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_cert_dates CHECK (expiry_date > issue_date),
    CONSTRAINT uq_cert_number UNIQUE (number)
);

CREATE INDEX IF NOT EXISTS idx_cert_employee ON safety_certificates(employee_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_cert_type ON safety_certificates(type) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_cert_expiry ON safety_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_cert_active ON safety_certificates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_safety_certificates_updated_at
    BEFORE UPDATE ON safety_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
