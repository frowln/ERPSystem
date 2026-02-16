-- =============================================================================
-- V1010: Demo accounting dataset for development environment
-- Adds realistic journal entries, fixed assets and a tax declaration
-- for the primary demo tenant (ООО "СтройИнвест").
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Demo journal entries
-- -----------------------------------------------------------------------------

WITH tenant AS (
    SELECT o.id AS organization_id
    FROM organizations o
    WHERE o.inn = '7701234567'
    LIMIT 1
),
period_ref AS (
    SELECT p.id AS period_id, t.organization_id
    FROM tenant t
    JOIN account_periods p
      ON p.organization_id = t.organization_id
     AND p.deleted = FALSE
    ORDER BY p.year DESC, p.month DESC
    LIMIT 1
),
refs AS (
    SELECT
        pr.organization_id,
        pr.period_id,
        (SELECT j.id FROM financial_journals j WHERE j.organization_id = pr.organization_id AND j.code = 'PURCHASE' AND j.deleted = FALSE LIMIT 1) AS journal_purchase_id,
        (SELECT j.id FROM financial_journals j WHERE j.organization_id = pr.organization_id AND j.code = 'BANK' AND j.deleted = FALSE LIMIT 1) AS journal_bank_id,
        (SELECT j.id FROM financial_journals j WHERE j.organization_id = pr.organization_id AND j.code = 'GEN' AND j.deleted = FALSE LIMIT 1) AS journal_general_id,
        (SELECT j.id FROM financial_journals j WHERE j.organization_id = pr.organization_id AND j.code = 'SALES' AND j.deleted = FALSE LIMIT 1) AS journal_sales_id,
        (SELECT j.id FROM financial_journals j WHERE j.organization_id = pr.organization_id AND j.code = 'CASH' AND j.deleted = FALSE LIMIT 1) AS journal_cash_id,
        (SELECT a.id FROM account_plans a WHERE a.code = '10' AND a.deleted = FALSE LIMIT 1) AS account_10_id,
        (SELECT a.id FROM account_plans a WHERE a.code = '20' AND a.deleted = FALSE LIMIT 1) AS account_20_id,
        (SELECT a.id FROM account_plans a WHERE a.code = '50' AND a.deleted = FALSE LIMIT 1) AS account_50_id,
        (SELECT a.id FROM account_plans a WHERE a.code = '51' AND a.deleted = FALSE LIMIT 1) AS account_51_id,
        (SELECT a.id FROM account_plans a WHERE a.code = '60' AND a.deleted = FALSE LIMIT 1) AS account_60_id,
        (SELECT a.id FROM account_plans a WHERE a.code = '62' AND a.deleted = FALSE LIMIT 1) AS account_62_id,
        (SELECT a.id FROM account_plans a WHERE a.code = '68' AND a.deleted = FALSE LIMIT 1) AS account_68_id,
        (SELECT a.id FROM account_plans a WHERE a.code = '70' AND a.deleted = FALSE LIMIT 1) AS account_70_id,
        (SELECT a.id FROM account_plans a WHERE a.code = '90' AND a.deleted = FALSE LIMIT 1) AS account_90_id
    FROM period_ref pr
)
INSERT INTO account_entries (
    id, journal_id, debit_account_id, credit_account_id, amount,
    entry_date, description, document_type, document_id,
    period_id, organization_id, created_by
)
SELECT
    entry_id::UUID,
    journal_id,
    debit_account_id,
    credit_account_id,
    amount,
    entry_date,
    description,
    document_type,
    document_id::UUID,
    r.period_id,
    r.organization_id,
    'seed'
FROM refs r
JOIN (
    VALUES
        (
            '10100000-0000-0000-0000-000000000101',
            '10100000-0000-0000-0000-000000000001',
            'GOODS_RECEIPT',
            CURRENT_DATE - INTERVAL '12 days',
            1850000.00::NUMERIC,
            'Поступление бетона по накладной №БП-245',
            'journal_purchase_id',
            'account_10_id',
            'account_60_id'
        ),
        (
            '10100000-0000-0000-0000-000000000102',
            '10100000-0000-0000-0000-000000000002',
            'ACT_KS2',
            CURRENT_DATE - INTERVAL '10 days',
            3420000.00::NUMERIC,
            'Приняты работы субподрядчика по монолиту (КС-2)',
            'journal_purchase_id',
            'account_20_id',
            'account_60_id'
        ),
        (
            '10100000-0000-0000-0000-000000000103',
            '10100000-0000-0000-0000-000000000003',
            'BANK_STATEMENT',
            CURRENT_DATE - INTERVAL '8 days',
            12800000.00::NUMERIC,
            'Поступление оплаты от заказчика по этапу 3',
            'journal_bank_id',
            'account_51_id',
            'account_62_id'
        ),
        (
            '10100000-0000-0000-0000-000000000104',
            '10100000-0000-0000-0000-000000000004',
            'PAYROLL',
            CURRENT_DATE - INTERVAL '6 days',
            2150000.00::NUMERIC,
            'Начисление заработной платы строительным бригадам',
            'journal_general_id',
            'account_20_id',
            'account_70_id'
        ),
        (
            '10100000-0000-0000-0000-000000000105',
            '10100000-0000-0000-0000-000000000005',
            'VAT_ACCRUAL',
            CURRENT_DATE - INTERVAL '4 days',
            1960000.00::NUMERIC,
            'Начисление НДС по реализации за период',
            'journal_sales_id',
            'account_90_id',
            'account_68_id'
        ),
        (
            '10100000-0000-0000-0000-000000000106',
            '10100000-0000-0000-0000-000000000006',
            'CASH_ORDER',
            CURRENT_DATE - INTERVAL '2 days',
            200000.00::NUMERIC,
            'Выдача наличных в подотчёт на хозяйственные нужды',
            'journal_cash_id',
            'account_50_id',
            'account_51_id'
        )
) AS seed(
    entry_id,
    document_id,
    document_type,
    entry_date,
    amount,
    description,
    journal_ref,
    debit_ref,
    credit_ref
)
ON TRUE
CROSS JOIN LATERAL (
    SELECT
        CASE seed.journal_ref
            WHEN 'journal_purchase_id' THEN r.journal_purchase_id
            WHEN 'journal_bank_id' THEN r.journal_bank_id
            WHEN 'journal_general_id' THEN r.journal_general_id
            WHEN 'journal_sales_id' THEN r.journal_sales_id
            WHEN 'journal_cash_id' THEN r.journal_cash_id
        END AS journal_id,
        CASE seed.debit_ref
            WHEN 'account_10_id' THEN r.account_10_id
            WHEN 'account_20_id' THEN r.account_20_id
            WHEN 'account_50_id' THEN r.account_50_id
            WHEN 'account_51_id' THEN r.account_51_id
            WHEN 'account_90_id' THEN r.account_90_id
        END AS debit_account_id,
        CASE seed.credit_ref
            WHEN 'account_51_id' THEN r.account_51_id
            WHEN 'account_60_id' THEN r.account_60_id
            WHEN 'account_62_id' THEN r.account_62_id
            WHEN 'account_68_id' THEN r.account_68_id
            WHEN 'account_70_id' THEN r.account_70_id
        END AS credit_account_id
) refs_map
WHERE refs_map.journal_id IS NOT NULL
  AND refs_map.debit_account_id IS NOT NULL
  AND refs_map.credit_account_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM account_entries e
      WHERE e.organization_id = r.organization_id
        AND e.document_id = seed.document_id::UUID
  );

