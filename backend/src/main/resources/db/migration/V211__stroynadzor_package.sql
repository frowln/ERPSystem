-- Stroynadzor documentation package generator
CREATE TABLE stroynadzor_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    wbs_node_id UUID,
    name VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    completeness_pct NUMERIC(5,2) DEFAULT 0,
    total_documents INTEGER DEFAULT 0,
    missing_documents INTEGER DEFAULT 0,
    missing_documents_json TEXT,
    toc_json TEXT,
    file_size_bytes BIGINT,
    generated_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    sent_to VARCHAR(500),
    error_message TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_sp_org ON stroynadzor_packages(organization_id);
CREATE INDEX idx_sp_project ON stroynadzor_packages(project_id);
CREATE INDEX idx_sp_status ON stroynadzor_packages(status);
CREATE INDEX idx_sp_wbs ON stroynadzor_packages(wbs_node_id);

CREATE TABLE stroynadzor_package_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES stroynadzor_packages(id),
    document_category VARCHAR(50) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_id UUID NOT NULL,
    document_number VARCHAR(200),
    document_date DATE,
    section_number VARCHAR(20),
    page_number INTEGER,
    has_signature BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'INCLUDED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_spd_package ON stroynadzor_package_documents(package_id);
CREATE INDEX idx_spd_category ON stroynadzor_package_documents(document_category);
CREATE INDEX idx_spd_doc ON stroynadzor_package_documents(document_id);
