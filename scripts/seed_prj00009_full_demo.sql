-- ============================================================================
-- PRJ-00009 full demo seed (object card end-to-end consistency)
--
-- What this script does:
-- 1) Repairs documents schema mismatch (organization_id) for local dev DB
-- 2) Fills PRJ-00009 with full linked data: specs, estimates, KS-2/KS-3,
--    cost codes, commitments, invoice lines, documents
-- 3) Normalizes links: payments -> contracts, invoices -> KS docs
-- 4) Recomputes contract-level financial totals
--
-- Usage:
--   docker exec -i privod_next_postgres psql -U privod -d privod2 < scripts/seed_prj00009_full_demo.sql
-- ============================================================================

BEGIN;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS organization_id UUID;
CREATE INDEX IF NOT EXISTS idx_document_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_document_org_project ON documents(organization_id, project_id);

DO $$
DECLARE
    v_project UUID;
    v_org UUID;
    v_admin UUID;
    v_admin_name TEXT;

    v_contract_general UUID;
    v_contract_sub UUID;
    v_contract_supply UUID;

    v_budget UUID;

    v_cc_01 UUID;
    v_cc_02 UUID;
    v_cc_03 UUID;

    v_ks2_1 UUID;
    v_ks2_2 UUID;
    v_ks2_3 UUID;
    v_ks2_4 UUID;

    v_ks3_1 UUID;
    v_ks3_2 UUID;
    v_ks3_3 UUID;
    v_ks3_4 UUID;
    v_ks3_5 UUID;

    -- deterministic IDs for idempotent upserts
    v_spec_1 CONSTANT UUID := '7a1a6c5b-180f-4d23-a679-93b4d2c10901';
    v_spec_2 CONSTANT UUID := '7a1a6c5b-180f-4d23-a679-93b4d2c10902';

    v_spec_item_11 CONSTANT UUID := '8b1a6c5b-180f-4d23-a679-93b4d2c10911';
    v_spec_item_12 CONSTANT UUID := '8b1a6c5b-180f-4d23-a679-93b4d2c10912';
    v_spec_item_13 CONSTANT UUID := '8b1a6c5b-180f-4d23-a679-93b4d2c10913';
    v_spec_item_14 CONSTANT UUID := '8b1a6c5b-180f-4d23-a679-93b4d2c10914';
    v_spec_item_21 CONSTANT UUID := '8b1a6c5b-180f-4d23-a679-93b4d2c10921';
    v_spec_item_22 CONSTANT UUID := '8b1a6c5b-180f-4d23-a679-93b4d2c10922';
    v_spec_item_23 CONSTANT UUID := '8b1a6c5b-180f-4d23-a679-93b4d2c10923';

    v_est_1 CONSTANT UUID := '9c1a6c5b-180f-4d23-a679-93b4d2c10931';
    v_est_2 CONSTANT UUID := '9c1a6c5b-180f-4d23-a679-93b4d2c10932';

    v_est_item_41 CONSTANT UUID := 'aa1a6c5b-180f-4d23-a679-93b4d2c10941';
    v_est_item_42 CONSTANT UUID := 'aa1a6c5b-180f-4d23-a679-93b4d2c10942';
    v_est_item_43 CONSTANT UUID := 'aa1a6c5b-180f-4d23-a679-93b4d2c10943';
    v_est_item_44 CONSTANT UUID := 'aa1a6c5b-180f-4d23-a679-93b4d2c10944';
    v_est_item_51 CONSTANT UUID := 'aa1a6c5b-180f-4d23-a679-93b4d2c10951';
    v_est_item_52 CONSTANT UUID := 'aa1a6c5b-180f-4d23-a679-93b4d2c10952';
    v_est_item_53 CONSTANT UUID := 'aa1a6c5b-180f-4d23-a679-93b4d2c10953';

    v_commitment_1 CONSTANT UUID := 'ad1a6c5b-180f-4d23-a679-93b4d2c10951';
    v_commitment_2 CONSTANT UUID := 'ad1a6c5b-180f-4d23-a679-93b4d2c10952';
    v_commitment_3 CONSTANT UUID := 'ad1a6c5b-180f-4d23-a679-93b4d2c10953';

    v_doc_1 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10971';
    v_doc_2 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10972';
    v_doc_3 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10973';
    v_doc_4 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10974';
    v_doc_5 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10975';
    v_doc_6 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10976';
    v_doc_7 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10977';
    v_doc_8 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10978';
    v_doc_9 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10979';
    v_doc_10 CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10980';

    v_co_1 CONSTANT UUID := 'cf1a6c5b-180f-4d23-a679-93b4d2c10981';
    v_co_2 CONSTANT UUID := 'cf1a6c5b-180f-4d23-a679-93b4d2c10982';
    v_co_3 CONSTANT UUID := 'cf1a6c5b-180f-4d23-a679-93b4d2c10983';

    v_coi_11 CONSTANT UUID := 'd01a6c5b-180f-4d23-a679-93b4d2c10984';
    v_coi_12 CONSTANT UUID := 'd01a6c5b-180f-4d23-a679-93b4d2c10985';
    v_coi_21 CONSTANT UUID := 'd01a6c5b-180f-4d23-a679-93b4d2c10986';
    v_coi_22 CONSTANT UUID := 'd01a6c5b-180f-4d23-a679-93b4d2c10987';
    v_coi_31 CONSTANT UUID := 'd01a6c5b-180f-4d23-a679-93b4d2c10988';
    v_coi_32 CONSTANT UUID := 'd01a6c5b-180f-4d23-a679-93b4d2c10989';
