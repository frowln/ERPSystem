-- Long-lead item tracking on budget_items
ALTER TABLE budget_items ADD COLUMN is_long_lead BOOLEAN DEFAULT FALSE;
ALTER TABLE budget_items ADD COLUMN lead_time_days INTEGER;
ALTER TABLE budget_items ADD COLUMN order_deadline DATE;
ALTER TABLE budget_items ADD COLUMN order_status VARCHAR(20);
