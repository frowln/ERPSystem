-- P3-09: Commissioning & acceptance enhancements

CREATE TABLE IF NOT EXISTS commissioning_checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID,
    name VARCHAR(300) NOT NULL,
    system VARCHAR(100),
    description TEXT,
    check_item_definitions TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_comm_template_org_system ON commissioning_checklist_templates(organization_id, system);
CREATE INDEX IF NOT EXISTS idx_comm_template_org_project ON commissioning_checklist_templates(organization_id, project_id);

CREATE TABLE IF NOT EXISTS commissioning_sign_offs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    checklist_id UUID NOT NULL,
    signer_name VARCHAR(255) NOT NULL,
    signer_role VARCHAR(100),
    signer_organization VARCHAR(255),
    decision VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    comments TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_comm_signoff_checklist ON commissioning_sign_offs(checklist_id);
CREATE INDEX IF NOT EXISTS idx_comm_signoff_org ON commissioning_sign_offs(organization_id);

CREATE TABLE IF NOT EXISTS zos_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    system VARCHAR(100),
    checklist_ids TEXT,
    issued_date DATE,
    issued_by_name VARCHAR(255),
    issued_by_organization VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    conclusion_text TEXT,
    remarks TEXT,
    attachment_ids TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_zos_org ON zos_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_zos_project ON zos_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_zos_status ON zos_documents(status);
