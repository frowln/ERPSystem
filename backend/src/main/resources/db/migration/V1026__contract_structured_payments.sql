-- V1026: Contract structured payments + FM coverage fields
-- Phase 4 of Financial Model plan

-- Structured payment fields for contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS prepayment_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_delay_days INTEGER DEFAULT 0;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS guarantee_period_months INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS direction VARCHAR(30);

-- Index for direction filtering
CREATE INDEX IF NOT EXISTS idx_contract_direction ON contracts(direction) WHERE direction IS NOT NULL AND NOT deleted;

-- Additional fields for contract-budget-item links
ALTER TABLE contract_budget_items ADD COLUMN IF NOT EXISTS coverage_percent NUMERIC(5,2);
ALTER TABLE contract_budget_items ADD COLUMN IF NOT EXISTS budget_item_name VARCHAR(500);
ALTER TABLE contract_budget_items ADD COLUMN IF NOT EXISTS total_quantity NUMERIC(18,4);
