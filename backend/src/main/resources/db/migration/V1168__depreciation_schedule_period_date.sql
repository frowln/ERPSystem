-- P1-ACC-3: Add period_date to depreciation_schedules so schedules can be
-- generated without requiring an AccountPeriod record.
-- Also relax the NOT NULL constraint on period_id to allow date-based entries.

ALTER TABLE depreciation_schedules
    ALTER COLUMN period_id DROP NOT NULL;

ALTER TABLE depreciation_schedules
    ADD COLUMN IF NOT EXISTS period_date DATE;

CREATE INDEX IF NOT EXISTS idx_depreciation_period_date
    ON depreciation_schedules(asset_id, period_date);
