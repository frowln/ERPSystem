-- =============================================================================
-- V1111: New quality module tables
-- material_inspections, checklist_templates, supervision_entries
-- =============================================================================

-- Sequences
CREATE SEQUENCE IF NOT EXISTS material_inspection_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS checklist_template_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS supervision_entry_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Material Inspections (Входной контроль материалов)
-- =============================================================================
CREATE TABLE material_inspections (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id         UUID NOT NULL,
    number                  VARCHAR(20) UNIQUE,
    material_name           VARCHAR(500) NOT NULL,
    supplier                VARCHAR(500),
    batch_number            VARCHAR(100),
    inspection_date         DATE NOT NULL,
    inspector_name          VARCHAR(255),
    result                  VARCHAR(30) NOT NULL DEFAULT 'accepted',
    test_protocol_number    VARCHAR(100),
    test_results            JSONB DEFAULT '[]'::jsonb,
    notes                   TEXT,
    project_id              UUID NOT NULL,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_mi_result CHECK (result IN ('accepted', 'rejected', 'conditional'))
);

CREATE INDEX IF NOT EXISTS idx_mi_project ON material_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_mi_result ON material_inspections(result);
CREATE INDEX IF NOT EXISTS idx_mi_inspection_date ON material_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_mi_active ON material_inspections(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_material_inspections_updated_at
    BEFORE UPDATE ON material_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Checklist Templates (Шаблоны чек-листов)
-- =============================================================================
CREATE TABLE checklist_templates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL,
    name                VARCHAR(500) NOT NULL,
    work_type           VARCHAR(50) NOT NULL DEFAULT 'other',
    items               JSONB DEFAULT '[]'::jsonb,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ct_work_type ON checklist_templates(work_type);
CREATE INDEX IF NOT EXISTS idx_ct_active ON checklist_templates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_checklist_templates_updated_at
    BEFORE UPDATE ON checklist_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Supervision Entries (Записи журнала авторского надзора)
-- =============================================================================
CREATE TABLE supervision_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL,
    number              VARCHAR(20) UNIQUE,
    entry_date          DATE NOT NULL,
    inspector_name      VARCHAR(255),
    work_type           VARCHAR(500),
    remarks             TEXT,
    directives          TEXT,
    compliance_status   VARCHAR(30) NOT NULL DEFAULT 'compliant',
    project_id          UUID NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_se_compliance CHECK (compliance_status IN ('compliant', 'non_compliant', 'partial'))
);

CREATE INDEX IF NOT EXISTS idx_se_project ON supervision_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_se_compliance ON supervision_entries(compliance_status);
CREATE INDEX IF NOT EXISTS idx_se_entry_date ON supervision_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_se_active ON supervision_entries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_supervision_entries_updated_at
    BEFORE UPDATE ON supervision_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
