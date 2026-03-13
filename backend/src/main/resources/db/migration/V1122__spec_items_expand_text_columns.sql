-- Expand spec_items text columns to accommodate long equipment names from PDF imports
ALTER TABLE spec_items ALTER COLUMN name TYPE VARCHAR(500);
ALTER TABLE spec_items ALTER COLUMN brand TYPE VARCHAR(300);
ALTER TABLE spec_items ALTER COLUMN product_code TYPE VARCHAR(300);
ALTER TABLE spec_items ALTER COLUMN manufacturer TYPE VARCHAR(300);
ALTER TABLE spec_items ALTER COLUMN notes TYPE VARCHAR(1000);
ALTER TABLE spec_items ALTER COLUMN section_name TYPE VARCHAR(300);
ALTER TABLE spec_items ALTER COLUMN position TYPE VARCHAR(20);
