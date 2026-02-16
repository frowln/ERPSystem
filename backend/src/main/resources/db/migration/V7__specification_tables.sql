-- =============================================================================
-- Sequence for specification names (SPEC-00001, SPEC-00002, etc.)
-- =============================================================================
CREATE SEQUENCE spec_name_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Specifications table
-- =============================================================================
CREATE TABLE specifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(50) NOT NULL UNIQUE,
    project_id          UUID NOT NULL REFERENCES projects(id),
    contract_id         UUID,
    doc_version         INTEGER NOT NULL DEFAULT 1,
    is_current          BOOLEAN NOT NULL DEFAULT TRUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    parent_version_id   UUID REFERENCES specifications(id),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_spec_status CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ACTIVE')),
    CONSTRAINT chk_spec_doc_version CHECK (doc_version >= 1)
);

CREATE INDEX IF NOT EXISTS idx_spec_project ON specifications(project_id);
CREATE INDEX IF NOT EXISTS idx_spec_contract ON specifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_spec_status ON specifications(status);
CREATE INDEX IF NOT EXISTS idx_spec_parent_version ON specifications(parent_version_id);
CREATE INDEX IF NOT EXISTS idx_spec_current ON specifications(project_id, is_current) WHERE is_current = TRUE AND deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_spec_active ON specifications(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_specifications_updated_at
    BEFORE UPDATE ON specifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Specification items table
-- =============================================================================
CREATE TABLE spec_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specification_id    UUID NOT NULL REFERENCES specifications(id) ON DELETE CASCADE,
    sequence            INTEGER NOT NULL DEFAULT 0,
    item_type           VARCHAR(20) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    product_code        VARCHAR(100),
    quantity            NUMERIC(16, 3) NOT NULL,
    unit_of_measure     VARCHAR(50) NOT NULL,
    planned_amount      NUMERIC(18, 2),
    notes               TEXT,
    procurement_status  VARCHAR(50) NOT NULL DEFAULT 'not_started',
    estimate_status     VARCHAR(50) NOT NULL DEFAULT 'not_started',
    is_customer_provided BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_spec_item_type CHECK (item_type IN ('MATERIAL', 'EQUIPMENT', 'WORK')),
    CONSTRAINT chk_spec_item_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_spec_item_planned_amount CHECK (planned_amount IS NULL OR planned_amount >= 0),
    CONSTRAINT chk_spec_item_procurement_status CHECK (procurement_status IN ('not_started', 'in_selection', 'selected', 'approved', 'ordered', 'delivered', 'closed')),
    CONSTRAINT chk_spec_item_estimate_status CHECK (estimate_status IN ('not_started', 'in_work', 'approved', 'closed'))
);

CREATE INDEX IF NOT EXISTS idx_spec_item_spec ON spec_items(specification_id);
CREATE INDEX IF NOT EXISTS idx_spec_item_type ON spec_items(item_type);
CREATE INDEX IF NOT EXISTS idx_spec_item_product_code ON spec_items(product_code);
CREATE INDEX IF NOT EXISTS idx_spec_item_active ON spec_items(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_spec_items_updated_at
    BEFORE UPDATE ON spec_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
