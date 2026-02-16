-- =============================================================================
-- Multi-tenancy: tenant-scope fleet vehicles.
-- =============================================================================

ALTER TABLE vehicles
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE vehicles v
SET organization_id = p.organization_id
FROM projects p
WHERE v.organization_id IS NULL
  AND v.current_project_id IS NOT NULL
  AND p.id = v.current_project_id;

UPDATE vehicles v
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE v.organization_id IS NULL
  AND v.responsible_id IS NOT NULL
  AND u.id = v.responsible_id;

UPDATE vehicles
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE vehicles
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_org ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_org_status ON vehicles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicle_org_project ON vehicles(organization_id, current_project_id);

