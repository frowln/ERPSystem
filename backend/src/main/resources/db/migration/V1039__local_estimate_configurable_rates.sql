-- Configurable overhead and profit rates per estimate (replace hardcoded 8%)
ALTER TABLE local_estimates ADD COLUMN IF NOT EXISTS overhead_rate NUMERIC(8,4) DEFAULT 0.12;
ALTER TABLE local_estimates ADD COLUMN IF NOT EXISTS profit_rate NUMERIC(8,4) DEFAULT 0.08;
