-- Add insurance_score column and completed_projects to contractor_prequalifications
ALTER TABLE contractor_prequalifications ADD COLUMN IF NOT EXISTS insurance_score INTEGER DEFAULT 0;
ALTER TABLE contractor_prequalifications ADD COLUMN IF NOT EXISTS completed_projects INTEGER;
ALTER TABLE contractor_prequalifications ADD COLUMN IF NOT EXISTS sro_member BOOLEAN DEFAULT FALSE;
