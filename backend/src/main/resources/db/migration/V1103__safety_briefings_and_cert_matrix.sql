-- V100: Safety Briefings Journal (GOST 12.0.004-2015) and Certification Matrix enhancements

-- Safety Briefings table
CREATE TABLE IF NOT EXISTS safety_briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID,
    briefing_type VARCHAR(30) NOT NULL,
    briefing_date DATE NOT NULL,
    instructor_id UUID,
    instructor_name VARCHAR(300),
    topic VARCHAR(1000),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    next_briefing_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sb_org ON safety_briefings(organization_id);
CREATE INDEX IF NOT EXISTS idx_sb_type ON safety_briefings(briefing_type);
CREATE INDEX IF NOT EXISTS idx_sb_date ON safety_briefings(briefing_date);
CREATE INDEX IF NOT EXISTS idx_sb_project ON safety_briefings(project_id);
CREATE INDEX IF NOT EXISTS idx_sb_instructor ON safety_briefings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_sb_status ON safety_briefings(status);

-- Briefing Attendees table
CREATE TABLE IF NOT EXISTS briefing_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id UUID NOT NULL REFERENCES safety_briefings(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(300),
    signed BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ba_briefing ON briefing_attendees(briefing_id);
CREATE INDEX IF NOT EXISTS idx_ba_employee ON briefing_attendees(employee_id);
