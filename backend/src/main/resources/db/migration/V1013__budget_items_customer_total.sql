-- =============================================================================
-- V1013: Align budget_items with entity model (customer_total)
-- =============================================================================

ALTER TABLE budget_items
    ADD COLUMN IF NOT EXISTS customer_total NUMERIC(18,2);

UPDATE budget_items
SET customer_total = COALESCE(
    customer_total,
    ROUND(COALESCE(customer_price, 0) * COALESCE(quantity, 1), 2)
);

ALTER TABLE budget_items
    ALTER COLUMN customer_total SET DEFAULT 0;
