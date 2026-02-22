-- P2-04: Safety briefing journal per ГОСТ 12.0.004-2015
-- Add organizationId for tenant isolation, signature fields, next-scheduled date, GOST compliance

ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS training_type VARCHAR(30);
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS next_scheduled_date DATE;
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS gost_number VARCHAR(50);
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS participant_count INTEGER NOT NULL DEFAULT 0;

-- Legacy compatibility: earlier schema used `type` instead of `training_type`
DO $$
BEGIN
  IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'safety_trainings'
        AND column_name = 'type'
  ) THEN
    EXECUTE 'UPDATE safety_trainings
             SET training_type = COALESCE(training_type, type)
             WHERE training_type IS NULL';
  END IF;
END $$;

-- Backfill organization_id from projects where available
UPDATE safety_trainings st SET organization_id = p.organization_id
  FROM projects p WHERE st.project_id = p.id AND st.organization_id IS NULL;

-- For trainings without project, use a fallback
UPDATE safety_trainings SET organization_id = (SELECT id FROM organizations LIMIT 1)
  WHERE organization_id IS NULL;

-- Make NOT NULL after backfill
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM safety_trainings WHERE organization_id IS NOT NULL LIMIT 1) THEN
    ALTER TABLE safety_trainings ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_st_org ON safety_trainings (organization_id);
CREATE INDEX IF NOT EXISTS idx_st_next_scheduled ON safety_trainings (next_scheduled_date) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_st_org_type ON safety_trainings (organization_id, training_type) WHERE deleted = false;

-- Ensure training_type has enough room for canonical enum values
ALTER TABLE safety_trainings ALTER COLUMN training_type TYPE VARCHAR(30);

COMMENT ON COLUMN safety_trainings.organization_id IS 'Tenant isolation';
COMMENT ON COLUMN safety_trainings.next_scheduled_date IS 'Auto-scheduled next repeat date (PERIODIC only)';
COMMENT ON COLUMN safety_trainings.gost_number IS 'ГОСТ reference number (e.g., 12.0.004-2015)';
COMMENT ON COLUMN safety_trainings.signature_data IS 'JSON: [{employeeId, signedAt, signatureBase64}]';
COMMENT ON COLUMN safety_trainings.completed_at IS 'Timestamp when training was marked completed';
COMMENT ON COLUMN safety_trainings.participant_count IS 'Denormalized count of participants';
