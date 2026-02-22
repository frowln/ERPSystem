-- P4-01: Auto KS-2 Pipeline from Field Data - tracking columns
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS pipeline_generated BOOLEAN DEFAULT false;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS pipeline_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS source_daily_log_ids TEXT; -- JSON array of daily log IDs used