-- -----------------------------------------------------------------------------
-- Demo fixed assets
-- -----------------------------------------------------------------------------

WITH tenant AS (
    SELECT o.id AS organization_id
    FROM organizations o
    WHERE o.inn = '7701234567'
    LIMIT 1
),
account_ref AS (
    SELECT a.id AS account_id
    FROM account_plans a
    WHERE a.code = '01'
      AND a.deleted = FALSE
    LIMIT 1
)
INSERT INTO fixed_assets (
    code, name, inventory_number, account_id, purchase_date, purchase_amount,
    useful_life_months, depreciation_method, current_value, status,
    organization_id, created_by
)
SELECT
    seed.code,
    seed.name,
    seed.inventory_number,
    ar.account_id,
    seed.purchase_date,
    seed.purchase_amount,
    seed.useful_life_months,
    seed.depreciation_method,
    seed.current_value,
    seed.status,
    t.organization_id,
    'seed'
FROM tenant t
JOIN account_ref ar ON TRUE
JOIN (
    VALUES
        ('OS-0001', 'Башенный кран Liebherr 132 EC-H', 'FA-2026-0001', CURRENT_DATE - INTERVAL '420 days', 28500000.00::NUMERIC, 120, 'LINEAR', 24100000.00::NUMERIC, 'ACTIVE'),
        ('OS-0002', 'Автогрейдер CAT 140 GC', 'FA-2026-0002', CURRENT_DATE - INTERVAL '300 days', 11800000.00::NUMERIC, 96, 'LINEAR', 9820000.00::NUMERIC, 'ACTIVE'),
        ('OS-0003', 'Дизель-генератор 250 кВт', 'FA-2026-0003', CURRENT_DATE - INTERVAL '190 days', 3400000.00::NUMERIC, 72, 'LINEAR', 3060000.00::NUMERIC, 'ACTIVE')
) AS seed(
    code,
    name,
    inventory_number,
    purchase_date,
    purchase_amount,
    useful_life_months,
    depreciation_method,
    current_value,
    status
)
ON CONFLICT (organization_id, inventory_number) DO UPDATE
SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    account_id = EXCLUDED.account_id,
    purchase_date = EXCLUDED.purchase_date,
    purchase_amount = EXCLUDED.purchase_amount,
    useful_life_months = EXCLUDED.useful_life_months,
    depreciation_method = EXCLUDED.depreciation_method,
    current_value = EXCLUDED.current_value,
    status = EXCLUDED.status,
    deleted = FALSE,
    updated_at = NOW(),
    updated_by = 'seed';

-- -----------------------------------------------------------------------------
-- Demo VAT declaration for the current period
-- -----------------------------------------------------------------------------

WITH tenant AS (
    SELECT o.id AS organization_id
    FROM organizations o
    WHERE o.inn = '7701234567'
    LIMIT 1
),
period_ref AS (
    SELECT p.id AS period_id, t.organization_id
    FROM tenant t
    JOIN account_periods p
      ON p.organization_id = t.organization_id
     AND p.deleted = FALSE
    ORDER BY p.year DESC, p.month DESC
    LIMIT 1
)
INSERT INTO tax_declarations (
    declaration_type, period_id, status, amount, submitted_at,
    file_url, notes, organization_id, created_by
)
SELECT
    'VAT',
    pr.period_id,
    'CALCULATED',
    1960000.00,
    NOW() - INTERVAL '1 day',
    '/demo/tax/vat-current-period.xml',
    'Расчёт НДС сформирован автоматически на основе демо-проводок',
    pr.organization_id,
    'seed'
FROM period_ref pr
WHERE NOT EXISTS (
    SELECT 1
    FROM tax_declarations td
    WHERE td.organization_id = pr.organization_id
      AND td.period_id = pr.period_id
      AND td.declaration_type = 'VAT'
      AND td.deleted = FALSE
);

COMMIT;
