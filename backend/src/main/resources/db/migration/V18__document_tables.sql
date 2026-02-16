-- =============================================================================
-- Documents table
-- =============================================================================
CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(500) NOT NULL,
    document_number     VARCHAR(200),
    category            VARCHAR(30),
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    project_id          UUID REFERENCES projects(id),
    contract_id         UUID REFERENCES contracts(id),
    description         TEXT,
    file_name           VARCHAR(500),
    file_size           BIGINT,
    mime_type           VARCHAR(200),
    storage_path        VARCHAR(1000),
    doc_version         INTEGER NOT NULL DEFAULT 1,
    parent_version_id   UUID REFERENCES documents(id),
    author_id           UUID REFERENCES users(id),
    author_name         VARCHAR(255),
    tags                VARCHAR(500),
    expiry_date         DATE,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_document_category CHECK (category IS NULL OR category IN (
        'CONTRACT', 'ESTIMATE', 'SPECIFICATION', 'DRAWING', 'PERMIT', 'ACT',
        'INVOICE', 'PROTOCOL', 'CORRESPONDENCE', 'PHOTO', 'REPORT', 'OTHER'
    )),
    CONSTRAINT chk_document_status CHECK (status IN (
        'DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'ARCHIVED', 'CANCELLED'
    )),
    CONSTRAINT chk_document_file_size CHECK (file_size IS NULL OR file_size >= 0),
    CONSTRAINT chk_document_version CHECK (doc_version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_document_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_document_contract ON documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_document_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_document_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_document_author ON documents(author_id);
CREATE INDEX IF NOT EXISTS idx_document_parent_version ON documents(parent_version_id);
CREATE INDEX IF NOT EXISTS idx_document_expiry ON documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_document_active ON documents(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Document access table
-- =============================================================================
CREATE TABLE document_access (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    access_level        VARCHAR(20) NOT NULL,
    granted_by_id       UUID REFERENCES users(id),
    granted_by_name     VARCHAR(255),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_document_access_user UNIQUE (document_id, user_id),
    CONSTRAINT chk_access_level CHECK (access_level IN ('VIEW', 'EDIT', 'FULL'))
);

CREATE INDEX IF NOT EXISTS idx_doc_access_document ON document_access(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_access_user ON document_access(user_id);

CREATE TRIGGER update_document_access_updated_at
    BEFORE UPDATE ON document_access
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Document comments table
-- =============================================================================
CREATE TABLE document_comments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    author_id           UUID REFERENCES users(id),
    author_name         VARCHAR(255),
    content             TEXT NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_doc_comment_document ON document_comments(document_id);

CREATE TRIGGER update_document_comments_updated_at
    BEFORE UPDATE ON document_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
