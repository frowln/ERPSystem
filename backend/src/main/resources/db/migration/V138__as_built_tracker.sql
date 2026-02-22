-- P3-06: As-built documentation tracker
CREATE TABLE IF NOT EXISTS as_built_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID,
    work_type VARCHAR(30) NOT NULL,
    doc_category VARCHAR(100) NOT NULL,
    description TEXT,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_asbuilt_req_org ON as_built_requirements(organization_id);
CREATE INDEX IF NOT EXISTS idx_asbuilt_req_project ON as_built_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_asbuilt_req_work_type ON as_built_requirements(work_type);

CREATE TABLE IF NOT EXISTS as_built_wbs_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    wbs_node_id UUID NOT NULL,
    doc_category VARCHAR(100) NOT NULL,
    document_container_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_asbuilt_link_wbs ON as_built_wbs_links(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_asbuilt_link_project ON as_built_wbs_links(project_id);
CREATE INDEX IF NOT EXISTS idx_asbuilt_link_doc ON as_built_wbs_links(document_container_id);
CREATE INDEX IF NOT EXISTS idx_asbuilt_link_status ON as_built_wbs_links(status);
