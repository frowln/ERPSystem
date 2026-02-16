-- =============================================================================
-- Sequence for purchase request names (ЗП-00001, ЗП-00002, etc.)
-- =============================================================================
CREATE SEQUENCE purchase_request_name_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Purchase Requests (Заявки на закупку)
-- =============================================================================
CREATE TABLE purchase_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(50) NOT NULL UNIQUE,
    request_date        DATE NOT NULL,
    project_id          UUID,
    contract_id         UUID,
    specification_id    UUID,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    priority            VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    requested_by_id     UUID,
    requested_by_name   VARCHAR(255),
    approved_by_id      UUID,
    assigned_to_id      UUID,
    total_amount        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    rejection_reason    TEXT,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_pr_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'IN_APPROVAL', 'APPROVED', 'REJECTED', 'ASSIGNED', 'ORDERED', 'DELIVERED', 'CLOSED', 'CANCELLED')),
    CONSTRAINT chk_pr_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_pr_total_amount CHECK (total_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pr_request_date ON purchase_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_pr_project ON purchase_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_pr_priority ON purchase_requests(priority);
CREATE INDEX IF NOT EXISTS idx_pr_assigned_to ON purchase_requests(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_pr_active ON purchase_requests(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_purchase_requests_updated_at
    BEFORE UPDATE ON purchase_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Purchase Request Items (Позиции заявки на закупку)
-- =============================================================================
CREATE TABLE purchase_request_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id          UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
    spec_item_id        UUID,
    sequence            INTEGER DEFAULT 0,
    name                VARCHAR(500) NOT NULL,
    quantity            NUMERIC(16, 3) NOT NULL,
    unit_of_measure     VARCHAR(50) NOT NULL,
    unit_price          NUMERIC(18, 2),
    amount              NUMERIC(18, 2),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_pri_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_pri_unit_price CHECK (unit_price IS NULL OR unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pri_request ON purchase_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_pri_active ON purchase_request_items(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_purchase_request_items_updated_at
    BEFORE UPDATE ON purchase_request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
