-- =============================================================================
-- КС-2 Documents (Акты выполненных работ)
-- =============================================================================
CREATE TABLE ks2_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number              VARCHAR(50) NOT NULL,
    document_date       DATE NOT NULL,
    name                VARCHAR(500),
    project_id          UUID,
    contract_id         UUID,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    total_amount        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_quantity      NUMERIC(16, 3) NOT NULL DEFAULT 0,
    notes               TEXT,
    signed_by_id        UUID,
    signed_at           TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ks2_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'SIGNED', 'CLOSED')),
    CONSTRAINT chk_ks2_total_amount CHECK (total_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ks2_document_date ON ks2_documents(document_date);
CREATE INDEX IF NOT EXISTS idx_ks2_project ON ks2_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_ks2_contract ON ks2_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_ks2_status ON ks2_documents(status);
CREATE INDEX IF NOT EXISTS idx_ks2_active ON ks2_documents(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ks2_documents_updated_at
    BEFORE UPDATE ON ks2_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- КС-2 Lines (Строки акта КС-2)
-- =============================================================================
CREATE TABLE ks2_lines (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ks2_id              UUID NOT NULL REFERENCES ks2_documents(id) ON DELETE CASCADE,
    sequence            INTEGER DEFAULT 0,
    spec_item_id        UUID,
    name                VARCHAR(500) NOT NULL,
    quantity            NUMERIC(16, 3) NOT NULL,
    unit_price          NUMERIC(18, 2) NOT NULL,
    amount              NUMERIC(18, 2),
    unit_of_measure     VARCHAR(50),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ks2_line_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_ks2_line_unit_price CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ks2_line_ks2 ON ks2_lines(ks2_id);
CREATE INDEX IF NOT EXISTS idx_ks2_line_active ON ks2_lines(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ks2_lines_updated_at
    BEFORE UPDATE ON ks2_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- КС-3 Documents (Справки о стоимости выполненных работ)
-- =============================================================================
CREATE TABLE ks3_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number              VARCHAR(50) NOT NULL,
    document_date       DATE NOT NULL,
    name                VARCHAR(500),
    period_from         DATE,
    period_to           DATE,
    project_id          UUID,
    contract_id         UUID,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    total_amount        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    retention_percent   NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    retention_amount    NUMERIC(18, 2) NOT NULL DEFAULT 0,
    net_amount          NUMERIC(18, 2) NOT NULL DEFAULT 0,
    notes               TEXT,
    signed_by_id        UUID,
    signed_at           TIMESTAMP WITH TIME ZONE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ks3_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'SIGNED', 'CLOSED')),
    CONSTRAINT chk_ks3_total_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_ks3_retention_percent CHECK (retention_percent >= 0 AND retention_percent <= 100),
    CONSTRAINT chk_ks3_period CHECK (period_to IS NULL OR period_from IS NULL OR period_to >= period_from)
);

CREATE INDEX IF NOT EXISTS idx_ks3_document_date ON ks3_documents(document_date);
CREATE INDEX IF NOT EXISTS idx_ks3_project ON ks3_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_ks3_contract ON ks3_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_ks3_status ON ks3_documents(status);
CREATE INDEX IF NOT EXISTS idx_ks3_active ON ks3_documents(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_ks3_documents_updated_at
    BEFORE UPDATE ON ks3_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- КС-3 to КС-2 Links (Many-to-Many)
-- =============================================================================
CREATE TABLE ks3_ks2_links (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ks3_id              UUID NOT NULL REFERENCES ks3_documents(id) ON DELETE CASCADE,
    ks2_id              UUID NOT NULL REFERENCES ks2_documents(id) ON DELETE CASCADE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uk_ks3_ks2 UNIQUE (ks3_id, ks2_id)
);

CREATE INDEX IF NOT EXISTS idx_ks3_ks2_link_ks3 ON ks3_ks2_links(ks3_id);
CREATE INDEX IF NOT EXISTS idx_ks3_ks2_link_ks2 ON ks3_ks2_links(ks2_id);

CREATE TRIGGER update_ks3_ks2_links_updated_at
    BEFORE UPDATE ON ks3_ks2_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
