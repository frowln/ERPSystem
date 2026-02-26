ALTER TABLE budget_snapshots
    ADD COLUMN IF NOT EXISTS snapshot_type VARCHAR(20) NOT NULL DEFAULT 'SNAPSHOT';

ALTER TABLE budget_snapshots
    ADD COLUMN IF NOT EXISTS source_snapshot_id UUID;

CREATE INDEX IF NOT EXISTS idx_bsnap_budget_type
    ON budget_snapshots (budget_id, snapshot_type)
    WHERE NOT deleted;
