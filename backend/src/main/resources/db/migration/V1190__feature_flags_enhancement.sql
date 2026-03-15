ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS rollout_percentage INTEGER DEFAULT 100;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS target_user_ids JSONB DEFAULT '[]';
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS target_organization_ids JSONB DEFAULT '[]';
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS variants JSONB;  -- for A/B testing: {"A": 50, "B": 50}
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add constraint for rollout percentage
ALTER TABLE feature_flags ADD CONSTRAINT chk_rollout_pct CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100);
