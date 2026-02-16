-- =============================================================================
-- V69: Maintenance module tables
-- =============================================================================

-- =============================================================================
-- Maintenance stages table
-- =============================================================================
CREATE TABLE maintenance_stages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    sequence            INTEGER NOT NULL,
    is_closed           BOOLEAN NOT NULL DEFAULT FALSE,
    description         VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_maint_stage_sequence CHECK (sequence >= 0)
);

CREATE INDEX IF NOT EXISTS idx_maint_stage_sequence ON maintenance_stages(sequence);
CREATE INDEX IF NOT EXISTS idx_maint_stage_closed ON maintenance_stages(is_closed);
CREATE INDEX IF NOT EXISTS idx_maint_stage_active ON maintenance_stages(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_maintenance_stages_updated_at
    BEFORE UPDATE ON maintenance_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Maintenance teams table
-- =============================================================================
CREATE TABLE maintenance_teams (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(200) NOT NULL,
    lead_id             UUID REFERENCES users(id),
    color               VARCHAR(20),
    member_ids          TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_maint_team_name ON maintenance_teams(name);
CREATE INDEX IF NOT EXISTS idx_maint_team_lead ON maintenance_teams(lead_id);
CREATE INDEX IF NOT EXISTS idx_maint_team_active ON maintenance_teams(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_maintenance_teams_updated_at
    BEFORE UPDATE ON maintenance_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Maintenance equipment table
-- =============================================================================
CREATE TABLE maintenance_equipment (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                        VARCHAR(300) NOT NULL,
    serial_number               VARCHAR(100),
    model                       VARCHAR(200),
    category                    VARCHAR(100),
    assigned_to                 UUID REFERENCES users(id),
    location                    VARCHAR(500),
    purchase_date               DATE,
    warranty_date               DATE,
    cost                        NUMERIC(18, 2),
    status                      VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL',
    notes                       TEXT,
    last_maintenance_date       DATE,
    next_maintenance_date       DATE,
    maintenance_frequency_days  INTEGER NOT NULL DEFAULT 0,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_maint_equip_status CHECK (status IN (
        'OPERATIONAL', 'NEEDS_REPAIR', 'OUT_OF_SERVICE', 'DECOMMISSIONED'
    )),
    CONSTRAINT chk_maint_equip_cost CHECK (cost IS NULL OR cost >= 0),
    CONSTRAINT chk_maint_equip_freq CHECK (maintenance_frequency_days >= 0)
);

CREATE INDEX IF NOT EXISTS idx_maint_equip_serial ON maintenance_equipment(serial_number);
CREATE INDEX IF NOT EXISTS idx_maint_equip_status ON maintenance_equipment(status);
CREATE INDEX IF NOT EXISTS idx_maint_equip_category ON maintenance_equipment(category);
CREATE INDEX IF NOT EXISTS idx_maint_equip_assigned ON maintenance_equipment(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maint_equip_next_maint ON maintenance_equipment(next_maintenance_date);
CREATE INDEX IF NOT EXISTS idx_maint_equip_warranty ON maintenance_equipment(warranty_date);
CREATE INDEX IF NOT EXISTS idx_maint_equip_active ON maintenance_equipment(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_maintenance_equipment_updated_at
    BEFORE UPDATE ON maintenance_equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Maintenance requests table
-- =============================================================================
CREATE TABLE maintenance_requests (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    description             TEXT,
    request_date            DATE NOT NULL,
    equipment_id            UUID REFERENCES maintenance_equipment(id),
    equipment_name          VARCHAR(300),
    maintenance_team_id     UUID REFERENCES maintenance_teams(id),
    responsible_id          UUID REFERENCES users(id),
    stage_id                UUID REFERENCES maintenance_stages(id),
    priority                VARCHAR(10) NOT NULL DEFAULT 'NORMAL',
    maintenance_type        VARCHAR(20) NOT NULL DEFAULT 'CORRECTIVE',
    duration                NUMERIC(10, 2),
    scheduled_date          DATE,
    completed_date          DATE,
    notes                   TEXT,
    cost                    NUMERIC(18, 2),
    status                  VARCHAR(20) NOT NULL DEFAULT 'NEW',
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_maint_req_priority CHECK (priority IN (
        'LOW', 'NORMAL', 'HIGH', 'URGENT'
    )),
    CONSTRAINT chk_maint_req_type CHECK (maintenance_type IN (
        'CORRECTIVE', 'PREVENTIVE', 'PREDICTIVE'
    )),
    CONSTRAINT chk_maint_req_status CHECK (status IN (
        'NEW', 'IN_PROGRESS', 'REPAIRED', 'SCRAP'
    )),
    CONSTRAINT chk_maint_req_duration CHECK (duration IS NULL OR duration >= 0),
    CONSTRAINT chk_maint_req_cost CHECK (cost IS NULL OR cost >= 0),
    CONSTRAINT chk_maint_req_completed_after_request CHECK (
        completed_date IS NULL OR completed_date >= request_date
    )
);

CREATE INDEX IF NOT EXISTS idx_maint_req_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maint_req_equipment ON maintenance_requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maint_req_team ON maintenance_requests(maintenance_team_id);
CREATE INDEX IF NOT EXISTS idx_maint_req_responsible ON maintenance_requests(responsible_id);
CREATE INDEX IF NOT EXISTS idx_maint_req_stage ON maintenance_requests(stage_id);
CREATE INDEX IF NOT EXISTS idx_maint_req_priority ON maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maint_req_type ON maintenance_requests(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maint_req_scheduled ON maintenance_requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maint_req_request_date ON maintenance_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_maint_req_active ON maintenance_requests(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_maintenance_requests_updated_at
    BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Preventive schedules table
-- =============================================================================
CREATE TABLE preventive_schedules (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id            UUID NOT NULL REFERENCES maintenance_equipment(id),
    maintenance_team_id     UUID REFERENCES maintenance_teams(id),
    name                    VARCHAR(300) NOT NULL,
    frequency_type          VARCHAR(10) NOT NULL,
    frequency_interval      INTEGER NOT NULL,
    next_execution          DATE,
    last_execution          DATE,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    description             TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_prev_sched_freq_type CHECK (frequency_type IN (
        'DAYS', 'WEEKS', 'MONTHS', 'YEARS'
    )),
    CONSTRAINT chk_prev_sched_interval CHECK (frequency_interval > 0)
);

CREATE INDEX IF NOT EXISTS idx_prev_sched_equipment ON preventive_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_prev_sched_team ON preventive_schedules(maintenance_team_id);
CREATE INDEX IF NOT EXISTS idx_prev_sched_next_exec ON preventive_schedules(next_execution);
CREATE INDEX IF NOT EXISTS idx_prev_sched_active ON preventive_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_prev_sched_not_deleted ON preventive_schedules(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_preventive_schedules_updated_at
    BEFORE UPDATE ON preventive_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Seed default maintenance stages
-- =============================================================================
INSERT INTO maintenance_stages (id, name, sequence, is_closed, description) VALUES
    (uuid_generate_v4(), 'New', 0, FALSE, 'Request has been created'),
    (uuid_generate_v4(), 'Diagnosed', 1, FALSE, 'Issue has been diagnosed'),
    (uuid_generate_v4(), 'In Repair', 2, FALSE, 'Repair work is in progress'),
    (uuid_generate_v4(), 'Quality Check', 3, FALSE, 'Repair completed, awaiting quality verification'),
    (uuid_generate_v4(), 'Done', 4, TRUE, 'Maintenance completed and verified');
