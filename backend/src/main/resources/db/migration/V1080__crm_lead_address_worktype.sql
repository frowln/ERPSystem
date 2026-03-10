-- Add object address and work type fields to CRM leads
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS object_address VARCHAR(500);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS work_type VARCHAR(100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS expected_start_date DATE;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS area_sqm NUMERIC(12, 2);
