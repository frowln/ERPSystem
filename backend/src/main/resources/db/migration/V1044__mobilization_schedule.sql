-- Mobilization schedule: people + equipment planning for project phases
CREATE TABLE IF NOT EXISTS mobilization_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    name VARCHAR(500),
    phase VARCHAR(30) NOT NULL DEFAULT 'PRE_MOBILIZATION',
    start_date DATE,
    end_date DATE,
    total_personnel_cost NUMERIC(18,2) DEFAULT 0,
    total_equipment_cost NUMERIC(18,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mob_sched_project ON mobilization_schedules(project_id);

CREATE TABLE IF NOT EXISTS mobilization_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES mobilization_schedules(id) ON DELETE CASCADE,
    resource_type VARCHAR(30) NOT NULL,
    resource_name VARCHAR(500) NOT NULL,
    quantity INTEGER DEFAULT 1,
    rate NUMERIC(18,2),
    rate_unit VARCHAR(30) DEFAULT 'MONTHLY',
    start_date DATE,
    end_date DATE,
    total_cost NUMERIC(18,2),
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_mob_lines_schedule ON mobilization_lines(schedule_id);
