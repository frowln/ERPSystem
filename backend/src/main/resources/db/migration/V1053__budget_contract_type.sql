-- Contract type fields on budgets
ALTER TABLE budgets ADD COLUMN contract_type VARCHAR(30);
ALTER TABLE budgets ADD COLUMN retainage_percent NUMERIC(5,2);
ALTER TABLE budgets ADD COLUMN guaranteed_max_price NUMERIC(18,2);
