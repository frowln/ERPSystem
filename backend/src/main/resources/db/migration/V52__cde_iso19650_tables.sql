-- V52: Common Data Environment (CDE) per ISO 19650
-- Document management with lifecycle states, revisions, transmittals, and full audit trail

-- Document Containers
CREATE TABLE cde_document_containers (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id            UUID         NOT NULL,
    document_number       VARCHAR(100) NOT NULL,
    title                 VARCHAR(500) NOT NULL,
    description           TEXT,
    classification        VARCHAR(30),
    lifecycle_state       VARCHAR(20)  NOT NULL DEFAULT 'WIP',
    discipline            VARCHAR(100),
    zone                  VARCHAR(100),
    level                 VARCHAR(50),
    originator_code       VARCHAR(50),
    type_code             VARCHAR(50),
    current_revision_id   UUID,
    metadata              JSONB,
    tags                  JSONB,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP WITH TIME ZONE,
    created_by            VARCHAR(255),
    updated_by            VARCHAR(255),
    version               BIGINT       NOT NULL DEFAULT 0,
    deleted               BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_cde_doc_project_number UNIQUE (project_id, document_number)
);

CREATE INDEX idx_cde_doc_project ON cde_document_containers (project_id);
CREATE INDEX idx_cde_doc_state ON cde_document_containers (lifecycle_state);
CREATE INDEX idx_cde_doc_classification ON cde_document_containers (classification);
CREATE INDEX idx_cde_doc_discipline ON cde_document_containers (discipline);
CREATE INDEX idx_cde_doc_deleted ON cde_document_containers (deleted);

-- Document Revisions
CREATE TABLE cde_document_revisions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_container_id   UUID         NOT NULL REFERENCES cde_document_containers(id),
    revision_number         VARCHAR(20)  NOT NULL,
    revision_status         VARCHAR(20)  NOT NULL DEFAULT 'CURRENT',
    description             TEXT,
    file_id                 UUID,
    file_name               VARCHAR(500),
    file_size               BIGINT,
    mime_type               VARCHAR(100),
    uploaded_by_id          UUID,
    uploaded_at             TIMESTAMP WITH TIME ZONE,
    approved_by_id          UUID,
    approved_at             TIMESTAMP WITH TIME ZONE,
    superseded_by_id        UUID,
    superseded_at           TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT       NOT NULL DEFAULT 0,
    deleted                 BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cde_rev_container ON cde_document_revisions (document_container_id);
CREATE INDEX idx_cde_rev_status ON cde_document_revisions (revision_status);
CREATE INDEX idx_cde_rev_deleted ON cde_document_revisions (deleted);

-- Revision Sets
CREATE TABLE cde_revision_sets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID         NOT NULL,
    name            VARCHAR(300) NOT NULL,
    description     TEXT,
    revision_ids    JSONB,
    issued_date     DATE,
    issued_by_id    UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT       NOT NULL DEFAULT 0,
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cde_revset_project ON cde_revision_sets (project_id);

-- Transmittals
CREATE TABLE cde_transmittals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id              UUID         NOT NULL,
    transmittal_number      VARCHAR(100) NOT NULL,
    subject                 VARCHAR(500) NOT NULL,
    purpose                 VARCHAR(30),
    status                  VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    from_organization_id    UUID,
    to_organization_id      UUID,
    issued_date             DATE,
    due_date                DATE,
    acknowledged_date       DATE,
    cover_note              TEXT,
    sent_by_id              UUID,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT       NOT NULL DEFAULT 0,
    deleted                 BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_cde_transmittal_project_number UNIQUE (project_id, transmittal_number)
);

CREATE INDEX idx_cde_transmittal_project ON cde_transmittals (project_id);
CREATE INDEX idx_cde_transmittal_status ON cde_transmittals (status);
CREATE INDEX idx_cde_transmittal_deleted ON cde_transmittals (deleted);

-- Transmittal Items
CREATE TABLE cde_transmittal_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transmittal_id          UUID    NOT NULL REFERENCES cde_transmittals(id),
    document_container_id   UUID    NOT NULL REFERENCES cde_document_containers(id),
    revision_id             UUID    NOT NULL REFERENCES cde_document_revisions(id),
    notes                   TEXT,
    response_required       BOOLEAN NOT NULL DEFAULT FALSE,
    response_text           TEXT,
    responded_at            TIMESTAMP WITH TIME ZONE,
    responded_by_id         UUID,
    sort_order              INTEGER,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT  NOT NULL DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cde_ti_transmittal ON cde_transmittal_items (transmittal_id);
CREATE INDEX idx_cde_ti_document ON cde_transmittal_items (document_container_id);
CREATE INDEX idx_cde_ti_revision ON cde_transmittal_items (revision_id);

-- Document Audit Entries
CREATE TABLE cde_document_audit_entries (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_container_id   UUID         NOT NULL REFERENCES cde_document_containers(id),
    action                  VARCHAR(50)  NOT NULL,
    performed_by_id         UUID,
    performed_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    previous_state          VARCHAR(30),
    new_state               VARCHAR(30),
    details                 JSONB,
    ip_address              VARCHAR(45),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE,
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT       NOT NULL DEFAULT 0,
    deleted                 BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_cde_audit_container ON cde_document_audit_entries (document_container_id);
CREATE INDEX idx_cde_audit_action ON cde_document_audit_entries (action);
CREATE INDEX idx_cde_audit_performed_at ON cde_document_audit_entries (performed_at);
