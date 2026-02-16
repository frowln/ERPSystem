-- =============================================================================
-- V64: Monthly Schedule (Месячный график работ) tables
-- =============================================================================

CREATE TABLE monthly_schedules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id),
    year                INTEGER NOT NULL,
    month               INTEGER NOT NULL,
    status              VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    approved_by_id      UUID REFERENCES users(id),
    approved_at         TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_schedule_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CLOSED')),
    CONSTRAINT chk_schedule_month CHECK (month BETWEEN 1 AND 12),
    CONSTRAINT chk_schedule_year CHECK (year BETWEEN 2000 AND 2100),
    CONSTRAINT uq_schedule_project_period UNIQUE (project_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_schedules_project ON monthly_schedules(project_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_schedules_status ON monthly_schedules(status) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_schedules_period ON monthly_schedules(year, month);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON monthly_schedules(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_monthly_schedules_updated_at
    BEFORE UPDATE ON monthly_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE monthly_schedule_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id         UUID NOT NULL REFERENCES monthly_schedules(id) ON DELETE CASCADE,
    work_name           VARCHAR(500) NOT NULL,
    unit                VARCHAR(50),
    planned_volume      NUMERIC(15,3),
    actual_volume       NUMERIC(15,3) DEFAULT 0,
    start_date          DATE,
    end_date            DATE,
    responsible         VARCHAR(255),
    notes               TEXT,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_schedule_line_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_schedule_line_volumes CHECK (planned_volume IS NULL OR planned_volume >= 0),
    CONSTRAINT chk_schedule_line_actual CHECK (actual_volume IS NULL OR actual_volume >= 0)
);

CREATE INDEX IF NOT EXISTS idx_schedule_lines_schedule ON monthly_schedule_lines(schedule_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_schedule_lines_sort ON monthly_schedule_lines(schedule_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_schedule_lines_active ON monthly_schedule_lines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_monthly_schedule_lines_updated_at
    BEFORE UPDATE ON monthly_schedule_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
