-- =============================================================================
-- Organizations table
-- =============================================================================
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(500) NOT NULL,
    inn             VARCHAR(12) UNIQUE,
    kpp             VARCHAR(9),
    ogrn            VARCHAR(15),
    legal_address   VARCHAR(1000),
    actual_address  VARCHAR(1000),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    type            VARCHAR(20) NOT NULL DEFAULT 'COMPANY',
    parent_id       UUID REFERENCES organizations(id),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_org_inn_length CHECK (inn IS NULL OR LENGTH(inn) IN (10, 12)),
    CONSTRAINT chk_org_kpp_length CHECK (kpp IS NULL OR LENGTH(kpp) = 9),
    CONSTRAINT chk_org_type CHECK (type IN ('COMPANY', 'SUBSIDIARY', 'BRANCH'))
);

CREATE INDEX IF NOT EXISTS idx_org_inn ON organizations(inn);
CREATE INDEX IF NOT EXISTS idx_org_parent ON organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_org_active ON organizations(active) WHERE active = TRUE;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Departments table
-- =============================================================================
CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    head_id         UUID REFERENCES users(id),
    parent_id       UUID REFERENCES departments(id),
    deleted         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_dept_org ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_dept_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_dept_parent ON departments(parent_id);

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key from users to organizations (now that organizations table exists)
ALTER TABLE users
    ADD CONSTRAINT fk_user_organization
    FOREIGN KEY (organization_id) REFERENCES organizations(id);
