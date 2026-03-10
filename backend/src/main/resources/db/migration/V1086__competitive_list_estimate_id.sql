-- Add estimate_id to competitive_lists for grouped estimate-based КЛ
ALTER TABLE competitive_lists ADD COLUMN IF NOT EXISTS estimate_id UUID;
CREATE INDEX IF NOT EXISTS idx_cl_estimate ON competitive_lists (estimate_id);
