-- =============================================================================
-- Plan-Fact Lines (Строки план-факта)
-- =============================================================================
CREATE TABLE plan_fact_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL,
    sequence            INTEGER DEFAULT 0,
    category            VARCHAR(20) NOT NULL,
    plan_amount         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    fact_amount         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    variance            NUMERIC(18, 2),
    variance_percent    NUMERIC(10, 2),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_pf_category CHECK (category IN ('REVENUE', 'COST', 'MARGIN', 'MATERIALS', 'LABOR', 'EQUIPMENT', 'OVERHEAD')),
    CONSTRAINT chk_pf_plan_amount CHECK (plan_amount >= 0),
    CONSTRAINT chk_pf_fact_amount CHECK (fact_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pf_project ON plan_fact_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_pf_category ON plan_fact_lines(category);
CREATE INDEX IF NOT EXISTS idx_pf_active ON plan_fact_lines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_plan_fact_lines_updated_at
    BEFORE UPDATE ON plan_fact_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
