CREATE TABLE client_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    -- Claim details
    claim_number VARCHAR(50),
    unit_number VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    location_description TEXT,
    -- Photos
    photos_json TEXT,
    -- Workflow
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    -- Assignment
    assigned_contractor_id UUID,
    assigned_contractor_name VARCHAR(255),
    assigned_at TIMESTAMPTZ,
    -- Reporter (portal user / resident)
    reported_by_portal_user_id UUID,
    reported_by_name VARCHAR(255),
    reported_by_phone VARCHAR(50),
    reported_by_email VARCHAR(255),
    -- SLA
    sla_deadline TIMESTAMPTZ,
    sla_breached BOOLEAN DEFAULT false,
    -- Resolution
    resolution TEXT,
    resolution_date TIMESTAMPTZ,
    resolution_accepted BOOLEAN,
    resolution_feedback TEXT,
    resolution_rating INTEGER,
    -- Warranty linkage
    warranty_obligation_id UUID,
    -- Internal notes
    internal_notes TEXT,
    triaged_at TIMESTAMPTZ,
    triaged_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_cc_org ON client_claims(organization_id);
CREATE INDEX idx_cc_project ON client_claims(project_id);
CREATE INDEX idx_cc_status ON client_claims(status);
CREATE INDEX idx_cc_priority ON client_claims(priority);
CREATE INDEX idx_cc_category ON client_claims(category);
CREATE INDEX idx_cc_contractor ON client_claims(assigned_contractor_id);
CREATE INDEX idx_cc_portal_user ON client_claims(reported_by_portal_user_id);
CREATE INDEX idx_cc_sla ON client_claims(sla_deadline) WHERE sla_breached = false AND status NOT IN ('CLOSED', 'REJECTED');
CREATE INDEX idx_cc_number ON client_claims(claim_number);

-- Claim activity log (comments, status changes, photos added)
CREATE TABLE client_claim_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES client_claims(id),
    activity_type VARCHAR(30) NOT NULL,
    author_name VARCHAR(255),
    author_type VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',
    content TEXT,
    old_value VARCHAR(100),
    new_value VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_cca_claim ON client_claim_activities(claim_id);
CREATE INDEX idx_cca_type ON client_claim_activities(activity_type);

CREATE SEQUENCE IF NOT EXISTS client_claim_number_seq START 1;
