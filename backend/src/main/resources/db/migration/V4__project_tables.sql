-- =============================================================================
-- Sequence for project codes (PRJ-00001, PRJ-00002, etc.)
-- =============================================================================
CREATE SEQUENCE project_code_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Projects table
-- =============================================================================
CREATE TABLE projects (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                VARCHAR(20) NOT NULL UNIQUE,
    name                VARCHAR(500) NOT NULL,
    description         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    organization_id     UUID REFERENCES organizations(id),
    customer_id         UUID,
    manager_id          UUID REFERENCES users(id),
    planned_start_date  DATE,
    planned_end_date    DATE,
    actual_start_date   DATE,
    actual_end_date     DATE,
    address             VARCHAR(1000),
    city                VARCHAR(100),
    region              VARCHAR(100),
    latitude            NUMERIC(10, 7),
    longitude           NUMERIC(10, 7),
    budget_amount       NUMERIC(18, 2),
    contract_amount     NUMERIC(18, 2),
    type                VARCHAR(20),
    category            VARCHAR(100),
    priority            VARCHAR(10) NOT NULL DEFAULT 'NORMAL',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_project_status CHECK (status IN ('DRAFT', 'PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_project_type CHECK (type IS NULL OR type IN ('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INFRASTRUCTURE', 'RENOVATION')),
    CONSTRAINT chk_project_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_project_dates CHECK (planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date),
    CONSTRAINT chk_project_actual_dates CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date),
    CONSTRAINT chk_project_budget_positive CHECK (budget_amount IS NULL OR budget_amount >= 0),
    CONSTRAINT chk_project_contract_positive CHECK (contract_amount IS NULL OR contract_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_project_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_project_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_manager ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_project_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_project_dates ON projects(planned_start_date, planned_end_date);
CREATE INDEX IF NOT EXISTS idx_project_city ON projects(city);
CREATE INDEX IF NOT EXISTS idx_project_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_project_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_project_active ON projects(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Project members table
-- =============================================================================
CREATE TABLE project_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    role        VARCHAR(30) NOT NULL,
    joined_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    left_at     TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_pm_role CHECK (role IN ('MANAGER', 'ENGINEER', 'FOREMAN', 'ACCOUNTANT', 'SUPPLY_MANAGER', 'SAFETY_OFFICER', 'QC_INSPECTOR')),
    CONSTRAINT uk_pm_project_user_role UNIQUE (project_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_pm_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pm_active ON project_members(project_id) WHERE left_at IS NULL;
