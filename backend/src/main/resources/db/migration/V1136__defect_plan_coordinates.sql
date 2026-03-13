-- V1136: Add plan coordinates to defects table for construction plan pin placement
ALTER TABLE defects ADD COLUMN IF NOT EXISTS plan_x  DOUBLE PRECISION;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS plan_y  DOUBLE PRECISION;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS plan_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_def_plan_id ON defects (plan_id);
