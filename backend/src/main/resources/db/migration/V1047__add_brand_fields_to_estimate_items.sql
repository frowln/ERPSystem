-- Add brand, product_code, manufacturer fields to estimate_items
-- These fields are copied from spec_items during Spec → Estimate creation
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS product_code VARCHAR(255);
ALTER TABLE estimate_items ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
