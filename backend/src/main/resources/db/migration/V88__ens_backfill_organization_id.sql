-- =============================================================================
-- V88: ENS multi-tenancy backfill
--
-- EnsAccount is now tenant-scoped by organization_id (derived from security context).
-- Legacy rows may have organization_id = NULL (previously allowed). Backfill:
--  - If ens_accounts.inn matches an organization.inn -> set to that organization.id
--  - Otherwise fallback to the default org bootstrap id.
-- =============================================================================

-- Backfill from organizations by INN (best-effort)
UPDATE ens_accounts ea
SET organization_id = o.id
FROM organizations o
WHERE ea.organization_id IS NULL
  AND o.deleted = false
  AND o.inn IS NOT NULL
  AND ea.inn = o.inn;

-- Fallback for remaining legacy rows
UPDATE ens_accounts
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

