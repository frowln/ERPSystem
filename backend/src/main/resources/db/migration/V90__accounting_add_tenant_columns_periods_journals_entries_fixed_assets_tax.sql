-- =============================================================================
-- Multi-tenancy: tenant-scope core accounting tables.
--
-- Why:
-- - These tables previously had no organization_id, so any authenticated user could
--   potentially list/modify records across tenants (data leakage).
-- - Unique constraints (periods, journal codes, inventory numbers) must be tenant-scoped.
--
-- Strategy:
-- - Add organization_id columns
-- - Backfill legacy rows to the bootstrap/default organization
-- - Replace global unique constraints with tenant-scoped variants
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Account Periods
-- -----------------------------------------------------------------------------
ALTER TABLE account_periods
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE account_periods
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE account_periods
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE account_periods
    DROP CONSTRAINT IF EXISTS uq_account_period;

ALTER TABLE account_periods
    ADD CONSTRAINT uq_account_period_org_year_month UNIQUE (organization_id, year, month);

CREATE INDEX IF NOT EXISTS idx_account_period_org ON account_periods(organization_id);

-- -----------------------------------------------------------------------------
-- Financial Journals
-- -----------------------------------------------------------------------------
ALTER TABLE financial_journals
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE financial_journals
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE financial_journals
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE financial_journals
    DROP CONSTRAINT IF EXISTS uq_financial_journal_code;

ALTER TABLE financial_journals
    ADD CONSTRAINT uq_financial_journal_org_code UNIQUE (organization_id, code);

CREATE INDEX IF NOT EXISTS idx_financial_journal_org ON financial_journals(organization_id);

-- -----------------------------------------------------------------------------
-- Account Entries (provodki)
-- -----------------------------------------------------------------------------
ALTER TABLE account_entries
    ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Prefer period tenant (period_id is mandatory)
UPDATE account_entries ae
SET organization_id = ap.organization_id
FROM account_periods ap
WHERE ae.organization_id IS NULL
  AND ap.id = ae.period_id;

-- Fallback for any legacy inconsistencies
UPDATE account_entries
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE account_entries
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_account_entry_org ON account_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_account_entry_org_period ON account_entries(organization_id, period_id);
CREATE INDEX IF NOT EXISTS idx_account_entry_org_journal ON account_entries(organization_id, journal_id);

-- -----------------------------------------------------------------------------
-- Journal Entries (module-internal)
-- -----------------------------------------------------------------------------
ALTER TABLE journal_entries
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE journal_entries je
SET organization_id = fj.organization_id
FROM financial_journals fj
WHERE je.organization_id IS NULL
  AND fj.id = je.journal_id;

UPDATE journal_entries
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE journal_entries
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_journal_entry_org ON journal_entries(organization_id);

-- -----------------------------------------------------------------------------
-- Tax Declarations
-- -----------------------------------------------------------------------------
ALTER TABLE tax_declarations
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE tax_declarations td
SET organization_id = ap.organization_id
FROM account_periods ap
WHERE td.organization_id IS NULL
  AND ap.id = td.period_id;

UPDATE tax_declarations
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE tax_declarations
    ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tax_declaration_org ON tax_declarations(organization_id);

-- -----------------------------------------------------------------------------
-- Fixed Assets
-- -----------------------------------------------------------------------------
ALTER TABLE fixed_assets
    ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE fixed_assets
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

ALTER TABLE fixed_assets
    ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE fixed_assets
    DROP CONSTRAINT IF EXISTS uq_fixed_asset_inventory;

ALTER TABLE fixed_assets
    ADD CONSTRAINT uq_fixed_asset_org_inventory UNIQUE (organization_id, inventory_number);

CREATE INDEX IF NOT EXISTS idx_fixed_asset_org ON fixed_assets(organization_id);

