-- =============================================================================
-- V37: Operations (Field Ops) module tables
-- =============================================================================

-- Sequences for auto-generated codes
CREATE SEQUENCE work_order_code_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE daily_report_code_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE field_instruction_code_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE defect_code_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Work Orders (Наряд-задания)
-- =============================================================================
CREATE TABLE work_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    code                VARCHAR(50) NOT NULL UNIQUE,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    work_type           VARCHAR(30) NOT NULL,
    location            VARCHAR(500),
    assigned_crew_id    UUID,
    foreman_id          UUID,
    planned_start       DATE,
    planned_end         DATE,
    actual_start        DATE,
    actual_end          DATE,
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    priority            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    completion_percent  INTEGER NOT NULL DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_wo_status CHECK (status IN (
        'DRAFT', 'PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'
    )),
    CONSTRAINT chk_wo_priority CHECK (priority IN (
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    )),
    CONSTRAINT chk_wo_work_type CHECK (work_type IN (
        'PREPARATION', 'EARTHWORK', 'FOUNDATION', 'WALLS', 'ROOFING',
        'FINISHING', 'ELECTRICAL', 'PLUMBING', 'HVAC', 'OTHER'
    )),
    CONSTRAINT chk_wo_completion CHECK (completion_percent >= 0 AND completion_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_wo_project ON work_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_wo_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_wo_foreman ON work_orders(foreman_id);
CREATE INDEX IF NOT EXISTS idx_wo_planned_start ON work_orders(planned_start);
CREATE INDEX IF NOT EXISTS idx_wo_code ON work_orders(code);
CREATE INDEX IF NOT EXISTS idx_wo_deleted ON work_orders(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Daily Reports (Ежедневные отчёты)
-- =============================================================================
CREATE TABLE daily_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id       UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    report_date         DATE NOT NULL,
    work_done           TEXT,
    issues              TEXT,
    materials_used      JSONB,
    labor_hours         NUMERIC(8, 2) DEFAULT 0,
    equipment_hours     NUMERIC(8, 2) DEFAULT 0,
    weather_impact      VARCHAR(30),
    submitted_by_id     UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_dr_weather_impact CHECK (weather_impact IS NULL OR weather_impact IN (
        'NONE', 'MINOR', 'MODERATE', 'SEVERE', 'WORK_STOPPED'
    )),
    CONSTRAINT chk_dr_labor_hours CHECK (labor_hours IS NULL OR labor_hours >= 0),
    CONSTRAINT chk_dr_equipment_hours CHECK (equipment_hours IS NULL OR equipment_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_dr_work_order ON daily_reports(work_order_id);
CREATE INDEX IF NOT EXISTS idx_dr_report_date ON daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_dr_submitted_by ON daily_reports(submitted_by_id);
CREATE INDEX IF NOT EXISTS idx_dr_deleted ON daily_reports(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_daily_reports_updated_at
    BEFORE UPDATE ON daily_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Field Instructions (Предписания)
-- =============================================================================
CREATE TABLE field_instructions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    code                VARCHAR(50) NOT NULL UNIQUE,
    title               VARCHAR(500) NOT NULL,
    content             TEXT NOT NULL,
    issued_by_id        UUID,
    received_by_id      UUID,
    due_date            DATE,
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    priority            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    response_text       TEXT,
    responded_at        TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_fi_status CHECK (status IN (
        'DRAFT', 'ISSUED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESPONDED', 'CLOSED'
    )),
    CONSTRAINT chk_fi_priority CHECK (priority IN (
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    ))
);

CREATE INDEX IF NOT EXISTS idx_fi_project ON field_instructions(project_id);
CREATE INDEX IF NOT EXISTS idx_fi_status ON field_instructions(status);
CREATE INDEX IF NOT EXISTS idx_fi_code ON field_instructions(code);
CREATE INDEX IF NOT EXISTS idx_fi_issued_by ON field_instructions(issued_by_id);
CREATE INDEX IF NOT EXISTS idx_fi_received_by ON field_instructions(received_by_id);
CREATE INDEX IF NOT EXISTS idx_fi_due_date ON field_instructions(due_date);
CREATE INDEX IF NOT EXISTS idx_fi_deleted ON field_instructions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_field_instructions_updated_at
    BEFORE UPDATE ON field_instructions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Defects (Дефекты)
-- =============================================================================
CREATE TABLE defects (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    code                VARCHAR(50) NOT NULL UNIQUE,
    title               VARCHAR(500) NOT NULL,
    description         TEXT,
    location            VARCHAR(500),
    severity            VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    photo_urls          JSONB,
    detected_by_id      UUID,
    assigned_to_id      UUID,
    fix_deadline        DATE,
    status              VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    fix_description     TEXT,
    fixed_at            TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_def_severity CHECK (severity IN (
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    )),
    CONSTRAINT chk_def_status CHECK (status IN (
        'OPEN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED', 'REJECTED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_def_project ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_def_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_def_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_def_code ON defects(code);
CREATE INDEX IF NOT EXISTS idx_def_assigned_to ON defects(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_def_detected_by ON defects(detected_by_id);
CREATE INDEX IF NOT EXISTS idx_def_deleted ON defects(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_defects_updated_at
    BEFORE UPDATE ON defects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Weather Records (Записи о погоде)
-- =============================================================================
CREATE TABLE weather_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    record_date         DATE NOT NULL,
    temperature         NUMERIC(5, 1),
    humidity            NUMERIC(5, 1),
    wind_speed          NUMERIC(5, 1),
    condition           VARCHAR(30),
    precipitation       NUMERIC(6, 1),
    is_workable         BOOLEAN NOT NULL DEFAULT TRUE,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_wr_condition CHECK (condition IS NULL OR condition IN (
        'SUNNY', 'CLOUDY', 'RAIN', 'SNOW', 'STORM', 'FOG', 'WINDY'
    ))
);

CREATE UNIQUE INDEX uq_weather_project_date ON weather_records(project_id, record_date) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_wr_project ON weather_records(project_id);
CREATE INDEX IF NOT EXISTS idx_wr_record_date ON weather_records(record_date);
CREATE INDEX IF NOT EXISTS idx_wr_deleted ON weather_records(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_weather_records_updated_at
    BEFORE UPDATE ON weather_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Shift Handovers (Передача смен)
-- =============================================================================
CREATE TABLE shift_handovers (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id              UUID NOT NULL,
    from_shift_leader_id    UUID,
    to_shift_leader_id      UUID,
    handover_date           DATE NOT NULL,
    open_items              JSONB,
    equipment_status        JSONB,
    safety_notes            TEXT,
    acknowledged            BOOLEAN NOT NULL DEFAULT FALSE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sh_project ON shift_handovers(project_id);
CREATE INDEX IF NOT EXISTS idx_sh_handover_date ON shift_handovers(handover_date);
CREATE INDEX IF NOT EXISTS idx_sh_from_leader ON shift_handovers(from_shift_leader_id);
CREATE INDEX IF NOT EXISTS idx_sh_to_leader ON shift_handovers(to_shift_leader_id);
CREATE INDEX IF NOT EXISTS idx_sh_deleted ON shift_handovers(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_shift_handovers_updated_at
    BEFORE UPDATE ON shift_handovers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
