-- =============================================================================
-- Multi-tenancy hardening: tenant-scope warehouse_orders and limit_fence_sheets.
-- =============================================================================

-- ----------------------------
-- warehouse_orders
-- ----------------------------
ALTER TABLE warehouse_orders
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Prefer organization from linked purchase order.
UPDATE warehouse_orders wo
SET organization_id = po.organization_id
FROM purchase_orders po
WHERE wo.organization_id IS NULL
  AND wo.purchase_order_id IS NOT NULL
  AND po.id = wo.purchase_order_id;

-- Fallback from linked contract.
UPDATE warehouse_orders wo
SET organization_id = c.organization_id
FROM contracts c
WHERE wo.organization_id IS NULL
  AND wo.contract_id IS NOT NULL
  AND c.id = wo.contract_id;

-- Fallback from responsible/receiver users.
UPDATE warehouse_orders wo
SET organization_id = u.organization_id
FROM users u
WHERE wo.organization_id IS NULL
  AND wo.responsible_id IS NOT NULL
  AND u.id = wo.responsible_id;

UPDATE warehouse_orders wo
SET organization_id = u.organization_id
FROM users u
WHERE wo.organization_id IS NULL
  AND wo.receiver_id IS NOT NULL
  AND u.id = wo.receiver_id;

-- Deterministic bootstrap fallback for legacy rows.
UPDATE warehouse_orders
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE warehouse_orders
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE warehouse_orders
    DROP CONSTRAINT IF EXISTS warehouse_orders_order_number_key;

ALTER TABLE warehouse_orders
    ADD CONSTRAINT uq_warehouse_order_org_number UNIQUE (organization_id, order_number);

CREATE INDEX IF NOT EXISTS idx_wo_org ON warehouse_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_wo_org_status ON warehouse_orders(organization_id, status);

-- ----------------------------
-- limit_fence_sheets
-- ----------------------------
ALTER TABLE limit_fence_sheets
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Prefer organization from linked project.
UPDATE limit_fence_sheets lfs
SET organization_id = p.organization_id
FROM projects p
WHERE lfs.organization_id IS NULL
  AND lfs.project_id IS NOT NULL
  AND p.id = lfs.project_id;

-- Fallback from responsible user.
UPDATE limit_fence_sheets lfs
SET organization_id = u.organization_id
FROM users u
WHERE lfs.organization_id IS NULL
  AND lfs.responsible_id IS NOT NULL
  AND u.id = lfs.responsible_id;

-- Deterministic bootstrap fallback for legacy rows.
UPDATE limit_fence_sheets
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE limit_fence_sheets
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE limit_fence_sheets
    DROP CONSTRAINT IF EXISTS limit_fence_sheets_sheet_number_key;

ALTER TABLE limit_fence_sheets
    ADD CONSTRAINT uq_lfs_org_sheet_number UNIQUE (organization_id, sheet_number);

CREATE INDEX IF NOT EXISTS idx_lfs_org ON limit_fence_sheets(organization_id);
CREATE INDEX IF NOT EXISTS idx_lfs_org_project ON limit_fence_sheets(organization_id, project_id);
