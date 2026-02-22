-- =============================================================================
-- V228: Add customer_price to budget_items for client-facing pricing
-- =============================================================================

ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS customer_price NUMERIC(18,2) DEFAULT 0.00;
