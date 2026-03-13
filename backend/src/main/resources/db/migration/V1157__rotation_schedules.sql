-- P1-HR-5: Rotation schedules for shift work (вахтовый метод, гл. 47 ТК РФ)
CREATE TABLE IF NOT EXISTS rotation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    project_id UUID,
    shift_start DATE NOT NULL,
    shift_end DATE NOT NULL,
    work_days INTEGER NOT NULL,
    rest_days INTEGER NOT NULL,
    shift_bonus_percent DOUBLE PRECISION,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    notes VARCHAR(1000),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rotation_org ON rotation_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_rotation_employee ON rotation_schedules(employee_id);
