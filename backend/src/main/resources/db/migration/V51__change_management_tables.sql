-- =============================================================================
-- V51: Change Management tables (Change Event -> Change Order Request -> Change Order)
-- =============================================================================

-- Sequences for auto-numbering
CREATE SEQUENCE change_event_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE change_order_request_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE change_order_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Change Events — События изменений
-- =============================================================================
CREATE TABLE change_events (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id                  UUID NOT NULL,
    number                      VARCHAR(50) NOT NULL,
    title                       VARCHAR(500) NOT NULL,
    description                 TEXT,
    source                      VARCHAR(30),
    status                      VARCHAR(30) NOT NULL DEFAULT 'IDENTIFIED',
    identified_by_id            UUID NOT NULL,
    identified_date             DATE NOT NULL,
    estimated_cost_impact       NUMERIC(18, 2),
    estimated_schedule_impact   INTEGER,
    actual_cost_impact          NUMERIC(18, 2),
    actual_schedule_impact      INTEGER,
    linked_rfi_id               UUID,
    linked_issue_id             UUID,
    contract_id                 UUID,
    tags                        JSONB,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_change_event_project_number UNIQUE (project_id, number),
    CONSTRAINT chk_change_event_status CHECK (status IN (
        'IDENTIFIED', 'UNDER_REVIEW', 'APPROVED_FOR_PRICING', 'PRICED', 'APPROVED', 'REJECTED', 'VOID'
    )),
    CONSTRAINT chk_change_event_source CHECK (source IN (
        'RFI', 'DESIGN_CHANGE', 'FIELD_CONDITION', 'OWNER_REQUEST', 'REGULATORY', 'VALUE_ENGINEERING', 'OTHER'
    ))
);

CREATE INDEX IF NOT EXISTS idx_change_event_project ON change_events(project_id);
CREATE INDEX IF NOT EXISTS idx_change_event_status ON change_events(status);
CREATE INDEX IF NOT EXISTS idx_change_event_source ON change_events(source);
CREATE INDEX IF NOT EXISTS idx_change_event_identified_by ON change_events(identified_by_id);
CREATE INDEX IF NOT EXISTS idx_change_event_contract ON change_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_change_event_linked_rfi ON change_events(linked_rfi_id);
CREATE INDEX IF NOT EXISTS idx_change_event_active ON change_events(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_change_events_updated_at
    BEFORE UPDATE ON change_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Change Order Requests — Запросы на изменение заказа (RFQ)
-- =============================================================================
CREATE TABLE change_order_requests (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_event_id             UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
    project_id                  UUID NOT NULL,
    number                      VARCHAR(50),
    title                       VARCHAR(500) NOT NULL,
    description                 TEXT,
    status                      VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    requested_by_id             UUID,
    requested_date              DATE,
    proposed_cost               NUMERIC(18, 2),
    proposed_schedule_change    INTEGER,
    justification               TEXT,
    attachment_ids              JSONB,
    reviewed_by_id              UUID,
    reviewed_date               DATE,
    review_comments             TEXT,
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_cor_status CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_cor_change_event ON change_order_requests(change_event_id);
CREATE INDEX IF NOT EXISTS idx_cor_project ON change_order_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_cor_status ON change_order_requests(status);
CREATE INDEX IF NOT EXISTS idx_cor_requested_by ON change_order_requests(requested_by_id);
CREATE INDEX IF NOT EXISTS idx_cor_active ON change_order_requests(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_change_order_requests_updated_at
    BEFORE UPDATE ON change_order_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Change Orders — Дополнительные соглашения / Ордера на изменение
-- =============================================================================
CREATE TABLE change_orders (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id                  UUID NOT NULL,
    contract_id                 UUID NOT NULL,
    number                      VARCHAR(50),
    title                       VARCHAR(500) NOT NULL,
    description                 TEXT,
    change_order_type           VARCHAR(30),
    status                      VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    total_amount                NUMERIC(18, 2) NOT NULL DEFAULT 0,
    schedule_impact_days        INTEGER NOT NULL DEFAULT 0,
    original_contract_amount    NUMERIC(18, 2),
    revised_contract_amount     NUMERIC(18, 2),
    approved_by_id              UUID,
    approved_date               DATE,
    executed_date               DATE,
    change_order_request_id     UUID REFERENCES change_order_requests(id),
    deleted                     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by                  VARCHAR(255),
    updated_by                  VARCHAR(255),
    version                     BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_change_order_project_number UNIQUE (project_id, number),
    CONSTRAINT chk_co_type CHECK (change_order_type IN (
        'ADDITION', 'DEDUCTION', 'SUBSTITUTION', 'TIME_EXTENSION', 'MIXED'
    )),
    CONSTRAINT chk_co_status CHECK (status IN (
        'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'EXECUTED', 'VOID'
    ))
);

CREATE INDEX IF NOT EXISTS idx_co_project ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_co_contract ON change_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_co_status ON change_orders(status);
CREATE INDEX IF NOT EXISTS idx_co_type ON change_orders(change_order_type);
CREATE INDEX IF NOT EXISTS idx_co_cor ON change_orders(change_order_request_id);
CREATE INDEX IF NOT EXISTS idx_co_active ON change_orders(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_change_orders_updated_at
    BEFORE UPDATE ON change_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Change Order Items — Позиции ордера на изменение
-- =============================================================================
CREATE TABLE change_order_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_order_id     UUID NOT NULL REFERENCES change_orders(id) ON DELETE CASCADE,
    description         VARCHAR(1000) NOT NULL,
    quantity            NUMERIC(18, 4),
    unit                VARCHAR(50),
    unit_price          NUMERIC(18, 2),
    total_price         NUMERIC(18, 2),
    cost_code_id        UUID,
    wbs_node_id         UUID,
    sort_order          INTEGER,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_coi_change_order ON change_order_items(change_order_id);
CREATE INDEX IF NOT EXISTS idx_coi_cost_code ON change_order_items(cost_code_id);
CREATE INDEX IF NOT EXISTS idx_coi_wbs_node ON change_order_items(wbs_node_id);
CREATE INDEX IF NOT EXISTS idx_coi_active ON change_order_items(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_change_order_items_updated_at
    BEFORE UPDATE ON change_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
