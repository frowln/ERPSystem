-- =============================================================================
-- V230: Commercial Proposals (KP) and their items
-- =============================================================================

CREATE TABLE IF NOT EXISTS commercial_proposals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL,
    project_id          UUID NOT NULL,
    budget_id           UUID NOT NULL,
    name                VARCHAR(500) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    total_cost_price    NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    created_by_id       UUID,
    approved_by_id      UUID,
    approved_at         TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_cp_project ON commercial_proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_cp_budget ON commercial_proposals(budget_id);
CREATE INDEX IF NOT EXISTS idx_cp_status ON commercial_proposals(status);
CREATE INDEX IF NOT EXISTS idx_cp_active ON commercial_proposals(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_commercial_proposals_updated_at
    BEFORE UPDATE ON commercial_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS commercial_proposal_items (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id                 UUID NOT NULL REFERENCES commercial_proposals(id),
    budget_item_id              UUID NOT NULL REFERENCES budget_items(id),
    item_type                   VARCHAR(20) NOT NULL,
    selected_invoice_line_id    UUID,
    estimate_item_id            UUID,
    trading_coefficient         NUMERIC(8,4) DEFAULT 1.0000,
    cost_price                  NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    quantity                    NUMERIC(18,4) NOT NULL DEFAULT 0,
    total_cost                  NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    status                      VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_by_id              UUID,
    approved_at                 TIMESTAMPTZ,
    rejection_reason            TEXT,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cpi_proposal ON commercial_proposal_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_cpi_budget_item ON commercial_proposal_items(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_cpi_status ON commercial_proposal_items(status);
CREATE INDEX IF NOT EXISTS idx_cpi_invoice_line ON commercial_proposal_items(selected_invoice_line_id);
