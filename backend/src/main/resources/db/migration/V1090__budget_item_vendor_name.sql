-- V1090: Add vendor_name to budget_items for competitive list winner tracking
ALTER TABLE budget_items ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(500);
