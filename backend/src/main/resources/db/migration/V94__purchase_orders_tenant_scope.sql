-- =============================================================================
-- Tenant-scope purchase orders to prevent cross-organization data access.
--
-- Why:
-- - `purchase_orders` had nullable organization_id and global unique order number.
-- - Service-level filtering can be bypassed by inconsistent legacy rows.
--
-- What:
-- - Backfill organization_id from project tenant or default organization fallback
-- - Enforce NOT NULL
-- - Replace global unique(order_number) with tenant-scoped unique
-- - Add tenant indexes for fast filtered queries
-- =============================================================================

ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 1) Prefer project organization when available
UPDATE purchase_orders po
SET organization_id = p.organization_id
FROM projects p
WHERE po.organization_id IS NULL
  AND po.project_id IS NOT NULL
  AND p.id = po.project_id;

-- 2) Fallback to deterministic bootstrap organization
UPDATE purchase_orders
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE purchase_orders
    ALTER COLUMN organization_id SET NOT NULL;

-- Replace global unique with tenant-scoped unique
ALTER TABLE purchase_orders
    DROP CONSTRAINT IF EXISTS purchase_orders_order_number_key;

ALTER TABLE purchase_orders
    ADD CONSTRAINT uq_purchase_order_org_number UNIQUE (organization_id, order_number);

CREATE INDEX IF NOT EXISTS idx_po_org ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_po_org_status ON purchase_orders(organization_id, status);
