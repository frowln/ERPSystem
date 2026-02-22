CREATE TABLE IF NOT EXISTS multi_project_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID NOT NULL,
    project_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    allocation_percent INTEGER NOT NULL DEFAULT 100,
    role VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_mpa_org ON multi_project_allocations(organization_id) WHERE deleted = false;
CREATE INDEX idx_mpa_resource ON multi_project_allocations(resource_id) WHERE deleted = false;
CREATE INDEX idx_mpa_project ON multi_project_allocations(project_id) WHERE deleted = false;
CREATE INDEX idx_mpa_dates ON multi_project_allocations(start_date, end_date) WHERE deleted = false;
CREATE INDEX idx_mpa_resource_type ON multi_project_allocations(resource_type) WHERE deleted = false;
