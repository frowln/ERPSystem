-- =============================================================================
-- Sequence for М-29 document names (М-29-00001, М-29-00002, etc.)
-- =============================================================================
CREATE SEQUENCE m29_name_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- М-29 Documents (Отчёты о расходе материалов)
-- =============================================================================
CREATE TABLE m29_documents (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(50) NOT NULL UNIQUE,
    document_date           DATE NOT NULL,
    project_id              UUID,
    contract_id             UUID,
    warehouse_location_id   UUID,
    ks2_id                  UUID,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes                   TEXT,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_m29_status CHECK (status IN ('DRAFT', 'CONFIRMED', 'VERIFIED', 'APPROVED', 'POSTED'))
);

CREATE INDEX IF NOT EXISTS idx_m29_document_date ON m29_documents(document_date);
CREATE INDEX IF NOT EXISTS idx_m29_project ON m29_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_m29_status ON m29_documents(status);
CREATE INDEX IF NOT EXISTS idx_m29_active ON m29_documents(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_m29_documents_updated_at
    BEFORE UPDATE ON m29_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- М-29 Lines (Строки отчёта М-29)
-- =============================================================================
CREATE TABLE m29_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    m29_id              UUID NOT NULL REFERENCES m29_documents(id) ON DELETE CASCADE,
    spec_item_id        UUID,
    sequence            INTEGER DEFAULT 0,
    name                VARCHAR(500) NOT NULL,
    planned_quantity    NUMERIC(16, 3),
    actual_quantity     NUMERIC(16, 3),
    unit_of_measure     VARCHAR(50),
    variance            NUMERIC(16, 3),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_m29_line_planned CHECK (planned_quantity IS NULL OR planned_quantity >= 0),
    CONSTRAINT chk_m29_line_actual CHECK (actual_quantity IS NULL OR actual_quantity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_m29_line_m29 ON m29_lines(m29_id);
CREATE INDEX IF NOT EXISTS idx_m29_line_active ON m29_lines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_m29_lines_updated_at
    BEFORE UPDATE ON m29_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
