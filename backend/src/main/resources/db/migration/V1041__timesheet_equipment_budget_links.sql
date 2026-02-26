-- Link timesheets and equipment usage logs to budget items for ФОТ/техника cost sync
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS budget_item_id UUID;
ALTER TABLE equipment_usage_logs ADD COLUMN IF NOT EXISTS budget_item_id UUID;
