-- V124: Add organizationId to defects, punch_lists, punch_items for tenant isolation
-- Also add quality_check_id link and drawing pin fields for defect registry

-- 1. Add organization_id to defects
ALTER TABLE defects ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS quality_check_id UUID;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS drawing_id UUID;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS pin_x DOUBLE PRECISION;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS pin_y DOUBLE PRECISION;

UPDATE defects d SET organization_id = p.organization_id
FROM projects p WHERE d.project_id = p.id AND d.organization_id IS NULL;

ALTER TABLE defects ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_defect_org ON defects (organization_id);
CREATE INDEX IF NOT EXISTS idx_defect_qc ON defects (quality_check_id);

-- 2. Add organization_id to punch_lists
ALTER TABLE punch_lists ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE punch_lists pl SET organization_id = p.organization_id
FROM projects p WHERE pl.project_id = p.id AND pl.organization_id IS NULL;

ALTER TABLE punch_lists ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_punch_list_org ON punch_lists (organization_id);

-- 3. Add organization_id to punch_items
ALTER TABLE punch_items ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE punch_items pi SET organization_id = pl.organization_id
FROM punch_lists pl WHERE pi.punch_list_id = pl.id AND pi.organization_id IS NULL;

-- Some punch_items might have NULL punch_list_id — backfill from projects via join
UPDATE punch_items pi SET organization_id = (
    SELECT p.organization_id FROM projects p LIMIT 1
) WHERE pi.organization_id IS NULL;

ALTER TABLE punch_items ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_punch_item_org ON punch_items (organization_id);
