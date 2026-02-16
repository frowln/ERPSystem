-- Multi-tenancy: tenant-scope warehouse core inventory tables by organization_id.

-- ============================================================================
-- warehouse_locations
-- ============================================================================
ALTER TABLE warehouse_locations
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE warehouse_locations wl
SET organization_id = p.organization_id
FROM projects p
WHERE wl.organization_id IS NULL
  AND wl.project_id IS NOT NULL
  AND p.id = wl.project_id;

UPDATE warehouse_locations wl
SET organization_id = u.organization_id
FROM users u
WHERE wl.organization_id IS NULL
  AND wl.responsible_id IS NOT NULL
  AND u.id = wl.responsible_id;

UPDATE warehouse_locations wl
SET organization_id = parent.organization_id
FROM warehouse_locations parent
WHERE wl.organization_id IS NULL
  AND wl.parent_id IS NOT NULL
  AND parent.id = wl.parent_id
  AND parent.organization_id IS NOT NULL;

UPDATE warehouse_locations
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE warehouse_locations
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE warehouse_locations
    DROP CONSTRAINT IF EXISTS warehouse_locations_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wh_location_org_code
    ON warehouse_locations(organization_id, code)
    WHERE code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wh_location_org ON warehouse_locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_wh_location_org_project ON warehouse_locations(organization_id, project_id);

-- ============================================================================
-- materials
-- ============================================================================
ALTER TABLE materials
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE materials m
SET organization_id = wl.organization_id
FROM stock_entries se
JOIN warehouse_locations wl ON wl.id = se.location_id
WHERE m.organization_id IS NULL
  AND se.material_id = m.id
  AND wl.organization_id IS NOT NULL;

UPDATE materials
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE materials
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE materials
    DROP CONSTRAINT IF EXISTS materials_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_material_org_code
    ON materials(organization_id, code)
    WHERE code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_material_org ON materials(organization_id);

-- ============================================================================
-- stock_entries
-- ============================================================================
ALTER TABLE stock_entries
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE stock_entries se
SET organization_id = wl.organization_id
FROM warehouse_locations wl
WHERE se.organization_id IS NULL
  AND wl.id = se.location_id
  AND wl.organization_id IS NOT NULL;

UPDATE stock_entries se
SET organization_id = m.organization_id
FROM materials m
WHERE se.organization_id IS NULL
  AND m.id = se.material_id
  AND m.organization_id IS NOT NULL;

UPDATE stock_entries
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE stock_entries
    ALTER COLUMN organization_id SET NOT NULL;

DROP INDEX IF EXISTS uq_stock_material_location;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_material_location
    ON stock_entries(organization_id, material_id, location_id)
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_stock_org ON stock_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_org_location ON stock_entries(organization_id, location_id);

-- ============================================================================
-- stock_movements
-- ============================================================================
ALTER TABLE stock_movements
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE stock_movements sm
SET organization_id = p.organization_id
FROM projects p
WHERE sm.organization_id IS NULL
  AND sm.project_id IS NOT NULL
  AND p.id = sm.project_id;

UPDATE stock_movements sm
SET organization_id = wl.organization_id
FROM warehouse_locations wl
WHERE sm.organization_id IS NULL
  AND sm.source_location_id IS NOT NULL
  AND wl.id = sm.source_location_id;

UPDATE stock_movements sm
SET organization_id = wl.organization_id
FROM warehouse_locations wl
WHERE sm.organization_id IS NULL
  AND sm.destination_location_id IS NOT NULL
  AND wl.id = sm.destination_location_id;

DO $$
BEGIN
    IF to_regclass('public.purchase_requests') IS NOT NULL THEN
        EXECUTE $sql$
            UPDATE stock_movements sm
            SET organization_id = pr.organization_id
            FROM purchase_requests pr
            WHERE sm.organization_id IS NULL
              AND sm.purchase_request_id IS NOT NULL
              AND pr.id = sm.purchase_request_id
        $sql$;
    END IF;
END $$;

UPDATE stock_movements sm
SET organization_id = u.organization_id
FROM users u
WHERE sm.organization_id IS NULL
  AND sm.responsible_id IS NOT NULL
  AND u.id = sm.responsible_id;

UPDATE stock_movements
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE stock_movements
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE stock_movements
    DROP CONSTRAINT IF EXISTS stock_movements_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sm_org_number
    ON stock_movements(organization_id, number)
    WHERE number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sm_org ON stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_sm_org_status ON stock_movements(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_sm_org_project ON stock_movements(organization_id, project_id);

-- ============================================================================
-- inventory_checks
-- ============================================================================
ALTER TABLE inventory_checks
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE inventory_checks ic
SET organization_id = wl.organization_id
FROM warehouse_locations wl
WHERE ic.organization_id IS NULL
  AND wl.id = ic.location_id;

UPDATE inventory_checks ic
SET organization_id = p.organization_id
FROM projects p
WHERE ic.organization_id IS NULL
  AND ic.project_id IS NOT NULL
  AND p.id = ic.project_id;

UPDATE inventory_checks ic
SET organization_id = u.organization_id
FROM users u
WHERE ic.organization_id IS NULL
  AND ic.responsible_id IS NOT NULL
  AND u.id = ic.responsible_id;

UPDATE inventory_checks
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE inventory_checks
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE inventory_checks
    DROP CONSTRAINT IF EXISTS inventory_checks_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ic_org_name
    ON inventory_checks(organization_id, name)
    WHERE name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ic_org ON inventory_checks(organization_id);
CREATE INDEX IF NOT EXISTS idx_ic_org_status ON inventory_checks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ic_org_location ON inventory_checks(organization_id, location_id);

-- ============================================================================
-- stock_limits
-- ============================================================================
ALTER TABLE stock_limits
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE stock_limits sl
SET organization_id = wl.organization_id
FROM warehouse_locations wl
WHERE sl.organization_id IS NULL
  AND wl.id = sl.warehouse_location_id;

UPDATE stock_limits sl
SET organization_id = m.organization_id
FROM materials m
WHERE sl.organization_id IS NULL
  AND m.id = sl.material_id
  AND m.organization_id IS NOT NULL;

UPDATE stock_limits
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE stock_limits
    ALTER COLUMN organization_id SET NOT NULL;

DROP INDEX IF EXISTS uq_stock_limit_material_location;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_limit_material_location
    ON stock_limits(organization_id, material_id, warehouse_location_id)
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_sl_org ON stock_limits(organization_id);
CREATE INDEX IF NOT EXISTS idx_sl_org_material ON stock_limits(organization_id, material_id);
CREATE INDEX IF NOT EXISTS idx_sl_org_location ON stock_limits(organization_id, warehouse_location_id);

-- ============================================================================
-- stock_limit_alerts
-- ============================================================================
ALTER TABLE stock_limit_alerts
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE stock_limit_alerts sla
SET organization_id = sl.organization_id
FROM stock_limits sl
WHERE sla.organization_id IS NULL
  AND sl.id = sla.stock_limit_id
  AND sl.organization_id IS NOT NULL;

UPDATE stock_limit_alerts sla
SET organization_id = m.organization_id
FROM materials m
WHERE sla.organization_id IS NULL
  AND m.id = sla.material_id
  AND m.organization_id IS NOT NULL;

UPDATE stock_limit_alerts
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE stock_limit_alerts
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sla_org ON stock_limit_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_sla_org_resolved ON stock_limit_alerts(organization_id, is_resolved);
