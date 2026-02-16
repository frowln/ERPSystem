-- =============================================================================
-- Bootstrap a default organization and backfill legacy NULL tenant ids.
--
-- Why:
-- - Tenant isolation cannot be enforced if users/projects have NULL organization_id.
-- - A deterministic org id helps local/dev/test environments and prevents cross-tenant leakage
--   via "NULL-tenant" records.
--
-- Notes:
-- - This is a transitional step. In a mature SaaS, tenant ids should be NOT NULL everywhere
--   and assigned explicitly via onboarding / provisioning flows.
-- =============================================================================

-- Deterministic UUID for bootstrap tenant
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization')
ON CONFLICT (id) DO NOTHING;

-- Ensure seeded admin users belong to a tenant by default (bootstrap only)
UPDATE users
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE email IN ('admin@privod.com', 'admin@privod.ru')
  AND organization_id IS NULL;

-- Backfill projects that were created before tenant enforcement
UPDATE projects
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

