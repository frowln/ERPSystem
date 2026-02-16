-- =============================================================================
-- Sequence for incident numbers (INC-00001, INC-00002, etc.)
-- =============================================================================
CREATE SEQUENCE incident_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Sequence for inspection numbers (INS-00001, INS-00002, etc.)
-- =============================================================================
CREATE SEQUENCE inspection_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Safety Incidents (Инциденты по безопасности)
-- =============================================================================
CREATE TABLE safety_incidents (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number                  VARCHAR(20) UNIQUE,
    incident_date           TIMESTAMP WITH TIME ZONE NOT NULL,
    project_id              UUID,
    location_description    VARCHAR(500),
    severity                VARCHAR(20) NOT NULL,
    incident_type           VARCHAR(30) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
    description             TEXT NOT NULL,
    root_cause              TEXT,
    corrective_action       TEXT,
    reported_by_id          UUID,
    reported_by_name        VARCHAR(255),
    investigator_id         UUID,
    investigator_name       VARCHAR(255),
    injured_employee_id     UUID,
    injured_employee_name   VARCHAR(255),
    witness_names           TEXT,
    work_days_lost          INTEGER DEFAULT 0,
    medical_treatment       BOOLEAN DEFAULT FALSE,
    hospitalization         BOOLEAN DEFAULT FALSE,
    resolved_at             TIMESTAMP WITH TIME ZONE,
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_incident_severity CHECK (severity IN ('MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL', 'FATAL')),
    CONSTRAINT chk_incident_type CHECK (incident_type IN (
        'INJURY', 'NEAR_MISS', 'PROPERTY_DAMAGE', 'ENVIRONMENTAL', 'FIRE', 'FALL', 'ELECTRICAL', 'OTHER'
    )),
    CONSTRAINT chk_incident_status CHECK (status IN (
        'REPORTED', 'UNDER_INVESTIGATION', 'CORRECTIVE_ACTION', 'RESOLVED', 'CLOSED'
    )),
    CONSTRAINT chk_incident_work_days CHECK (work_days_lost IS NULL OR work_days_lost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_incident_date ON safety_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_incident_project ON safety_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_incident_status ON safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incident_severity ON safety_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incident_number ON safety_incidents(number);
CREATE INDEX IF NOT EXISTS idx_incident_active ON safety_incidents(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_safety_incidents_updated_at
    BEFORE UPDATE ON safety_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Safety Inspections (Проверки по безопасности)
-- =============================================================================
CREATE TABLE safety_inspections (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number                  VARCHAR(20) UNIQUE,
    inspection_date         DATE NOT NULL,
    project_id              UUID,
    inspector_id            UUID,
    inspector_name          VARCHAR(255),
    inspection_type         VARCHAR(20) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    overall_rating          VARCHAR(20),
    findings                TEXT,
    recommendations         TEXT,
    next_inspection_date    DATE,
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_inspection_type CHECK (inspection_type IN ('ROUTINE', 'UNSCHEDULED', 'FOLLOWUP', 'REGULATORY')),
    CONSTRAINT chk_inspection_status CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_inspection_rating CHECK (overall_rating IS NULL OR overall_rating IN (
        'SATISFACTORY', 'NEEDS_IMPROVEMENT', 'UNSATISFACTORY', 'CRITICAL'
    ))
);

CREATE INDEX IF NOT EXISTS idx_inspection_date ON safety_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspection_project ON safety_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspection_status ON safety_inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspection_number ON safety_inspections(number);
CREATE INDEX IF NOT EXISTS idx_inspection_active ON safety_inspections(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_safety_inspections_updated_at
    BEFORE UPDATE ON safety_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Safety Violations (Нарушения по безопасности)
-- =============================================================================
CREATE TABLE safety_violations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id       UUID REFERENCES safety_inspections(id) ON DELETE SET NULL,
    incident_id         UUID REFERENCES safety_incidents(id) ON DELETE SET NULL,
    description         TEXT NOT NULL,
    severity            VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    due_date            DATE,
    assigned_to_id      UUID,
    assigned_to_name    VARCHAR(255),
    resolved_at         TIMESTAMP WITH TIME ZONE,
    resolution          TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_violation_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_violation_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'OVERDUE'))
);

CREATE INDEX IF NOT EXISTS idx_violation_inspection ON safety_violations(inspection_id);
CREATE INDEX IF NOT EXISTS idx_violation_incident ON safety_violations(incident_id);
CREATE INDEX IF NOT EXISTS idx_violation_status ON safety_violations(status);
CREATE INDEX IF NOT EXISTS idx_violation_due_date ON safety_violations(due_date);
CREATE INDEX IF NOT EXISTS idx_violation_active ON safety_violations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_safety_violations_updated_at
    BEFORE UPDATE ON safety_violations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
