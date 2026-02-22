-- =============================================================================
-- V232: Competitive Lists for specifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS competitive_lists (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL,
    project_id              UUID NOT NULL,
    specification_id        UUID NOT NULL,
    name                    VARCHAR(500) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    min_proposals_required  INTEGER NOT NULL DEFAULT 3,
    created_by_id           UUID,
    decided_by_id           UUID,
    decided_at              TIMESTAMPTZ,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_cl_project ON competitive_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_cl_spec ON competitive_lists(specification_id);
CREATE INDEX IF NOT EXISTS idx_cl_status ON competitive_lists(status);
CREATE INDEX IF NOT EXISTS idx_cl_active ON competitive_lists(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_competitive_lists_updated_at
    BEFORE UPDATE ON competitive_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS competitive_list_entries (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competitive_list_id     UUID NOT NULL REFERENCES competitive_lists(id),
    spec_item_id            UUID NOT NULL,
    invoice_id              UUID,
    invoice_line_id         UUID,
    vendor_id               UUID,
    vendor_name             VARCHAR(500),
    unit_price              NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    quantity                NUMERIC(18,4) NOT NULL DEFAULT 0,
    total_price             NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    delivery_days           INTEGER,
    payment_terms           VARCHAR(500),
    is_winner               BOOLEAN NOT NULL DEFAULT FALSE,
    selection_reason        TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cle_list ON competitive_list_entries(competitive_list_id);
CREATE INDEX IF NOT EXISTS idx_cle_spec_item ON competitive_list_entries(spec_item_id);
CREATE INDEX IF NOT EXISTS idx_cle_vendor ON competitive_list_entries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_cle_winner ON competitive_list_entries(is_winner) WHERE is_winner = TRUE;
