-- P4-11: Visual Report Builder
-- Report templates and execution history for the visual report builder

CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    data_source VARCHAR(100) NOT NULL,
    columns_json TEXT DEFAULT '[]',
    filters_json TEXT DEFAULT '[]',
    group_by_json TEXT DEFAULT '[]',
    sort_by_json TEXT DEFAULT '[]',
    chart_type VARCHAR(50) DEFAULT 'NONE',
    chart_config_json TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    schedule_enabled BOOLEAN NOT NULL DEFAULT false,
    schedule_cron VARCHAR(100),
    schedule_recipients TEXT DEFAULT '[]',
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_by_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

-- Compatibility with legacy regulatory report_templates table (V40)
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS data_source VARCHAR(100);
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS created_by_id UUID;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS columns_json TEXT DEFAULT '[]';
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS filters_json TEXT DEFAULT '[]';
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS group_by_json TEXT DEFAULT '[]';
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS sort_by_json TEXT DEFAULT '[]';
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS chart_type VARCHAR(50) DEFAULT 'NONE';
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS chart_config_json TEXT;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS schedule_cron VARCHAR(100);
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS schedule_recipients TEXT DEFAULT '[]';
ALTER TABLE report_templates ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE;

UPDATE report_templates
SET organization_id = COALESCE(
    organization_id,
    (SELECT id FROM organizations WHERE deleted = false ORDER BY created_at LIMIT 1)
)
WHERE organization_id IS NULL;

UPDATE report_templates
SET data_source = COALESCE(data_source, 'CUSTOM')
WHERE data_source IS NULL;

CREATE INDEX IF NOT EXISTS idx_rt_org ON report_templates(organization_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_rt_source ON report_templates(data_source) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_rt_created_by_id ON report_templates(created_by_id) WHERE deleted = false;

CREATE TABLE IF NOT EXISTS report_builder_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    template_id UUID NOT NULL,
    executed_by_id UUID,
    parameters_json TEXT DEFAULT '{}',
    row_count INTEGER,
    execution_time_ms BIGINT,
    output_format VARCHAR(50) DEFAULT 'JSON',
    output_path VARCHAR(1000),
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE report_builder_executions ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE report_builder_executions ADD COLUMN IF NOT EXISTS template_id UUID;

UPDATE report_builder_executions
SET organization_id = COALESCE(
    organization_id,
    (SELECT id FROM organizations WHERE deleted = false ORDER BY created_at LIMIT 1)
)
WHERE organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_rbe_org ON report_builder_executions(organization_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_rbe_template ON report_builder_executions(template_id) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_rbe_status ON report_builder_executions(status) WHERE deleted = false;
