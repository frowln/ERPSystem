-- =============================================================================
-- Portal Users table
-- =============================================================================
CREATE TABLE portal_users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    phone               VARCHAR(50),
    organization_id     UUID,
    organization_name   VARCHAR(500),
    inn                 VARCHAR(12),
    portal_role         VARCHAR(30) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    last_login_at       TIMESTAMP WITH TIME ZONE,
    invited_by_id       UUID REFERENCES users(id),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_portal_user_email UNIQUE (email),
    CONSTRAINT chk_portal_role CHECK (portal_role IN (
        'CUSTOMER', 'CONTRACTOR', 'SUBCONTRACTOR', 'SUPPLIER'
    )),
    CONSTRAINT chk_portal_user_status CHECK (status IN (
        'PENDING', 'ACTIVE', 'BLOCKED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_portal_user_email ON portal_users(email);
CREATE INDEX IF NOT EXISTS idx_portal_user_org ON portal_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_portal_user_status ON portal_users(status);
CREATE INDEX IF NOT EXISTS idx_portal_user_role ON portal_users(portal_role);
CREATE INDEX IF NOT EXISTS idx_portal_user_active ON portal_users(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_portal_users_updated_at
    BEFORE UPDATE ON portal_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Portal Projects table (access grants)
-- =============================================================================
CREATE TABLE portal_projects (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_user_id      UUID NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id),
    access_level        VARCHAR(20) NOT NULL DEFAULT 'VIEW_ONLY',
    can_view_finance    BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_documents  BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_schedule   BOOLEAN NOT NULL DEFAULT FALSE,
    can_view_photos     BOOLEAN NOT NULL DEFAULT FALSE,
    granted_by_id       UUID REFERENCES users(id),
    granted_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_portal_project_user UNIQUE (portal_user_id, project_id),
    CONSTRAINT chk_portal_access_level CHECK (access_level IN (
        'VIEW_ONLY', 'LIMITED', 'FULL'
    ))
);

CREATE INDEX IF NOT EXISTS idx_portal_project_user ON portal_projects(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_project_project ON portal_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_portal_project_active ON portal_projects(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_portal_projects_updated_at
    BEFORE UPDATE ON portal_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Portal Messages table
-- =============================================================================
CREATE TABLE portal_messages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_portal_user_id UUID REFERENCES portal_users(id),
    to_portal_user_id   UUID REFERENCES portal_users(id),
    from_internal_user_id UUID REFERENCES users(id),
    to_internal_user_id UUID REFERENCES users(id),
    project_id          UUID REFERENCES projects(id),
    subject             VARCHAR(500) NOT NULL,
    content             TEXT NOT NULL,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    read_at             TIMESTAMP WITH TIME ZONE,
    parent_message_id   UUID REFERENCES portal_messages(id),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_portal_msg_from_portal ON portal_messages(from_portal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_msg_to_portal ON portal_messages(to_portal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_msg_from_internal ON portal_messages(from_internal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_msg_to_internal ON portal_messages(to_internal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_msg_project ON portal_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_portal_msg_parent ON portal_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_portal_msg_unread ON portal_messages(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_portal_msg_active ON portal_messages(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_portal_messages_updated_at
    BEFORE UPDATE ON portal_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Portal Documents table (shared documents)
-- =============================================================================
CREATE TABLE portal_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_user_id      UUID NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
    project_id          UUID REFERENCES projects(id),
    document_id         UUID NOT NULL REFERENCES documents(id),
    shared_by_id        UUID REFERENCES users(id),
    shared_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMP WITH TIME ZONE,
    download_count      INTEGER NOT NULL DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_portal_document UNIQUE (portal_user_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_portal_doc_user ON portal_documents(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_portal_doc_project ON portal_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_portal_doc_document ON portal_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_portal_doc_active ON portal_documents(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_portal_documents_updated_at
    BEFORE UPDATE ON portal_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
