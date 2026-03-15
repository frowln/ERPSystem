ALTER TABLE warranty_obligations ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);
ALTER TABLE warranty_obligations ADD COLUMN IF NOT EXISTS next_inspection_date DATE;
ALTER TABLE warranty_obligations ADD COLUMN IF NOT EXISTS inspection_interval_months INTEGER DEFAULT 12;
ALTER TABLE warranty_obligations ADD COLUMN IF NOT EXISTS service_provider VARCHAR(500);
ALTER TABLE warranty_obligations ADD COLUMN IF NOT EXISTS service_contact VARCHAR(255);
