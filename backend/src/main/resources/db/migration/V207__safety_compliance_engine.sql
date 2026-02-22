-- P4-04: Safety Compliance Engine with Auto-Scheduling

-- Safety Briefing Rules table
CREATE TABLE IF NOT EXISTS safety_briefing_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    role_pattern    VARCHAR(500),
    hazard_type     VARCHAR(200),
    briefing_type   VARCHAR(30) NOT NULL,
    frequency_days  INTEGER NOT NULL,
    required_certificate_types JSONB,
    description     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT DEFAULT 0,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sbr_org ON safety_briefing_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_sbr_briefing_type ON safety_briefing_rules(briefing_type);
CREATE INDEX IF NOT EXISTS idx_sbr_hazard_type ON safety_briefing_rules(hazard_type);

-- Safety Access Blocks table
CREATE TABLE IF NOT EXISTS safety_access_blocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    employee_id     UUID NOT NULL,
    reason          TEXT NOT NULL,
    blocked_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMP WITH TIME ZONE,
    resolved_by     UUID,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT DEFAULT 0,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sab_org ON safety_access_blocks(organization_id);
CREATE INDEX IF NOT EXISTS idx_sab_employee ON safety_access_blocks(employee_id);
CREATE INDEX IF NOT EXISTS idx_sab_status ON safety_access_blocks(status);
CREATE INDEX IF NOT EXISTS idx_sab_org_employee ON safety_access_blocks(organization_id, employee_id);
