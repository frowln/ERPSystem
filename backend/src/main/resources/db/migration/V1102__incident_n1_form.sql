-- =====================================================
-- P2-06: N-1 Form Fields for SafetyIncident
-- Adds mandatory Russian N-1 accident investigation form fields
-- =====================================================

-- Victim personal data (Form Н-1 sections)
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS victim_name VARCHAR(255);
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS victim_position VARCHAR(255);
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS victim_birth_date DATE;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS victim_work_start_date DATE;

-- Briefing / training info
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS briefing_date DATE;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS briefing_type VARCHAR(30);

-- Investigation dates
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_start_date DATE;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS investigation_end_date DATE;

-- Commission and N-1 numbering
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS commission_members TEXT;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS n1_form_number VARCHAR(50);

-- Reporting to regulatory authorities
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS reported_to_authorities BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE safety_incidents ADD COLUMN IF NOT EXISTS reported_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_incident_n1_form_number ON safety_incidents(n1_form_number);
CREATE INDEX IF NOT EXISTS idx_incident_reported_to ON safety_incidents(organization_id, reported_to_authorities);
