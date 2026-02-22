-- Portal KS-2 Drafts
CREATE TABLE IF NOT EXISTS portal_ks2_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    portal_user_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NOT NULL,
    contract_id VARCHAR(255),
    draft_number VARCHAR(100),
    reporting_period_start DATE,
    reporting_period_end DATE,
    total_amount NUMERIC(19,2),
    work_description TEXT,
    lines_json TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMP WITH TIME ZONE,
    review_comment TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    linked_ks2_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_pks2d_org ON portal_ks2_drafts(organization_id) WHERE deleted = false;
CREATE INDEX idx_pks2d_portal_user ON portal_ks2_drafts(portal_user_id) WHERE deleted = false;
CREATE INDEX idx_pks2d_project ON portal_ks2_drafts(project_id) WHERE deleted = false;
CREATE INDEX idx_pks2d_status ON portal_ks2_drafts(status) WHERE deleted = false;

-- Portal Tasks
CREATE TABLE IF NOT EXISTS portal_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    portal_user_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_by_id VARCHAR(255),
    completion_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_pt_org ON portal_tasks(organization_id) WHERE deleted = false;
CREATE INDEX idx_pt_portal_user ON portal_tasks(portal_user_id) WHERE deleted = false;
CREATE INDEX idx_pt_project ON portal_tasks(project_id) WHERE deleted = false;
CREATE INDEX idx_pt_status ON portal_tasks(status) WHERE deleted = false;

-- Add upload capability tracking to portal_documents
ALTER TABLE portal_documents ADD COLUMN IF NOT EXISTS uploaded_by_portal_user BOOLEAN DEFAULT false;
ALTER TABLE portal_documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(500);
ALTER TABLE portal_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE portal_documents ADD COLUMN IF NOT EXISTS title VARCHAR(500);
ALTER TABLE portal_documents ADD COLUMN IF NOT EXISTS description TEXT;
