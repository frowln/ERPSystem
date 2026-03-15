-- P1-FIN-5: Add tenant isolation and type classification to cost_centers.
-- Also link budget_items to cost centers for granular budget allocation.

-- cost_centers: add organization_id and type
ALTER TABLE cost_centers
    ADD COLUMN IF NOT EXISTS organization_id UUID,
    ADD COLUMN IF NOT EXISTS type           VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_cost_center_org ON cost_centers(organization_id);

-- budget_items: add cost_center_id reference
ALTER TABLE budget_items
    ADD COLUMN IF NOT EXISTS cost_center_id UUID;

CREATE INDEX IF NOT EXISTS idx_budget_item_cost_center ON budget_items(cost_center_id);
