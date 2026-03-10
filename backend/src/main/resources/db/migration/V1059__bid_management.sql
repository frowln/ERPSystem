-- Bid Packages
CREATE TABLE IF NOT EXISTS bid_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    bid_due_date TIMESTAMP,
    scope_of_work TEXT,
    spec_sections TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_bid_pkg_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_bid_pkg_project FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_bid_pkg_org ON bid_packages(organization_id);
CREATE INDEX IF NOT EXISTS idx_bid_pkg_project ON bid_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_bid_pkg_status ON bid_packages(status);

-- Bid Invitations
CREATE TABLE IF NOT EXISTS bid_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_package_id UUID NOT NULL,
    vendor_id UUID,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_email VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'INVITED',
    invited_at TIMESTAMP DEFAULT now(),
    responded_at TIMESTAMP,
    bid_amount NUMERIC(18,2),
    bid_notes TEXT,
    attachments_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_bid_inv_pkg FOREIGN KEY (bid_package_id) REFERENCES bid_packages(id)
);

CREATE INDEX IF NOT EXISTS idx_bid_inv_pkg ON bid_invitations(bid_package_id);

-- Bid Evaluations
CREATE TABLE IF NOT EXISTS bid_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_package_id UUID NOT NULL,
    invitation_id UUID NOT NULL,
    criteria_name VARCHAR(255) NOT NULL,
    score INT,
    max_score INT DEFAULT 10,
    weight NUMERIC(5,2) DEFAULT 1.0,
    notes TEXT,
    evaluator_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_bid_eval_pkg FOREIGN KEY (bid_package_id) REFERENCES bid_packages(id),
    CONSTRAINT fk_bid_eval_inv FOREIGN KEY (invitation_id) REFERENCES bid_invitations(id)
);

CREATE INDEX IF NOT EXISTS idx_bid_eval_pkg ON bid_evaluations(bid_package_id);
CREATE INDEX IF NOT EXISTS idx_bid_eval_inv ON bid_evaluations(invitation_id);
