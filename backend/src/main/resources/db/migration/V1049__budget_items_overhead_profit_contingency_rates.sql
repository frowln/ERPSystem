-- V1049: Add overhead_rate, profit_rate, contingency_rate to budget_items
-- These columns support construction cost markup calculations in the Financial Model:
-- overhead_rate: НР (накладные расходы) — typically 15%
-- profit_rate: СП (сметная прибыль) — typically 8%
-- contingency_rate: непредвиденные расходы — typically 3%

ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS overhead_rate NUMERIC(8,4) DEFAULT 15;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS profit_rate NUMERIC(8,4) DEFAULT 8;
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS contingency_rate NUMERIC(8,4) DEFAULT 3;

COMMENT ON COLUMN budget_items.overhead_rate IS 'Ставка накладных расходов (НР), %';
COMMENT ON COLUMN budget_items.profit_rate IS 'Ставка сметной прибыли (СП), %';
COMMENT ON COLUMN budget_items.contingency_rate IS 'Ставка непредвиденных расходов, %';
