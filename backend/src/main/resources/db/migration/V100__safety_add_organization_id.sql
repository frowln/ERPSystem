-- =============================================================================
-- Multi-tenancy: tenant-scope Safety module core entities.
-- - safety_incidents
-- - safety_inspections
-- - safety_violations
-- =============================================================================

ALTER TABLE safety_incidents
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE safety_incidents i
SET organization_id = p.organization_id
FROM projects p
WHERE i.organization_id IS NULL
  AND i.project_id IS NOT NULL
  AND p.id = i.project_id;

UPDATE safety_incidents i
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE i.organization_id IS NULL
  AND i.reported_by_id IS NOT NULL
  AND u.id = i.reported_by_id;

UPDATE safety_incidents
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE safety_incidents
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE safety_inspections
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE safety_inspections i
SET organization_id = p.organization_id
FROM projects p
WHERE i.organization_id IS NULL
  AND i.project_id IS NOT NULL
  AND p.id = i.project_id;

UPDATE safety_inspections i
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE i.organization_id IS NULL
  AND i.inspector_id IS NOT NULL
  AND u.id = i.inspector_id;

UPDATE safety_inspections
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE safety_inspections
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE safety_violations
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE safety_violations v
SET organization_id = si.organization_id
FROM safety_inspections si
WHERE v.organization_id IS NULL
  AND v.inspection_id IS NOT NULL
  AND si.id = v.inspection_id;

UPDATE safety_violations v
SET organization_id = si.organization_id
FROM safety_incidents si
WHERE v.organization_id IS NULL
  AND v.incident_id IS NOT NULL
  AND si.id = v.incident_id;

UPDATE safety_violations v
SET organization_id = COALESCE(u.organization_id, '00000000-0000-0000-0000-000000000001')
FROM users u
WHERE v.organization_id IS NULL
  AND v.assigned_to_id IS NOT NULL
  AND u.id = v.assigned_to_id;

UPDATE safety_violations
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE safety_violations
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_incident_org ON safety_incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_incident_org_project ON safety_incidents(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_inspection_org ON safety_inspections(organization_id);
CREATE INDEX IF NOT EXISTS idx_inspection_org_project ON safety_inspections(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_violation_org ON safety_violations(organization_id);
CREATE INDEX IF NOT EXISTS idx_violation_org_inspection ON safety_violations(organization_id, inspection_id);
CREATE INDEX IF NOT EXISTS idx_violation_org_incident ON safety_violations(organization_id, incident_id);

