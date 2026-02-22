-- V1028: Add supply status tracking to spec_items
-- Phase 6 of Financial Model plan

ALTER TABLE spec_items ADD COLUMN IF NOT EXISTS supply_status VARCHAR(30) DEFAULT 'NOT_COVERED';
ALTER TABLE spec_items ADD COLUMN IF NOT EXISTS covered_quantity NUMERIC(18,4) DEFAULT 0;
ALTER TABLE spec_items ADD COLUMN IF NOT EXISTS best_price NUMERIC(18,2);
ALTER TABLE spec_items ADD COLUMN IF NOT EXISTS best_vendor_name VARCHAR(500);
ALTER TABLE spec_items ADD COLUMN IF NOT EXISTS budget_item_id UUID;

CREATE INDEX IF NOT EXISTS idx_spec_item_supply_status ON spec_items(supply_status) WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_spec_item_budget ON spec_items(budget_item_id) WHERE budget_item_id IS NOT NULL AND NOT deleted;
