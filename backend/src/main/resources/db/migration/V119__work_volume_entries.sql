-- V119: Work volume entries table + planned volume fields on wbs_nodes
-- Supports daily work volume tracking linked to WBS nodes

-- Add planned volume tracking fields to wbs_nodes
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS planned_volume NUMERIC(16,3);
ALTER TABLE wbs_nodes ADD COLUMN IF NOT EXISTS volume_unit_of_measure VARCHAR(50);

-- Work volume entries: daily records of actual work performed per WBS node
CREATE TABLE IF NOT EXISTS work_volume_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id    UUID NOT NULL REFERENCES projects(id),
    wbs_node_id   UUID NOT NULL REFERENCES wbs_nodes(id),
    record_date   DATE NOT NULL,
    quantity      NUMERIC(16,3) NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL,
    description   VARCHAR(1000),
    notes         TEXT,
    created_by    UUID,
    deleted       BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wve_project ON work_volume_entries(project_id);
CREATE INDEX idx_wve_wbs_node ON work_volume_entries(wbs_node_id);
CREATE INDEX idx_wve_date ON work_volume_entries(record_date);
CREATE INDEX idx_wve_org ON work_volume_entries(organization_id);
CREATE UNIQUE INDEX idx_wve_node_date_unique ON work_volume_entries(wbs_node_id, record_date) WHERE deleted = FALSE;

CREATE OR REPLACE FUNCTION trg_work_volume_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_volume_entries_updated_at
    BEFORE UPDATE ON work_volume_entries
    FOR EACH ROW EXECUTE FUNCTION trg_work_volume_entries_updated_at();
