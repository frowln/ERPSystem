-- Client Portal Enhancements: Progress Snapshots, Document Signatures, Milestones

-- ============================================================
-- 1. client_progress_snapshots — weekly/monthly progress updates
-- ============================================================
CREATE TABLE client_progress_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    overall_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    description TEXT,
    milestone_summary_json TEXT,
    photo_report_json TEXT,
    weather_notes TEXT,
    created_by_user_id UUID,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_cps_org ON client_progress_snapshots(organization_id);
CREATE INDEX idx_cps_project ON client_progress_snapshots(project_id);
CREATE INDEX idx_cps_date ON client_progress_snapshots(snapshot_date DESC);
CREATE INDEX idx_cps_published ON client_progress_snapshots(project_id, is_published) WHERE deleted = false;

-- ============================================================
-- 2. client_document_signatures — documents requiring client signature
-- ============================================================
CREATE TABLE client_document_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    portal_user_id UUID NOT NULL,
    document_id UUID,
    document_title VARCHAR(500) NOT NULL,
    document_url VARCHAR(2000),
    signature_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    signed_at TIMESTAMPTZ,
    rejected_reason TEXT,
    expires_at TIMESTAMPTZ,
    reminder_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_cds_org ON client_document_signatures(organization_id);
CREATE INDEX idx_cds_project ON client_document_signatures(project_id);
CREATE INDEX idx_cds_portal_user ON client_document_signatures(portal_user_id);
CREATE INDEX idx_cds_status ON client_document_signatures(signature_status);
CREATE INDEX idx_cds_expires ON client_document_signatures(expires_at) WHERE signature_status = 'PENDING';

-- ============================================================
-- 3. client_milestones — project milestones visible to client
-- ============================================================
CREATE TABLE client_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    target_date DATE,
    actual_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'UPCOMING',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_visible_to_client BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_cm_org ON client_milestones(organization_id);
CREATE INDEX idx_cm_project ON client_milestones(project_id);
CREATE INDEX idx_cm_status ON client_milestones(status);
CREATE INDEX idx_cm_visible ON client_milestones(project_id, is_visible_to_client) WHERE deleted = false;
CREATE INDEX idx_cm_target_date ON client_milestones(target_date);