BEGIN
    SELECT id, organization_id
    INTO v_project, v_org
    FROM projects
    WHERE code = 'PRJ-00009' AND deleted = FALSE
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_project IS NULL THEN
        RAISE EXCEPTION 'Project PRJ-00009 not found';
    END IF;

    SELECT id, CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
    INTO v_admin, v_admin_name
    FROM users
    WHERE organization_id = v_org AND email = 'admin@privod.ru' AND deleted = FALSE
    LIMIT 1;

    IF v_admin IS NULL THEN
        SELECT id, COALESCE(full_name, email)
        INTO v_admin, v_admin_name
        FROM users
        WHERE organization_id = v_org AND deleted = FALSE
        ORDER BY created_at
        LIMIT 1;
    END IF;

    SELECT c.id INTO v_contract_general
    FROM contracts c
    JOIN contract_types ct ON ct.id = c.type_id
    WHERE c.project_id = v_project AND c.deleted = FALSE AND ct.code = 'GENERAL'
    ORDER BY c.created_at
    LIMIT 1;

    SELECT c.id INTO v_contract_sub
    FROM contracts c
    JOIN contract_types ct ON ct.id = c.type_id
    WHERE c.project_id = v_project AND c.deleted = FALSE AND ct.code = 'SUBCONTRACT'
    ORDER BY c.created_at
    LIMIT 1;

    SELECT c.id INTO v_contract_supply
    FROM contracts c
    JOIN contract_types ct ON ct.id = c.type_id
    WHERE c.project_id = v_project AND c.deleted = FALSE AND ct.code = 'SUPPLY'
    ORDER BY c.created_at
    LIMIT 1;

    IF v_contract_general IS NULL OR v_contract_sub IS NULL OR v_contract_supply IS NULL THEN
        RAISE EXCEPTION 'Required contracts (GENERAL/SUBCONTRACT/SUPPLY) are missing for PRJ-00009';
    END IF;

    -- ---------------------------------------------------------------------
    -- Normalize base project + contract amounts for coherent financial analytics
    -- ---------------------------------------------------------------------
    UPDATE projects
    SET contract_amount = 920000000.00,
        budget_amount = 750000000.00,
        updated_by = 'seed-prj00009'
    WHERE id = v_project;

    UPDATE contracts
    SET amount = 920000000.00,
        updated_by = 'seed-prj00009'
    WHERE id = v_contract_general;

    UPDATE contracts
    SET amount = 120000000.00,
        updated_by = 'seed-prj00009'
    WHERE id = v_contract_sub;

    UPDATE contracts
    SET amount = 420000000.00,
        updated_by = 'seed-prj00009'
    WHERE id = v_contract_supply;

    -- ---------------------------------------------------------------------
    -- Fix document tenant column values (needed for DocumentService filters)
    -- ---------------------------------------------------------------------
    UPDATE documents d
    SET organization_id = COALESCE(
        (SELECT c.organization_id FROM contracts c WHERE c.id = d.contract_id LIMIT 1),
        (SELECT p.organization_id FROM projects p WHERE p.id = d.project_id LIMIT 1),
        v_org
    )
    WHERE d.organization_id IS NULL;

    -- ---------------------------------------------------------------------
    -- Normalize invoice/payment links and statuses
    -- ---------------------------------------------------------------------
    UPDATE invoices
    SET status = 'SENT', updated_by = 'seed-prj00009'
    WHERE project_id = v_project
      AND invoice_type = 'RECEIVED'
      AND status = 'DRAFT'
      AND deleted = FALSE;

    UPDATE payments p
    SET contract_id = i.contract_id,
        updated_by = 'seed-prj00009'
    FROM invoices i
    WHERE p.project_id = v_project
      AND p.invoice_id = i.id
      AND i.contract_id IS NOT NULL
      AND p.deleted = FALSE
      AND (p.contract_id IS DISTINCT FROM i.contract_id);

    UPDATE payments p
    SET invoice_id = (
            SELECT id
            FROM invoices
            WHERE project_id = v_project AND number = 'INV-00046' AND deleted = FALSE
            LIMIT 1
        ),
        contract_id = v_contract_supply,
        updated_by = 'seed-prj00009'
    WHERE p.project_id = v_project
      AND p.number = 'PAY-00004'
      AND p.payment_type = 'OUTGOING'
      AND p.deleted = FALSE;

    -- ---------------------------------------------------------------------
    -- Cost codes + commitments (for planned budget / committed cost)
    -- ---------------------------------------------------------------------
    INSERT INTO cost_codes (
        id, project_id, code, name, description, level, budget_amount,
        is_active, deleted, created_at, created_by, updated_by
    ) VALUES
        (uuid_generate_v4(), v_project, '01', 'Подготовка площадки', 'Земляные и подготовительные работы', 'LEVEL1',  95000000.00, TRUE, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_project, '02', 'Монолитные работы', 'Фундамент, каркас, бетон',            'LEVEL1', 320000000.00, TRUE, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_project, '03', 'Инженерные системы', 'ОВ, ВК, ЭОМ, СС',                     'LEVEL1', 145000000.00, TRUE, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_project, '04', 'Отделка и фасад',    'Фасадные и отделочные работы',         'LEVEL1', 130000000.00, TRUE, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_project, '05', 'Накладные расходы',  'Общеплощадочные и административные',   'LEVEL1',  60000000.00, TRUE, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009')
    ON CONFLICT (project_id, code)
    DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        level = EXCLUDED.level,
        budget_amount = EXCLUDED.budget_amount,
        is_active = TRUE,
        deleted = FALSE,
        updated_by = EXCLUDED.updated_by;

    SELECT id INTO v_cc_01 FROM cost_codes WHERE project_id = v_project AND code = '01' AND deleted = FALSE LIMIT 1;
    SELECT id INTO v_cc_02 FROM cost_codes WHERE project_id = v_project AND code = '02' AND deleted = FALSE LIMIT 1;
    SELECT id INTO v_cc_03 FROM cost_codes WHERE project_id = v_project AND code = '03' AND deleted = FALSE LIMIT 1;

    INSERT INTO commitments (
        id, project_id, number, title, commitment_type, status,
        vendor_id, contract_id, original_amount, revised_amount, approved_change_orders,
        invoiced_amount, paid_amount, retention_percent,
        start_date, end_date, cost_code_id,
        deleted, created_at, created_by, updated_by
    ) VALUES
        (v_commitment_1, v_project, 'CMT-PRJ00009-001', 'Субподряд: фундамент и каркас',
            'SUBCONTRACT', 'APPROVED', NULL, v_contract_sub,
            100000000.00, 112000000.00, 12000000.00,
             68000000.00,  52000000.00, 5.00,
            DATE '2024-03-10', DATE '2024-10-30', v_cc_02,
            FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (v_commitment_2, v_project, 'CMT-PRJ00009-002', 'Поставка: арматура и бетон',
            'PURCHASE_ORDER', 'APPROVED', NULL, v_contract_supply,
             72000000.00,  78000000.00,  6000000.00,
             55000000.00,  38000000.00, 0.00,
            DATE '2024-03-15', DATE '2024-12-31', v_cc_02,
            FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (v_commitment_3, v_project, 'CMT-PRJ00009-003', 'Профуслуги: авторский и технадзор',
            'PROFESSIONAL_SERVICE', 'ISSUED', NULL, NULL,
             24000000.00,  27000000.00,  3000000.00,
             12000000.00,   8000000.00, 0.00,
            DATE '2024-04-01', DATE '2025-06-30', v_cc_03,
            FALSE, NOW(), 'seed-prj00009', 'seed-prj00009')
    ON CONFLICT (project_id, number)
    DO UPDATE SET
        title = EXCLUDED.title,
        commitment_type = EXCLUDED.commitment_type,
        status = EXCLUDED.status,
        contract_id = EXCLUDED.contract_id,
        original_amount = EXCLUDED.original_amount,
        revised_amount = EXCLUDED.revised_amount,
        approved_change_orders = EXCLUDED.approved_change_orders,
        invoiced_amount = EXCLUDED.invoiced_amount,
        paid_amount = EXCLUDED.paid_amount,
        retention_percent = EXCLUDED.retention_percent,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        cost_code_id = EXCLUDED.cost_code_id,
        deleted = FALSE,
        updated_by = EXCLUDED.updated_by;

    -- ---------------------------------------------------------------------
    -- Specifications + estimate structure
    -- ---------------------------------------------------------------------
    INSERT INTO specifications (
        id, name, project_id, contract_id,
        doc_version, is_current, status,
        notes, deleted, created_at, created_by, updated_by
    ) VALUES
        (v_spec_1, 'SPEC-PRJ00009-MONO-A', v_project, v_contract_general,
            1, TRUE, 'ACTIVE',
            'Монолитные работы, корпус А', FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_spec_2, 'SPEC-PRJ00009-ENG-A', v_project, v_contract_general,
            1, TRUE, 'APPROVED',
            'Инженерные системы, корпус А', FALSE, NOW(), 'seed-prj00009', 'seed-prj00009')
    ON CONFLICT (name)
    DO UPDATE SET
        project_id = EXCLUDED.project_id,
        contract_id = EXCLUDED.contract_id,
        is_current = TRUE,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        deleted = FALSE,
        updated_by = EXCLUDED.updated_by;

    INSERT INTO spec_items (
        id, specification_id, sequence, item_type, name,
        quantity, unit_of_measure, planned_amount,
        procurement_status, estimate_status, is_customer_provided,
        notes, deleted, created_at, created_by, updated_by
    ) VALUES
        (v_spec_item_11, v_spec_1, 10, 'WORK',      'Монолитный каркас', 1.000, 'компл', 240000000.00, 'approved', 'approved', FALSE, NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_spec_item_12, v_spec_1, 20, 'MATERIAL',  'Арматура A500C', 1800.000, 'т',    180000000.00, 'approved', 'approved', FALSE, NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_spec_item_13, v_spec_1, 30, 'MATERIAL',  'Бетон B30',      42000.000, 'м3',   150000000.00, 'approved', 'approved', FALSE, NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_spec_item_14, v_spec_1, 40, 'EQUIPMENT', 'Опалубка',           1.000, 'компл',  30000000.00, 'approved', 'approved', FALSE, NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (v_spec_item_21, v_spec_2, 10, 'WORK',      'Электромонтаж',      1.000, 'компл',  65000000.00, 'approved', 'approved', FALSE, NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_spec_item_22, v_spec_2, 20, 'WORK',      'Слаботочные системы',1.000, 'компл',  35000000.00, 'approved', 'approved', FALSE, NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_spec_item_23, v_spec_2, 30, 'WORK',      'Сети ВК/ОВ',         1.000, 'компл',  40000000.00, 'approved', 'approved', FALSE, NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009')
    ON CONFLICT (id)
    DO UPDATE SET
        specification_id = EXCLUDED.specification_id,
        sequence = EXCLUDED.sequence,
        item_type = EXCLUDED.item_type,
        name = EXCLUDED.name,
        quantity = EXCLUDED.quantity,
        unit_of_measure = EXCLUDED.unit_of_measure,
        planned_amount = EXCLUDED.planned_amount,
        procurement_status = EXCLUDED.procurement_status,
        estimate_status = EXCLUDED.estimate_status,
        is_customer_provided = EXCLUDED.is_customer_provided,
        deleted = FALSE,
        updated_by = EXCLUDED.updated_by;

    INSERT INTO estimates (
        id, name, project_id, contract_id, specification_id,
        status, total_amount, ordered_amount, invoiced_amount, total_spent,
        notes, deleted, created_at, created_by, updated_by
    ) VALUES
        (v_est_1, 'Смета монолитных работ (корпус А)', v_project, v_contract_general, v_spec_1,
            'ACTIVE',   590000000.00, 250000000.00, 140000000.00, 120000000.00,
            'Базовая рабочая смета', FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_est_2, 'Смета инженерных систем (корпус А)', v_project, v_contract_general, v_spec_2,
            'APPROVED', 145000000.00,  40000000.00,  22000000.00,  18000000.00,
            'Свод по инженерным разделам', FALSE, NOW(), 'seed-prj00009', 'seed-prj00009')
    ON CONFLICT (id)
    DO UPDATE SET
        name = EXCLUDED.name,
        project_id = EXCLUDED.project_id,
        contract_id = EXCLUDED.contract_id,
        specification_id = EXCLUDED.specification_id,
        status = EXCLUDED.status,
        total_amount = EXCLUDED.total_amount,
        ordered_amount = EXCLUDED.ordered_amount,
        invoiced_amount = EXCLUDED.invoiced_amount,
        total_spent = EXCLUDED.total_spent,
        notes = EXCLUDED.notes,
        deleted = FALSE,
        updated_by = EXCLUDED.updated_by;

    INSERT INTO estimate_items (
        id, estimate_id, project_id, spec_item_id, sequence, name,
        quantity, unit_of_measure, unit_price, amount,
        ordered_amount, invoiced_amount, delivered_amount,
        deleted, created_at, created_by, updated_by
    ) VALUES
        (v_est_item_41, v_est_1, v_project, v_spec_item_11, 10, 'Монолитный каркас', 1.000, 'компл', 220000000.00, 220000000.00,  80000000.00, 45000000.00, 40000000.00, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_est_item_42, v_est_1, v_project, v_spec_item_12, 20, 'Арматура A500C', 1800.000, 'т',      90000.00,    162000000.00, 100000000.00, 60000000.00, 55000000.00, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_est_item_43, v_est_1, v_project, v_spec_item_13, 30, 'Бетон B30',      42000.000, 'м3',      3000.00,    126000000.00,  55000000.00, 25000000.00, 23000000.00, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_est_item_44, v_est_1, v_project, v_spec_item_14, 40, 'Опалубка',           1.000, 'компл', 82000000.00,  82000000.00,  15000000.00, 10000000.00,  8000000.00, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (v_est_item_51, v_est_2, v_project, v_spec_item_21, 10, 'Электромонтаж',      1.000, 'компл', 70000000.00,  70000000.00,  20000000.00, 12000000.00, 10000000.00, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_est_item_52, v_est_2, v_project, v_spec_item_22, 20, 'Слаботочные системы',1.000, 'компл', 35000000.00,  35000000.00,  10000000.00,  5000000.00,  4000000.00, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_est_item_53, v_est_2, v_project, v_spec_item_23, 30, 'Сети ВК/ОВ',         1.000, 'компл', 40000000.00,  40000000.00,  10000000.00,  5000000.00,  4000000.00, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009')
    ON CONFLICT (id)
    DO UPDATE SET
        estimate_id = EXCLUDED.estimate_id,
        project_id = EXCLUDED.project_id,
        spec_item_id = EXCLUDED.spec_item_id,
        sequence = EXCLUDED.sequence,
        name = EXCLUDED.name,
        quantity = EXCLUDED.quantity,
        unit_of_measure = EXCLUDED.unit_of_measure,
        unit_price = EXCLUDED.unit_price,
        amount = EXCLUDED.amount,
        ordered_amount = EXCLUDED.ordered_amount,
        invoiced_amount = EXCLUDED.invoiced_amount,
        delivered_amount = EXCLUDED.delivered_amount,
        deleted = FALSE,
        updated_by = EXCLUDED.updated_by;

    -- ---------------------------------------------------------------------
    -- KS-2/KS-3 lines and links
    -- ---------------------------------------------------------------------
    SELECT id INTO v_ks2_1 FROM ks2_documents WHERE project_id = v_project AND number = 'КС-2-001'  AND deleted = FALSE LIMIT 1;
    SELECT id INTO v_ks2_2 FROM ks2_documents WHERE project_id = v_project AND number = 'KS2-002'   AND deleted = FALSE LIMIT 1;
    SELECT id INTO v_ks2_3 FROM ks2_documents WHERE project_id = v_project AND number = 'KS2-003'   AND deleted = FALSE LIMIT 1;
    SELECT id INTO v_ks2_4 FROM ks2_documents WHERE project_id = v_project AND number = 'KS2-004'   AND deleted = FALSE LIMIT 1;

    SELECT id INTO v_ks3_1 FROM ks3_documents WHERE project_id = v_project AND number = 'KS3-001'    AND deleted = FALSE LIMIT 1;
    SELECT id INTO v_ks3_2 FROM ks3_documents WHERE project_id = v_project AND number = 'KS3-JK-001' AND deleted = FALSE LIMIT 1;
    SELECT id INTO v_ks3_3 FROM ks3_documents WHERE project_id = v_project AND number = 'KS3-JK-002' AND deleted = FALSE LIMIT 1;
    SELECT id INTO v_ks3_4 FROM ks3_documents WHERE project_id = v_project AND number = 'KS3-JK-003' AND deleted = FALSE LIMIT 1;
    SELECT id INTO v_ks3_5 FROM ks3_documents WHERE project_id = v_project AND number = 'KS3-JK-004' AND deleted = FALSE LIMIT 1;

    IF v_ks2_1 IS NULL OR v_ks2_2 IS NULL OR v_ks2_3 IS NULL OR v_ks2_4 IS NULL
       OR v_ks3_1 IS NULL OR v_ks3_2 IS NULL OR v_ks3_3 IS NULL OR v_ks3_4 IS NULL OR v_ks3_5 IS NULL THEN
        RAISE EXCEPTION 'KS2/KS3 base documents are missing for PRJ-00009';
    END IF;

    DELETE FROM ks2_lines
    WHERE ks2_id IN (v_ks2_1, v_ks2_2, v_ks2_3, v_ks2_4);

    INSERT INTO ks2_lines (
        id, ks2_id, sequence, spec_item_id, name,
        quantity, unit_price, amount, unit_of_measure,
        notes, deleted, created_at, created_by, updated_by
    ) VALUES
        (uuid_generate_v4(), v_ks2_1, 10, v_spec_item_11, 'Монолитный каркас (этап 1)', 1.000, 40000000.00, 40000000.00, 'компл', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_ks2_1, 20, v_spec_item_12, 'Арматура A500C (этап 1)',    1.000, 56000000.00, 56000000.00, 'компл', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (uuid_generate_v4(), v_ks2_2, 10, v_spec_item_11, 'Монолитный каркас (этап 2)', 1.000, 38000000.00, 38000000.00, 'компл', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_ks2_2, 20, v_spec_item_13, 'Бетон B30 (этап 2)',          1.000, 58000000.00, 58000000.00, 'компл', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (uuid_generate_v4(), v_ks2_3, 10, v_spec_item_12, 'Арматура A500C (этап 3)',    1.000, 35000000.00, 35000000.00, 'компл', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_ks2_3, 20, v_spec_item_13, 'Бетон B30 (этап 3)',          1.000, 61000000.00, 61000000.00, 'компл', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (uuid_generate_v4(), v_ks2_4, 10, v_spec_item_21, 'Электромонтаж (этап 1)',      1.000, 30000000.00, 30000000.00, 'компл', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_ks2_4, 20, v_spec_item_22, 'Слаботочные системы (этап 1)',1.000, 66000000.00, 66000000.00, 'компл', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009');

    UPDATE ks2_documents
    SET status = 'SIGNED',
        total_amount = 96000000.00,
        total_quantity = 2.000,
        notes = 'Заполнено для демонстрационного проекта PRJ-00009',
        updated_by = 'seed-prj00009'
    WHERE id IN (v_ks2_1, v_ks2_2, v_ks2_3, v_ks2_4);

    DELETE FROM ks3_ks2_links
    WHERE ks3_id IN (v_ks3_1, v_ks3_2, v_ks3_3, v_ks3_4, v_ks3_5)
      AND deleted = FALSE;

    INSERT INTO ks3_ks2_links (id, ks3_id, ks2_id, deleted, created_at, created_by, updated_by)
    VALUES
        (uuid_generate_v4(), v_ks3_1, v_ks2_1, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_ks3_2, v_ks2_2, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_ks3_3, v_ks2_3, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_ks3_4, v_ks2_4, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (uuid_generate_v4(), v_ks3_5, v_ks2_4, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009')
    ON CONFLICT (ks3_id, ks2_id)
    DO UPDATE SET
        deleted = FALSE,
        updated_by = EXCLUDED.updated_by;

    UPDATE ks3_documents
    SET status = 'SIGNED',
        total_amount = 96000000.00,
        retention_percent = 5.00,
        retention_amount = 4800000.00,
        net_amount = 91200000.00,
        notes = 'Заполнено для демонстрационного проекта PRJ-00009',
        updated_by = 'seed-prj00009'
    WHERE id IN (v_ks3_1, v_ks3_2, v_ks3_3, v_ks3_4);

    UPDATE ks3_documents
    SET status = 'DRAFT',
        total_amount = 96000000.00,
        retention_amount = 0,
        net_amount = 96000000.00,
        updated_by = 'seed-prj00009'
    WHERE id = v_ks3_5;

    -- link issued invoices with closing docs
    UPDATE invoices SET ks2_id = v_ks2_1, ks3_id = v_ks3_1, updated_by = 'seed-prj00009'
    WHERE project_id = v_project AND number = 'INV-00038' AND deleted = FALSE;

    UPDATE invoices SET ks2_id = v_ks2_2, ks3_id = v_ks3_2, updated_by = 'seed-prj00009'
    WHERE project_id = v_project AND number = 'INV-00039' AND deleted = FALSE;

    UPDATE invoices SET ks2_id = v_ks2_3, ks3_id = v_ks3_3, updated_by = 'seed-prj00009'
    WHERE project_id = v_project AND number = 'INV-00040' AND deleted = FALSE;

    UPDATE invoices SET ks2_id = v_ks2_4, ks3_id = v_ks3_4, updated_by = 'seed-prj00009'
    WHERE project_id = v_project AND number = 'INV-00041' AND deleted = FALSE;

    UPDATE invoices SET ks2_id = v_ks2_4, ks3_id = v_ks3_5, updated_by = 'seed-prj00009'
    WHERE project_id = v_project AND number = 'INV-00037' AND deleted = FALSE;

    -- ---------------------------------------------------------------------
    -- Invoice lines (for drill-down transparency)
    -- ---------------------------------------------------------------------
    DELETE FROM invoice_lines
    WHERE invoice_id IN (
        SELECT id FROM invoices WHERE project_id = v_project AND deleted = FALSE
    );

    INSERT INTO invoice_lines (
        id, invoice_id, sequence, name, quantity,
        unit_price, amount, unit_of_measure,
        deleted, created_at, created_by, updated_by
    )
    SELECT
        uuid_generate_v4(),
        i.id,
        1,
        CASE WHEN i.invoice_type = 'ISSUED'
             THEN 'Выполненные работы по этапу КС'
             ELSE 'Поставка/работы контрагента'
        END,
        1.000,
        i.total_amount,
        i.total_amount,
        'усл.ед',
        FALSE,
        NOW(),
        'seed-prj00009',
        'seed-prj00009'
    FROM invoices i
    WHERE i.project_id = v_project
      AND i.deleted = FALSE;

    -- ---------------------------------------------------------------------
    -- Contract and budget rollups for visible card metrics
    -- ---------------------------------------------------------------------
    UPDATE contracts c
    SET total_invoiced = COALESCE((
            SELECT SUM(i.total_amount)
            FROM invoices i
            WHERE i.contract_id = c.id
              AND i.deleted = FALSE
              AND i.status NOT IN ('DRAFT', 'CANCELLED')
        ), 0),
        total_paid = COALESCE((
            SELECT SUM(p.total_amount)
            FROM payments p
            WHERE p.contract_id = c.id
              AND p.deleted = FALSE
              AND p.status = 'PAID'
        ), 0),
        updated_by = 'seed-prj00009'
    WHERE c.project_id = v_project
      AND c.deleted = FALSE;

    SELECT id INTO v_budget
    FROM budgets
    WHERE project_id = v_project AND deleted = FALSE
    ORDER BY created_at
    LIMIT 1;

    IF v_budget IS NULL THEN
        INSERT INTO budgets (
            id, name, project_id, contract_id, status,
            planned_revenue, planned_cost, planned_margin,
            actual_revenue, actual_cost, actual_margin,
            doc_version, notes, deleted, created_at, created_by, updated_by
        ) VALUES (
            uuid_generate_v4(),
            'Сводный бюджет ЖК Солнечный корпус А',
            v_project,
            v_contract_general,
            'ACTIVE',
            920000000.00, 750000000.00, 170000000.00,
            364800000.00, 162000000.00, 202800000.00,
            1,
            'Автозаполнение для демонстрации сквозной аналитики',
            FALSE,
            NOW(),
            'seed-prj00009',
            'seed-prj00009'
        );
    ELSE
        UPDATE budgets
        SET status = 'ACTIVE',
            planned_revenue = 920000000.00,
            planned_cost = 750000000.00,
            planned_margin = 170000000.00,
            actual_revenue = COALESCE((
                SELECT SUM(total_amount)
                FROM payments
                WHERE project_id = v_project AND payment_type = 'INCOMING' AND status = 'PAID' AND deleted = FALSE
            ), 0),
            actual_cost = COALESCE((
                SELECT SUM(total_amount)
                FROM payments
                WHERE project_id = v_project AND payment_type = 'OUTGOING' AND status = 'PAID' AND deleted = FALSE
            ), 0),
            actual_margin = COALESCE((
                SELECT SUM(CASE WHEN payment_type = 'INCOMING' THEN total_amount ELSE -total_amount END)
                FROM payments
                WHERE project_id = v_project AND status = 'PAID' AND deleted = FALSE
            ), 0),
            notes = 'Обновлено скриптом seed_prj00009_full_demo',
            updated_by = 'seed-prj00009'
        WHERE id = v_budget;
    END IF;

    -- ---------------------------------------------------------------------
    -- Change orders (допсоглашения) для полной финансовой связности объекта
    -- ---------------------------------------------------------------------
    UPDATE change_orders
    SET contract_id = v_contract_general,
        title = 'Допсоглашение к генподряду: допобъёмы благоустройства',
        description = 'Дополнительные объёмы работ по благоустройству и входным группам.',
        change_order_type = 'ADDITION',
        status = 'APPROVED',
        total_amount = 28000000.00,
        schedule_impact_days = 12,
        original_contract_amount = 920000000.00,
        revised_contract_amount = 948000000.00,
        approved_date = '2024-06-20'::DATE,
        updated_by = 'seed-prj00009'
    WHERE project_id = v_project
      AND number = 'CO-PRJ00009-001'
      AND deleted = FALSE;

    IF NOT FOUND THEN
        INSERT INTO change_orders (
            id, project_id, contract_id, number, title, description,
            change_order_type, status, total_amount, schedule_impact_days,
            original_contract_amount, revised_contract_amount,
            approved_date, created_at, deleted, created_by, updated_by
        ) VALUES (
            v_co_1, v_project, v_contract_general, 'CO-PRJ00009-001',
            'Допсоглашение к генподряду: допобъёмы благоустройства',
            'Дополнительные объёмы работ по благоустройству и входным группам.',
            'ADDITION', 'APPROVED', 28000000.00, 12,
            920000000.00, 948000000.00,
            '2024-06-20'::DATE, NOW(), FALSE, 'seed-prj00009', 'seed-prj00009'
        );
    END IF;

    UPDATE change_orders
    SET contract_id = v_contract_sub,
        title = 'Допсоглашение к субподряду: усиление монолита',
        description = 'Дополнительное армирование и усиление отдельных узлов.',
        change_order_type = 'ADDITION',
        status = 'EXECUTED',
        total_amount = 7400000.00,
        schedule_impact_days = 8,
        original_contract_amount = 120000000.00,
        revised_contract_amount = 127400000.00,
        approved_date = '2024-05-28'::DATE,
        executed_date = '2024-06-12'::DATE,
        updated_by = 'seed-prj00009'
    WHERE project_id = v_project
      AND number = 'CO-PRJ00009-002'
      AND deleted = FALSE;

    IF NOT FOUND THEN
        INSERT INTO change_orders (
            id, project_id, contract_id, number, title, description,
            change_order_type, status, total_amount, schedule_impact_days,
            original_contract_amount, revised_contract_amount,
            approved_date, executed_date, created_at, deleted, created_by, updated_by
        ) VALUES (
            v_co_2, v_project, v_contract_sub, 'CO-PRJ00009-002',
            'Допсоглашение к субподряду: усиление монолита',
            'Дополнительное армирование и усиление отдельных узлов.',
            'ADDITION', 'EXECUTED', 7400000.00, 8,
            120000000.00, 127400000.00,
            '2024-05-28'::DATE, '2024-06-12'::DATE, NOW(), FALSE, 'seed-prj00009', 'seed-prj00009'
        );
    END IF;

    UPDATE change_orders
    SET contract_id = v_contract_supply,
        title = 'Допсоглашение к поставке: индексация стоимости материалов',
        description = 'Пересмотр цен поставки вследствие индексации и логистики.',
        change_order_type = 'ADDITION',
        status = 'APPROVED',
        total_amount = 3100000.00,
        schedule_impact_days = 0,
        original_contract_amount = 420000000.00,
        revised_contract_amount = 423100000.00,
        approved_date = '2024-06-05'::DATE,
        updated_by = 'seed-prj00009'
    WHERE project_id = v_project
      AND number = 'CO-PRJ00009-003'
      AND deleted = FALSE;

    IF NOT FOUND THEN
        INSERT INTO change_orders (
            id, project_id, contract_id, number, title, description,
            change_order_type, status, total_amount, schedule_impact_days,
            original_contract_amount, revised_contract_amount,
            approved_date, created_at, deleted, created_by, updated_by
        ) VALUES (
            v_co_3, v_project, v_contract_supply, 'CO-PRJ00009-003',
            'Допсоглашение к поставке: индексация стоимости материалов',
            'Пересмотр цен поставки вследствие индексации и логистики.',
            'ADDITION', 'APPROVED', 3100000.00, 0,
            420000000.00, 423100000.00,
            '2024-06-05'::DATE, NOW(), FALSE, 'seed-prj00009', 'seed-prj00009'
        );
    END IF;

    INSERT INTO change_order_items (
        id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order,
        created_at, deleted, created_by, updated_by
    ) VALUES
        (v_coi_11, v_co_1, 'Допблагоустройство территории', 1.0000, 'компл', 18000000.00, 18000000.00, 1, NOW(), FALSE, 'seed-prj00009', 'seed-prj00009'),
        (v_coi_12, v_co_1, 'Доработка входных групп',       1.0000, 'компл', 10000000.00, 10000000.00, 2, NOW(), FALSE, 'seed-prj00009', 'seed-prj00009'),

        (v_coi_21, v_co_2, 'Усиление армирования узлов',    1.0000, 'компл', 4200000.00,  4200000.00,  1, NOW(), FALSE, 'seed-prj00009', 'seed-prj00009'),
        (v_coi_22, v_co_2, 'Допработы по бетонированию',    1.0000, 'компл', 3200000.00,  3200000.00,  2, NOW(), FALSE, 'seed-prj00009', 'seed-prj00009'),

        (v_coi_31, v_co_3, 'Индексация стоимости материалов', 1.0000, 'компл', 2400000.00, 2400000.00, 1, NOW(), FALSE, 'seed-prj00009', 'seed-prj00009'),
        (v_coi_32, v_co_3, 'Индексация логистики',            1.0000, 'компл',  700000.00,  700000.00, 2, NOW(), FALSE, 'seed-prj00009', 'seed-prj00009')
    ON CONFLICT (id)
    DO UPDATE SET
        change_order_id = EXCLUDED.change_order_id,
        description = EXCLUDED.description,
        quantity = EXCLUDED.quantity,
        unit = EXCLUDED.unit,
        unit_price = EXCLUDED.unit_price,
        total_price = EXCLUDED.total_price,
        sort_order = EXCLUDED.sort_order,
        updated_by = EXCLUDED.updated_by;

    -- ---------------------------------------------------------------------
    -- Documents register rows for project/contract drill-down
    -- ---------------------------------------------------------------------
    INSERT INTO documents (
        id, title, document_number, category, status,
        project_id, contract_id, organization_id,
        description, file_name, file_size, mime_type, storage_path,
        doc_version, author_id, author_name, tags,
        notes, deleted, created_at, created_by, updated_by
    ) VALUES
        (v_doc_1, 'Договор генподряда №ГП-2024-001', 'DEMO-PRJ00009-001', 'CONTRACT', 'ACTIVE', v_project, v_contract_general, v_org, 'Основной договор с заказчиком', 'contract-general.pdf', 248000, 'application/pdf', 'demo/prj00009/contract-general.pdf', 1, v_admin, v_admin_name, 'contract,general', 'Сквозная демонстрация', FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_doc_2, 'Договор субподряда фундамент',      'DEMO-PRJ00009-002', 'CONTRACT', 'ACTIVE', v_project, v_contract_sub,     v_org, 'Субподряд на монолитный каркас', 'contract-sub.pdf',     173000, 'application/pdf', 'demo/prj00009/contract-sub.pdf',     1, v_admin, v_admin_name, 'contract,subcontract', 'Сквозная демонстрация', FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_doc_3, 'Договор поставки арматуры',         'DEMO-PRJ00009-003', 'CONTRACT', 'ACTIVE', v_project, v_contract_supply,  v_org, 'Поставка арматуры и бетона',      'contract-supply.pdf',  158000, 'application/pdf', 'demo/prj00009/contract-supply.pdf',  1, v_admin, v_admin_name, 'contract,supply', 'Сквозная демонстрация', FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (v_doc_4, 'Спецификация монолитных работ',      'DEMO-PRJ00009-004', 'SPECIFICATION', 'APPROVED', v_project, v_contract_general, v_org, 'SPEC-PRJ00009-MONO-A', 'spec-mono.xlsx', 82000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'demo/prj00009/spec-mono.xlsx', 1, v_admin, v_admin_name, 'specification,mono', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_doc_5, 'Спецификация инженерных систем',     'DEMO-PRJ00009-005', 'SPECIFICATION', 'APPROVED', v_project, v_contract_general, v_org, 'SPEC-PRJ00009-ENG-A',  'spec-eng.xlsx',  76000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'demo/prj00009/spec-eng.xlsx',  1, v_admin, v_admin_name, 'specification,engineering', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (v_doc_6, 'Смета монолитных работ',             'DEMO-PRJ00009-006', 'ESTIMATE', 'ACTIVE', v_project, v_contract_general, v_org, 'Смета по монолиту', 'estimate-mono.xlsx', 94000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'demo/prj00009/estimate-mono.xlsx', 1, v_admin, v_admin_name, 'estimate,mono', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_doc_7, 'Смета инженерных систем',            'DEMO-PRJ00009-007', 'ESTIMATE', 'ACTIVE', v_project, v_contract_general, v_org, 'Смета по инженерке', 'estimate-eng.xlsx',  87000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'demo/prj00009/estimate-eng.xlsx',  1, v_admin, v_admin_name, 'estimate,engineering', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (v_doc_8, 'Реестр актов КС-2 (март-июнь 2024)', 'DEMO-PRJ00009-008', 'ACT', 'ACTIVE', v_project, v_contract_general, v_org, 'Свод по КС-2', 'ks2-register.pdf', 103000, 'application/pdf', 'demo/prj00009/ks2-register.pdf', 1, v_admin, v_admin_name, 'ks2,acts', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),
        (v_doc_9, 'Реестр справок КС-3 (март-июнь 2024)', 'DEMO-PRJ00009-009', 'ACT', 'ACTIVE', v_project, v_contract_general, v_org, 'Свод по КС-3', 'ks3-register.pdf', 99000, 'application/pdf', 'demo/prj00009/ks3-register.pdf', 1, v_admin, v_admin_name, 'ks3,acts', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'),

        (v_doc_10, 'Реестр счетов и оплат',             'DEMO-PRJ00009-010', 'INVOICE', 'ACTIVE', v_project, v_contract_general, v_org, 'Счета/платежи по проекту', 'finance-register.xlsx', 112000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'demo/prj00009/finance-register.xlsx', 1, v_admin, v_admin_name, 'invoice,payment,finance', NULL, FALSE, NOW(), 'seed-prj00009', 'seed-prj00009')
    ON CONFLICT (id)
    DO UPDATE SET
        title = EXCLUDED.title,
        document_number = EXCLUDED.document_number,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        project_id = EXCLUDED.project_id,
        contract_id = EXCLUDED.contract_id,
        organization_id = EXCLUDED.organization_id,
        description = EXCLUDED.description,
        file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        mime_type = EXCLUDED.mime_type,
        storage_path = EXCLUDED.storage_path,
        doc_version = EXCLUDED.doc_version,
        author_id = EXCLUDED.author_id,
        author_name = EXCLUDED.author_name,
        tags = EXCLUDED.tags,
        notes = EXCLUDED.notes,
        deleted = FALSE,
        updated_by = EXCLUDED.updated_by;

    RAISE NOTICE 'PRJ-00009 demo data seeded successfully (project_id=%)', v_project;
END $$;

-- -------------------------------------------------------------------------
-- Additional service package for full non-zero project finance breakdown
-- -------------------------------------------------------------------------
DO $$
DECLARE
    v_project UUID;
    v_org UUID;
    v_admin UUID;
    v_admin_name TEXT;
    v_partner_id UUID;
    v_partner_name TEXT;
    v_contract_type_service UUID;
    v_contract_service UUID;
    v_invoice_service UUID;
    v_doc_service_contract CONSTANT UUID := 'be1a6c5b-180f-4d23-a679-93b4d2c10991';
BEGIN
    SELECT id, organization_id
    INTO v_project, v_org
    FROM projects
    WHERE code = 'PRJ-00009' AND deleted = FALSE
    LIMIT 1;

    IF v_project IS NULL THEN
        RAISE EXCEPTION 'Project PRJ-00009 not found';
    END IF;

    SELECT id, CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))
    INTO v_admin, v_admin_name
    FROM users
    WHERE organization_id = v_org AND deleted = FALSE
    ORDER BY created_at
    LIMIT 1;

    SELECT id
    INTO v_contract_type_service
    FROM contract_types
    WHERE code = 'SERVICE'
    LIMIT 1;

    IF v_contract_type_service IS NULL THEN
        RAISE EXCEPTION 'Contract type SERVICE not found';
    END IF;

    SELECT partner_id, partner_name
    INTO v_partner_id, v_partner_name
    FROM contracts
    WHERE project_id = v_project AND deleted = FALSE
    ORDER BY created_at
    LIMIT 1;

    v_partner_name := COALESCE(v_partner_name, 'ООО ТехНадзор Сервис');

    SELECT id
    INTO v_contract_service
    FROM contracts
    WHERE project_id = v_project
      AND number = 'CTR-00013'
      AND deleted = FALSE
    LIMIT 1;

    IF v_contract_service IS NULL THEN
        v_contract_service := uuid_generate_v4();
        INSERT INTO contracts (
            id, name, number, contract_date, partner_id, partner_name,
            project_id, type_id, status,
            amount, vat_rate, vat_amount, total_with_vat,
            payment_terms, planned_start_date, planned_end_date,
            doc_version, organization_id, total_invoiced, total_paid,
            deleted, created_at, created_by, updated_by
        ) VALUES (
            v_contract_service,
            'Договор услуг технадзора и авторского сопровождения',
            'CTR-00013',
            DATE '2024-03-20',
            v_partner_id,
            v_partner_name,
            v_project,
            v_contract_type_service,
            'ACTIVE',
            54000000.00, 20.00, 10800000.00, 64800000.00,
            'Оплата поэтапно, 15 банковских дней',
            DATE '2024-03-25',
            DATE '2025-06-30',
            1,
            v_org,
            0,
            0,
            FALSE,
            NOW(),
            'seed-prj00009',
            'seed-prj00009'
        );
    ELSE
        UPDATE contracts
        SET name = 'Договор услуг технадзора и авторского сопровождения',
            contract_date = DATE '2024-03-20',
            partner_id = v_partner_id,
            partner_name = v_partner_name,
            type_id = v_contract_type_service,
            status = 'ACTIVE',
            amount = 54000000.00,
            vat_rate = 20.00,
            vat_amount = 10800000.00,
            total_with_vat = 64800000.00,
            payment_terms = 'Оплата поэтапно, 15 банковских дней',
            planned_start_date = DATE '2024-03-25',
            planned_end_date = DATE '2025-06-30',
            organization_id = v_org,
            deleted = FALSE,
            updated_by = 'seed-prj00009'
        WHERE id = v_contract_service;
    END IF;

    UPDATE commitments
    SET contract_id = v_contract_service,
        updated_by = 'seed-prj00009'
    WHERE project_id = v_project
      AND number = 'CMT-PRJ00009-003'
      AND deleted = FALSE;

    UPDATE invoices
    SET invoice_date = DATE '2024-07-15',
        due_date = DATE '2024-07-30',
        project_id = v_project,
        contract_id = v_contract_service,
        partner_id = v_partner_id,
        partner_name = v_partner_name,
        invoice_type = 'RECEIVED',
        status = 'PAID',
        subtotal = 15000000.00,
        vat_amount = 3000000.00,
        vat_rate = 20.00,
        total_amount = 18000000.00,
        paid_amount = 18000000.00,
        remaining_amount = 0.00,
        notes = 'Сервисный пакет: технадзор и авторское сопровождение',
        updated_by = 'seed-prj00009'
    WHERE project_id = v_project
      AND number = 'INV-00049'
      AND deleted = FALSE;

    IF NOT FOUND THEN
        INSERT INTO invoices (
            id, number, invoice_date, due_date,
            project_id, contract_id, partner_id, partner_name,
            invoice_type, status, subtotal, vat_amount, vat_rate,
            total_amount, paid_amount, remaining_amount, notes,
            deleted, created_at, created_by, updated_by
        ) VALUES (
            uuid_generate_v4(), 'INV-00049', DATE '2024-07-15', DATE '2024-07-30',
            v_project, v_contract_service, v_partner_id, v_partner_name,
            'RECEIVED', 'PAID', 15000000.00, 3000000.00, 20.00,
            18000000.00, 18000000.00, 0.00, 'Сервисный пакет: технадзор и авторское сопровождение',
            FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'
        );
    END IF;

    SELECT id
    INTO v_invoice_service
    FROM invoices
    WHERE project_id = v_project
      AND number = 'INV-00049'
      AND deleted = FALSE
    LIMIT 1;

    UPDATE payments
    SET payment_date = DATE '2024-07-25',
        project_id = v_project,
        contract_id = v_contract_service,
        invoice_id = v_invoice_service,
        partner_id = v_partner_id,
        partner_name = v_partner_name,
        payment_type = 'OUTGOING',
        status = 'PAID',
        amount = 15000000.00,
        vat_amount = 3000000.00,
        total_amount = 18000000.00,
        purpose = 'Оплата услуг технадзора и авторского сопровождения',
        notes = 'Сервисный пакет по договору CTR-00013',
        updated_by = 'seed-prj00009'
    WHERE project_id = v_project
      AND number = 'PAY-00012'
      AND deleted = FALSE;

    IF NOT FOUND THEN
        INSERT INTO payments (
            id, number, payment_date, project_id, contract_id, invoice_id,
            partner_id, partner_name, payment_type, status,
            amount, vat_amount, total_amount, purpose, notes,
            deleted, created_at, created_by, updated_by
        ) VALUES (
            uuid_generate_v4(), 'PAY-00012', DATE '2024-07-25', v_project, v_contract_service, v_invoice_service,
            v_partner_id, v_partner_name, 'OUTGOING', 'PAID',
            15000000.00, 3000000.00, 18000000.00, 'Оплата услуг технадзора и авторского сопровождения',
            'Сервисный пакет по договору CTR-00013',
            FALSE, NOW(), 'seed-prj00009', 'seed-prj00009'
        );
    END IF;

    INSERT INTO documents (
        id, title, document_number, category, status,
        project_id, contract_id, organization_id,
        description, file_name, file_size, mime_type, storage_path,
        doc_version, author_id, author_name, tags,
        notes, deleted, created_at, created_by, updated_by
    ) VALUES (
        v_doc_service_contract,
        'Договор сервисного сопровождения',
        'DEMO-PRJ00009-011',
        'CONTRACT',
        'ACTIVE',
        v_project,
        v_contract_service,
        v_org,
        'Технадзор, авторское сопровождение, инструментальный контроль',
        'contract-service.pdf',
        142000,
        'application/pdf',
        'demo/prj00009/contract-service.pdf',
        1,
        v_admin,
        v_admin_name,
        'contract,service,supervision',
        'Добавлено для полного сквозного демо',
        FALSE,
        NOW(),
        'seed-prj00009',
        'seed-prj00009'
    )
    ON CONFLICT (id)
    DO UPDATE SET
        title = EXCLUDED.title,
        document_number = EXCLUDED.document_number,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        project_id = EXCLUDED.project_id,
        contract_id = EXCLUDED.contract_id,
        organization_id = EXCLUDED.organization_id,
        description = EXCLUDED.description,
        file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        mime_type = EXCLUDED.mime_type,
        storage_path = EXCLUDED.storage_path,
        doc_version = EXCLUDED.doc_version,
        author_id = EXCLUDED.author_id,
        author_name = EXCLUDED.author_name,
        tags = EXCLUDED.tags,
        notes = EXCLUDED.notes,
        deleted = FALSE,
        updated_by = EXCLUDED.updated_by;

    UPDATE contracts c
    SET total_invoiced = COALESCE((
            SELECT SUM(i.total_amount)
            FROM invoices i
            WHERE i.contract_id = c.id
              AND i.deleted = FALSE
              AND i.status NOT IN ('DRAFT', 'CANCELLED')
        ), 0),
        total_paid = COALESCE((
            SELECT SUM(p.total_amount)
            FROM payments p
            WHERE p.contract_id = c.id
              AND p.deleted = FALSE
              AND p.status = 'PAID'
        ), 0),
        updated_by = 'seed-prj00009'
    WHERE c.project_id = v_project
      AND c.deleted = FALSE;

    UPDATE budgets
    SET actual_revenue = COALESCE((
            SELECT SUM(total_amount)
            FROM payments
            WHERE project_id = v_project AND payment_type = 'INCOMING' AND status = 'PAID' AND deleted = FALSE
        ), 0),
        actual_cost = COALESCE((
            SELECT SUM(total_amount)
            FROM payments
            WHERE project_id = v_project AND payment_type = 'OUTGOING' AND status = 'PAID' AND deleted = FALSE
        ), 0),
        actual_margin = COALESCE((
            SELECT SUM(CASE WHEN payment_type = 'INCOMING' THEN total_amount ELSE -total_amount END)
            FROM payments
            WHERE project_id = v_project AND status = 'PAID' AND deleted = FALSE
        ), 0),
        updated_by = 'seed-prj00009'
    WHERE project_id = v_project
      AND deleted = FALSE;

    RAISE NOTICE 'PRJ-00009 service package ensured (contract/service invoice/payment/doc)';
END $$;

UPDATE documents
SET organization_id = (SELECT organization_id FROM projects p WHERE p.id = documents.project_id)
WHERE organization_id IS NULL
  AND project_id IS NOT NULL;

ALTER TABLE documents ALTER COLUMN organization_id SET NOT NULL;

COMMIT;
