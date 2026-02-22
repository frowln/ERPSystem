-- =============================================================================
-- V229: Contract direction (CLIENT/CONTRACTOR) + many-to-many with budget items
-- =============================================================================

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_direction VARCHAR(20) NOT NULL DEFAULT 'CONTRACTOR';
CREATE INDEX IF NOT EXISTS idx_contract_direction ON contracts(contract_direction);

CREATE TABLE IF NOT EXISTS contract_budget_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id         UUID NOT NULL REFERENCES contracts(id),
    budget_item_id      UUID NOT NULL REFERENCES budget_items(id),
    allocated_quantity  NUMERIC(18,4) NOT NULL DEFAULT 0,
    allocated_amount    NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(contract_id, budget_item_id)
);

CREATE INDEX IF NOT EXISTS idx_cbi_contract ON contract_budget_items(contract_id);
CREATE INDEX IF NOT EXISTS idx_cbi_budget_item ON contract_budget_items(budget_item_id);

CREATE TRIGGER update_cbi_updated_at
    BEFORE UPDATE ON contract_budget_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
