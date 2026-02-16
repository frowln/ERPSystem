-- Seed default accounting journals and current accounting period.
-- Tenant-safe and idempotent for multi-tenant schema (organization_id scoped).

WITH target_orgs AS (
    SELECT DISTINCT u.organization_id
    FROM users u
    WHERE u.organization_id IS NOT NULL
    UNION
    SELECT CAST('00000000-0000-0000-0000-000000000001' AS UUID)
    WHERE EXISTS (
        SELECT 1
        FROM organizations o
        WHERE o.id = '00000000-0000-0000-0000-000000000001'
    )
),
journal_templates AS (
    SELECT *
    FROM (VALUES
        ('GEN', 'Общий журнал', 'GENERAL'),
        ('BANK', 'Банковский журнал', 'BANK'),
        ('CASH', 'Кассовый журнал', 'CASH'),
        ('SALES', 'Журнал продаж', 'SALES'),
        ('PURCHASE', 'Журнал закупок', 'PURCHASE')
    ) AS templates(code, name, journal_type)
)
INSERT INTO financial_journals (code, name, journal_type, is_active, organization_id, created_by)
SELECT
    t.code,
    t.name,
    t.journal_type,
    TRUE,
    o.organization_id,
    'system'
FROM target_orgs o
CROSS JOIN journal_templates t
ON CONFLICT (organization_id, code) DO UPDATE
SET
    name = EXCLUDED.name,
    journal_type = EXCLUDED.journal_type,
    is_active = TRUE,
    deleted = FALSE,
    updated_at = NOW(),
    updated_by = 'system';

WITH target_orgs AS (
    SELECT DISTINCT u.organization_id
    FROM users u
    WHERE u.organization_id IS NOT NULL
    UNION
    SELECT CAST('00000000-0000-0000-0000-000000000001' AS UUID)
    WHERE EXISTS (
        SELECT 1
        FROM organizations o
        WHERE o.id = '00000000-0000-0000-0000-000000000001'
    )
)
INSERT INTO account_periods (year, month, status, organization_id, created_by)
SELECT
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    'OPEN',
    o.organization_id,
    'system'
FROM target_orgs o
ON CONFLICT (organization_id, year, month) DO UPDATE
SET
    deleted = FALSE,
    updated_at = NOW(),
    updated_by = 'system';
