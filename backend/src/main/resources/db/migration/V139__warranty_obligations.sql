-- P3-08: Warranty obligations
CREATE TABLE IF NOT EXISTS warranty_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    handover_package_id UUID,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    system VARCHAR(100),
    warranty_start_date DATE NOT NULL,
    warranty_end_date DATE NOT NULL,
    contractor_name VARCHAR(255),
    contractor_contact_info TEXT,
    coverage_terms TEXT,
    exclusions TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_warranty_obl_org ON warranty_obligations(organization_id);
CREATE INDEX IF NOT EXISTS idx_warranty_obl_project ON warranty_obligations(project_id);
CREATE INDEX IF NOT EXISTS idx_warranty_obl_status ON warranty_obligations(status);
CREATE INDEX IF NOT EXISTS idx_warranty_obl_end_date ON warranty_obligations(warranty_end_date);
CREATE INDEX IF NOT EXISTS idx_warranty_obl_handover ON warranty_obligations(handover_package_id);
