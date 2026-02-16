-- =============================================================================
-- V60: Data Import/Export tables
-- =============================================================================

-- =============================================================================
-- Import Mappings (Маппинг импорта)
-- =============================================================================
CREATE TABLE import_mappings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    entity_type         VARCHAR(100) NOT NULL,
    mapping_config      JSONB,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    created_by_id       UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_import_mapping_entity ON import_mappings(entity_type);
CREATE INDEX IF NOT EXISTS idx_import_mapping_default ON import_mappings(is_default);
CREATE INDEX IF NOT EXISTS idx_import_mapping_active ON import_mappings(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_import_mappings_updated_at
    BEFORE UPDATE ON import_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Import Jobs (Задачи импорта)
-- =============================================================================
CREATE TABLE import_jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(100) NOT NULL,
    file_name           VARCHAR(500) NOT NULL,
    file_size           BIGINT,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    total_rows          INTEGER,
    processed_rows      INTEGER DEFAULT 0,
    success_rows        INTEGER DEFAULT 0,
    error_rows          INTEGER DEFAULT 0,
    errors              JSONB,
    mapping_id          UUID REFERENCES import_mappings(id),
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    started_by_id       UUID,
    project_id          UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_import_status CHECK (status IN ('PENDING', 'VALIDATING', 'VALIDATED', 'IMPORTING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_import_job_entity ON import_jobs(entity_type);
CREATE INDEX IF NOT EXISTS idx_import_job_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_job_mapping ON import_jobs(mapping_id);
CREATE INDEX IF NOT EXISTS idx_import_job_project ON import_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_import_job_started_by ON import_jobs(started_by_id);
CREATE INDEX IF NOT EXISTS idx_import_job_active ON import_jobs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_import_jobs_updated_at
    BEFORE UPDATE ON import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Export Jobs (Задачи экспорта)
-- =============================================================================
CREATE TABLE export_jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type         VARCHAR(100) NOT NULL,
    format              VARCHAR(20),
    file_name           VARCHAR(500),
    filters             JSONB,
    total_rows          INTEGER,
    status              VARCHAR(30),
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    file_url            VARCHAR(1000),
    requested_by_id     UUID,
    project_id          UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_export_format CHECK (format IN ('CSV', 'XLSX', 'PDF', 'JSON', 'XML'))
);

CREATE INDEX IF NOT EXISTS idx_export_job_entity ON export_jobs(entity_type);
CREATE INDEX IF NOT EXISTS idx_export_job_status ON export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_job_format ON export_jobs(format);
CREATE INDEX IF NOT EXISTS idx_export_job_project ON export_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_export_job_requested_by ON export_jobs(requested_by_id);
CREATE INDEX IF NOT EXISTS idx_export_job_active ON export_jobs(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_export_jobs_updated_at
    BEFORE UPDATE ON export_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
