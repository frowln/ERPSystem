-- V202: add explicit estimate price for budget positions
-- Keeps backward compatibility by backfilling from cost_price.

ALTER TABLE budget_items
    ADD COLUMN IF NOT EXISTS estimate_price NUMERIC(18,2);

UPDATE budget_items
SET estimate_price = COALESCE(estimate_price, cost_price, 0)
WHERE estimate_price IS NULL;

ALTER TABLE budget_items
    ALTER COLUMN estimate_price SET DEFAULT 0;
