-- Quality Checklists: stage-based checklist execution with item-level pass/fail tracking

CREATE TABLE IF NOT EXISTS quality_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    project_id UUID NOT NULL,
    template_id UUID,
    work_type VARCHAR(50) NOT NULL,
    wbs_stage VARCHAR(255),
    location VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    inspector_id UUID,
    inspector_name VARCHAR(255),
    scheduled_date DATE,
    completed_date DATE,
    total_items INT NOT NULL DEFAULT 0,
    passed_items INT NOT NULL DEFAULT 0,
    failed_items INT NOT NULL DEFAULT 0,
    na_items INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_qcl_code ON quality_checklists(code);
CREATE INDEX IF NOT EXISTS idx_qcl_project ON quality_checklists(project_id);
CREATE INDEX IF NOT EXISTS idx_qcl_status ON quality_checklists(status);
CREATE INDEX IF NOT EXISTS idx_qcl_work_type ON quality_checklists(work_type);
CREATE INDEX IF NOT EXISTS idx_qcl_wbs_stage ON quality_checklists(wbs_stage);

CREATE TABLE IF NOT EXISTS checklist_execution_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES quality_checklists(id),
    description VARCHAR(1000) NOT NULL,
    category VARCHAR(255),
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    result VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    photo_required BOOLEAN NOT NULL DEFAULT FALSE,
    photo_urls JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    inspector_id UUID,
    inspector_name VARCHAR(255),
    inspected_at TIMESTAMPTZ,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_cei_checklist ON checklist_execution_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_cei_result ON checklist_execution_items(result);
