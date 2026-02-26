-- Fix varchar columns that should be UUID type
-- These were created as varchar in earlier migrations but entities declare them as UUID

-- multi_project_allocations
ALTER TABLE multi_project_allocations
    ALTER COLUMN organization_id TYPE uuid USING organization_id::uuid;

-- portal_ks2_drafts
ALTER TABLE portal_ks2_drafts
    ALTER COLUMN contract_id TYPE uuid USING contract_id::uuid,
    ALTER COLUMN linked_ks2_id TYPE uuid USING linked_ks2_id::uuid,
    ALTER COLUMN organization_id TYPE uuid USING organization_id::uuid,
    ALTER COLUMN portal_user_id TYPE uuid USING portal_user_id::uuid,
    ALTER COLUMN project_id TYPE uuid USING project_id::uuid,
    ALTER COLUMN reviewed_by TYPE uuid USING reviewed_by::uuid;

-- portal_tasks
ALTER TABLE portal_tasks
    ALTER COLUMN assigned_by_id TYPE uuid USING assigned_by_id::uuid,
    ALTER COLUMN organization_id TYPE uuid USING organization_id::uuid,
    ALTER COLUMN portal_user_id TYPE uuid USING portal_user_id::uuid,
    ALTER COLUMN project_id TYPE uuid USING project_id::uuid;

-- Fix duplicate index name: rename warehouse_orders idx_wo_status
DROP INDEX IF EXISTS idx_wo_status;
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_order_status ON warehouse_orders(status);
