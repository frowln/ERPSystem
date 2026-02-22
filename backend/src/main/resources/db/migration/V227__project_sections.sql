-- =============================================================================
-- V227: Configurable project sections (disciplines) for Financial Model
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_sections (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    project_id          UUID NOT NULL,
    code                VARCHAR(20) NOT NULL,
    name                VARCHAR(200) NOT NULL,
    is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    is_custom           BOOLEAN NOT NULL DEFAULT FALSE,
    sequence            INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(project_id, code)
);

CREATE INDEX IF NOT EXISTS idx_project_section_project ON project_sections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_section_org ON project_sections(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_section_active ON project_sections(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_project_sections_updated_at
    BEFORE UPDATE ON project_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
