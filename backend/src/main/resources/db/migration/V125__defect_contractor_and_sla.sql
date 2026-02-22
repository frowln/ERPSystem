-- P2-03: Defect remediation tracking — contractor binding + SLA fields
-- Add contractor_id (links to counterparties), sla_deadline_hours, re-inspection count

ALTER TABLE defects ADD COLUMN IF NOT EXISTS contractor_id UUID;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS sla_deadline_hours INTEGER;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS reinspection_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_defect_contractor ON defects (contractor_id);
CREATE INDEX IF NOT EXISTS idx_defect_contractor_status ON defects (contractor_id, status) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_defect_project_status ON defects (project_id, status) WHERE deleted = false;

COMMENT ON COLUMN defects.contractor_id IS 'Responsible contractor (counterparty) for defect remediation';
COMMENT ON COLUMN defects.sla_deadline_hours IS 'SLA deadline in hours from assignment';
COMMENT ON COLUMN defects.reinspection_count IS 'Number of times defect was sent back for re-inspection';
COMMENT ON COLUMN defects.assigned_at IS 'Timestamp when defect was first assigned (IN_PROGRESS)';
COMMENT ON COLUMN defects.verification_requested_at IS 'Timestamp when fix was submitted for verification (FIXED)';
