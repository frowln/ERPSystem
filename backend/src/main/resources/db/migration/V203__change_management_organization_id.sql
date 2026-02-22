-- =============================================================================
-- V203: Change Management tenant columns (organization_id)
--
-- The Change Management module entities use the Hibernate tenant filter:
--   @Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
-- so the underlying tables must contain organization_id. Some existing databases
-- may have been created before tenant isolation was rolled out for these tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- change_events
-- ---------------------------------------------------------------------------
ALTER TABLE change_events
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE change_events ce
SET organization_id = p.organization_id
FROM projects p
WHERE ce.organization_id IS NULL
  AND ce.project_id = p.id;

ALTER TABLE change_events
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_change_events_org
    ON change_events(organization_id);

CREATE INDEX IF NOT EXISTS idx_change_events_org_project
    ON change_events(organization_id, project_id);

-- ---------------------------------------------------------------------------
-- change_order_requests
-- ---------------------------------------------------------------------------
ALTER TABLE change_order_requests
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE change_order_requests cor
SET organization_id = p.organization_id
FROM projects p
WHERE cor.organization_id IS NULL
  AND cor.project_id = p.id;

ALTER TABLE change_order_requests
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_change_order_requests_org
    ON change_order_requests(organization_id);

CREATE INDEX IF NOT EXISTS idx_change_order_requests_org_project
    ON change_order_requests(organization_id, project_id);

-- ---------------------------------------------------------------------------
-- change_orders
-- ---------------------------------------------------------------------------
ALTER TABLE change_orders
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Prefer project-derived tenant id (project_id is required)
UPDATE change_orders co
SET organization_id = p.organization_id
FROM projects p
WHERE co.organization_id IS NULL
  AND co.project_id = p.id;

-- Fallback: derive via contract (safety net)
UPDATE change_orders co
SET organization_id = c.organization_id
FROM contracts c
WHERE co.organization_id IS NULL
  AND co.contract_id = c.id;

ALTER TABLE change_orders
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_change_orders_org
    ON change_orders(organization_id);

CREATE INDEX IF NOT EXISTS idx_change_orders_org_project
    ON change_orders(organization_id, project_id);

