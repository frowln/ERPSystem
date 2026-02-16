-- =============================================================================
-- Estimates table
-- =============================================================================
CREATE TABLE estimates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(500) NOT NULL,
    project_id          UUID NOT NULL REFERENCES projects(id),
    contract_id         UUID,
    specification_id    UUID NOT NULL REFERENCES specifications(id),
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    total_amount        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    ordered_amount      NUMERIC(18, 2) NOT NULL DEFAULT 0,
    invoiced_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_spent         NUMERIC(18, 2) NOT NULL DEFAULT 0,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_estimate_status CHECK (status IN ('DRAFT', 'IN_WORK', 'APPROVED', 'ACTIVE')),
    CONSTRAINT chk_estimate_total_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_estimate_ordered_amount CHECK (ordered_amount >= 0),
    CONSTRAINT chk_estimate_invoiced_amount CHECK (invoiced_amount >= 0),
    CONSTRAINT chk_estimate_total_spent CHECK (total_spent >= 0)
);

CREATE INDEX IF NOT EXISTS idx_estimate_project ON estimates(project_id);
CREATE INDEX IF NOT EXISTS idx_estimate_spec ON estimates(specification_id);
CREATE INDEX IF NOT EXISTS idx_estimate_contract ON estimates(contract_id);
CREATE INDEX IF NOT EXISTS idx_estimate_status ON estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimate_active ON estimates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_estimates_updated_at
    BEFORE UPDATE ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Estimate items table
-- =============================================================================
CREATE TABLE estimate_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id         UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL REFERENCES projects(id),
    spec_item_id        UUID REFERENCES spec_items(id),
    sequence            INTEGER NOT NULL DEFAULT 0,
    name                VARCHAR(500) NOT NULL,
    quantity            NUMERIC(16, 3) NOT NULL,
    unit_of_measure     VARCHAR(50) NOT NULL,
    unit_price          NUMERIC(18, 2) NOT NULL,
    unit_price_customer NUMERIC(18, 2),
    amount              NUMERIC(18, 2),
    amount_customer     NUMERIC(18, 2),
    ordered_amount      NUMERIC(18, 2) NOT NULL DEFAULT 0,
    invoiced_amount     NUMERIC(18, 2) NOT NULL DEFAULT 0,
    delivered_amount    NUMERIC(18, 2) NOT NULL DEFAULT 0,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_est_item_quantity CHECK (quantity > 0),
    CONSTRAINT chk_est_item_unit_price CHECK (unit_price >= 0),
    CONSTRAINT chk_est_item_unit_price_customer CHECK (unit_price_customer IS NULL OR unit_price_customer >= 0),
    CONSTRAINT chk_est_item_amount CHECK (amount IS NULL OR amount >= 0),
    CONSTRAINT chk_est_item_amount_customer CHECK (amount_customer IS NULL OR amount_customer >= 0),
    CONSTRAINT chk_est_item_ordered_amount CHECK (ordered_amount >= 0),
    CONSTRAINT chk_est_item_invoiced_amount CHECK (invoiced_amount >= 0),
    CONSTRAINT chk_est_item_delivered_amount CHECK (delivered_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_est_item_estimate ON estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_est_item_project ON estimate_items(project_id);
CREATE INDEX IF NOT EXISTS idx_est_item_spec_item ON estimate_items(spec_item_id);
CREATE INDEX IF NOT EXISTS idx_est_item_active ON estimate_items(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_estimate_items_updated_at
    BEFORE UPDATE ON estimate_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Estimate versions table
-- =============================================================================
CREATE TABLE estimate_versions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id         UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    version_number      VARCHAR(50) NOT NULL,
    parent_version_id   UUID REFERENCES estimate_versions(id),
    version_data        TEXT,
    reason              VARCHAR(50) NOT NULL,
    comment             TEXT,
    is_current          BOOLEAN NOT NULL DEFAULT TRUE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_est_ver_reason CHECK (reason IN ('initial', 'update', 'correction', 'approval', 'archive'))
);

CREATE INDEX IF NOT EXISTS idx_est_ver_estimate ON estimate_versions(estimate_id);
CREATE INDEX IF NOT EXISTS idx_est_ver_parent ON estimate_versions(parent_version_id);
CREATE INDEX IF NOT EXISTS idx_est_ver_current ON estimate_versions(estimate_id, is_current) WHERE is_current = TRUE;

CREATE TRIGGER update_estimate_versions_updated_at
    BEFORE UPDATE ON estimate_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
