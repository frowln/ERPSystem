-- Budget-level own cost percentages (reserves, overhead, temporary structures)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS contingency_percent NUMERIC(5,2) DEFAULT 5.00;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS overhead_percent NUMERIC(5,2) DEFAULT 12.00;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS temp_structures_percent NUMERIC(5,2) DEFAULT 3.00;
