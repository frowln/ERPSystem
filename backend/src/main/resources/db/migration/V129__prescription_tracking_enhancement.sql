-- V129: Extend prescriptions for standalone tracking (P2-07)

-- Add organization_id and project_id for tenant isolation and direct project binding
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS project_id UUID;

-- Regulatory body type (GIT, Rostekhnadzor, etc.)
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS regulatory_body_type VARCHAR(30);

-- Received date (when prescription was officially received)
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS received_date DATE;

-- Response tracking
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS response_date DATE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS response_submitted_at TIMESTAMP;

-- Financial tracking
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS fine_amount NUMERIC(15,2);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS corrective_action_cost NUMERIC(15,2);

-- Appeal
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS appeal_deadline DATE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS appeal_filed BOOLEAN DEFAULT FALSE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS appeal_date DATE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS appeal_result VARCHAR(20);

-- Escalation
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS escalation_level INT DEFAULT 0;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS last_escalation_at TIMESTAMP;

-- Additional metadata
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS violation_count INT DEFAULT 1;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS regulatory_reference VARCHAR(500);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS response_letter_url VARCHAR(1000);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS responsible_name VARCHAR(255);

-- Add new status values: UNDER_REVIEW, RESPONSE_SUBMITTED, APPEALED, CLOSED
-- (PrescriptionStatus enum will handle these)

-- Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS prescription_number_seq START 1;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prescription_org ON prescriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_prescription_project ON prescriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_prescription_body_type ON prescriptions(regulatory_body_type);
CREATE INDEX IF NOT EXISTS idx_prescription_received ON prescriptions(received_date);
CREATE INDEX IF NOT EXISTS idx_prescription_escalation ON prescriptions(escalation_level);

-- Populate organization_id from inspection if available
UPDATE prescriptions p
SET organization_id = ri.organization_id,
    project_id = ri.project_id
FROM regulatory_inspections ri
WHERE p.inspection_id = ri.id
  AND p.organization_id IS NULL;
