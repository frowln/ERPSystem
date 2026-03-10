ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS cost_code_id UUID;
ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS fk_bi_cost_code;
ALTER TABLE budget_items ADD CONSTRAINT fk_bi_cost_code FOREIGN KEY (cost_code_id) REFERENCES cost_codes(id);
