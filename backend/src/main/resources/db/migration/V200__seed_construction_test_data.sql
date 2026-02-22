-- =============================================================================
-- V200: Seed realistic construction test data
--
-- Demonstrates the full financial chain:
--   project → budget → budget_items → contracts → КС-2 → invoice → payment
--
-- Fixed org UUID: 11111111-1111-1111-1111-111111111111
-- All INSERTs use ON CONFLICT DO NOTHING for idempotency.
-- =============================================================================

-- =============================================================================
-- 0. FIXED UUIDs (deterministic, easy to reference in tests / Postman)
-- =============================================================================

-- Organization
-- org:  11111111-1111-1111-1111-111111111111

-- Project
-- prj:  22222222-2222-2222-2222-222222222222

-- Budget
-- bud:  33333333-3333-3333-3333-333333333333

-- Budget sections (is_section = true)
-- sec_ar:   aaaaaaaa-0001-0001-0001-000000000001
-- sec_ov:   aaaaaaaa-0001-0001-0001-000000000002
-- sec_vk:   aaaaaaaa-0001-0001-0001-000000000003
-- sec_eom:  aaaaaaaa-0001-0001-0001-000000000004
-- sec_aov:  aaaaaaaa-0001-0001-0001-000000000005

-- Budget positions (is_section = false)
-- AR positions
-- bi_ar_1:  bbbbbbbb-0001-0001-0001-000000000001  (Земляные работы)
-- bi_ar_2:  bbbbbbbb-0001-0001-0001-000000000002  (Монолитные конструкции фундамент)
-- bi_ar_3:  bbbbbbbb-0001-0001-0001-000000000003  (Монолитные конструкции перекрытия)
-- bi_ar_4:  bbbbbbbb-0001-0001-0001-000000000004  (Кирпичная кладка стен)
-- bi_ar_5:  bbbbbbbb-0001-0001-0001-000000000005  (Фасадные работы)
-- OV positions
-- bi_ov_1:  bbbbbbbb-0002-0002-0002-000000000001  (Монтаж системы отопления)
-- bi_ov_2:  bbbbbbbb-0002-0002-0002-000000000002  (Монтаж вентиляции приточно-вытяжной)
-- bi_ov_3:  bbbbbbbb-0002-0002-0002-000000000003  (Пусконаладочные работы ОВ)
-- VK positions
-- bi_vk_1:  bbbbbbbb-0003-0003-0003-000000000001  (Монтаж внутреннего водопровода)
-- bi_vk_2:  bbbbbbbb-0003-0003-0003-000000000002  (Монтаж внутренней канализации)
-- bi_vk_3:  bbbbbbbb-0003-0003-0003-000000000003  (Монтаж ГВС и рециркуляции)
-- EOM positions
-- bi_eom_1: bbbbbbbb-0004-0004-0004-000000000001  (Монтаж электрооборудования ВРУ)
-- bi_eom_2: bbbbbbbb-0004-0004-0004-000000000002  (Разводка электросети квартиры)
-- bi_eom_3: bbbbbbbb-0004-0004-0004-000000000003  (Монтаж освещения МОП)
-- AOV positions
-- bi_aov_1: bbbbbbbb-0005-0005-0005-000000000001  (Система автоматики котельной)
-- bi_aov_2: bbbbbbbb-0005-0005-0005-000000000002  (Диспетчеризация инженерных систем)

-- Counterparties (subcontractors)
-- cp_smg:  cccccccc-0001-0001-0001-000000000001  (ООО «СтройМонтажГрупп»)
-- cp_mi:   cccccccc-0002-0002-0002-000000000002  (ООО «МонтажИнжиниринг»)
-- cp_em:   cccccccc-0003-0003-0003-000000000003  (ООО «ЭлектроМонтаж-М»)

-- Contracts
-- ctr_ar:  dddddddd-0001-0001-0001-000000000001  (Договор АС работы)
-- ctr_ov:  dddddddd-0002-0002-0002-000000000002  (Договор ОВ)
-- ctr_eom: dddddddd-0003-0003-0003-000000000003  (Договор ЭОМ)

-- KS-2 documents
-- ks2_eom: eeeeeeee-0001-0001-0001-000000000001  (КС-2 №1 по договору ЭОМ — CLOSED)
-- ks2_ov:  eeeeeeee-0002-0002-0002-000000000002  (КС-2 №2 по договору ОВ — SIGNED)

-- Invoices
-- inv_eom: ffffffff-0001-0001-0001-000000000001  (Счёт по ЭОМ — PAID)
-- inv_ov:  ffffffff-0002-0002-0002-000000000002  (Счёт по ОВ — SENT)

-- Payments
-- pay_eom: 99999999-0001-0001-0001-000000000001  (Оплата по ЭОМ счёту)

-- =============================================================================
-- 1. ORGANIZATION (test tenant)
-- =============================================================================

INSERT INTO organizations (
    id,
    name,
    inn,
    kpp,
    ogrn,
    legal_address,
    type,
    active,
    deleted,
    created_by,
    version
)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'ООО «Привод Девелопмент»',
    '7701234567',
    '770101001',
    '1027700000001',
    'г. Москва, ул. Тверская, д. 1, офис 100',
    'COMPANY',
    TRUE,
    FALSE,
    'seed',
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. PROJECT
-- =============================================================================

INSERT INTO projects (
    id,
    code,
    name,
    description,
    status,
    organization_id,
    planned_start_date,
    planned_end_date,
    address,
    city,
    region,
    budget_amount,
    type,
    priority,
    deleted,
    created_by,
    version
)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'PRJ-SKVART',
    'Жилой комплекс «Северный квартал»',
    'Строительство многоквартирного жилого комплекса в Северном административном округе г. Москвы. '
    || '18-этажный монолитно-кирпичный жилой дом со встроенными нежилыми помещениями на 1 этаже.',
    'IN_PROGRESS',
    '11111111-1111-1111-1111-111111111111',
    '2024-03-01',
    '2026-12-31',
    'ул. Северная, д. 15',
    'Москва',
    'Москва',
    450000000.00,
    'RESIDENTIAL',
    'HIGH',
    FALSE,
    'seed',
    0
)
ON CONFLICT (id) DO NOTHING;

-- Also make code unique safe — only insert if code not already used by another row
-- (projects.code is UNIQUE globally, so we guard via the ON CONFLICT on id above)

-- =============================================================================
-- 3. BUDGET
-- =============================================================================

INSERT INTO budgets (
    id,
    name,
    project_id,
    organization_id,
    status,
    planned_revenue,
    planned_cost,
    planned_margin,
    actual_revenue,
    actual_cost,
    actual_margin,
    doc_version,
    notes,
    deleted,
    created_by,
    version
)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Бюджет строительства ЖК «Северный квартал»',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'ACTIVE',
    500000000.00,
    410000000.00,
    90000000.00,   -- planned_margin = revenue - cost
    8100000.00,    -- actual_revenue (from paid EOM invoice)
    8100000.00,    -- actual_cost
    0.00,
    1,
    'Версия 1. Утверждён на заседании ИГК 15.02.2024.',
    FALSE,
    'seed',
    0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4. BUDGET SECTIONS (is_section = TRUE, no quantities/prices)
--
-- Columns from V13 + V120 + V130:
--   budget_id, sequence, category, name, planned_amount, actual_amount,
--   committed_amount, is_section, parent_id, discipline_mark,
--   item_type, quantity, unit, cost_price, coefficient,
--   sale_price, vat_rate, vat_amount, total_with_vat,
--   contracted_amount, act_signed_amount, invoiced_amount, paid_amount,
--   doc_status, organization_id (added in V117 via budget → project)
-- =============================================================================

INSERT INTO budget_items (
    id, budget_id, sequence, category, name, planned_amount, actual_amount,
    committed_amount, is_section, parent_id, discipline_mark, item_type,
    quantity, unit, cost_price, coefficient, sale_price, vat_rate,
    vat_amount, total_with_vat, contracted_amount, act_signed_amount,
    invoiced_amount, paid_amount, doc_status, deleted, created_by, version
)
VALUES
-- АР — Архитектурно-строительные работы
(
    'aaaaaaaa-0001-0001-0001-000000000001',
    '33333333-3333-3333-3333-333333333333',
    10, 'SUBCONTRACT',
    'АР — Архитектурно-строительные работы',
    0, 0, 0,
    TRUE, NULL, 'АР', 'WORKS',
    0, 'компл', 0, 1.0000, 0, 22.00, 0, 0,
    0, 0, 0, 0, 'PLANNED', FALSE, 'seed', 0
),
-- ОВ — Отопление и вентиляция
(
    'aaaaaaaa-0001-0001-0001-000000000002',
    '33333333-3333-3333-3333-333333333333',
    20, 'SUBCONTRACT',
    'ОВ — Отопление и вентиляция',
    0, 0, 0,
    TRUE, NULL, 'ОВ', 'WORKS',
    0, 'компл', 0, 1.0000, 0, 22.00, 0, 0,
    0, 0, 0, 0, 'PLANNED', FALSE, 'seed', 0
),
-- ВК — Водоснабжение и канализация
(
    'aaaaaaaa-0001-0001-0001-000000000003',
    '33333333-3333-3333-3333-333333333333',
    30, 'SUBCONTRACT',
    'ВК — Водоснабжение и канализация',
    0, 0, 0,
    TRUE, NULL, 'ВК', 'WORKS',
    0, 'компл', 0, 1.0000, 0, 22.00, 0, 0,
    0, 0, 0, 0, 'PLANNED', FALSE, 'seed', 0
),
-- ЭОМ — Электроосвещение и электрооборудование
(
    'aaaaaaaa-0001-0001-0001-000000000004',
    '33333333-3333-3333-3333-333333333333',
    40, 'SUBCONTRACT',
    'ЭОМ — Электроосвещение и электрооборудование',
    0, 0, 0,
    TRUE, NULL, 'ЭОМ', 'WORKS',
    0, 'компл', 0, 1.0000, 0, 22.00, 0, 0,
    0, 0, 0, 0, 'PLANNED', FALSE, 'seed', 0
),
-- АОВ — Автоматизация ОВ систем
(
    'aaaaaaaa-0001-0001-0001-000000000005',
    '33333333-3333-3333-3333-333333333333',
    50, 'SUBCONTRACT',
    'АОВ — Автоматизация ОВ систем',
    0, 0, 0,
    TRUE, NULL, 'АОВ', 'WORKS',
    0, 'компл', 0, 1.0000, 0, 22.00, 0, 0,
    0, 0, 0, 0, 'PLANNED', FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. BUDGET POSITIONS under АР section
--
-- Formulas:
--   sale_price     = cost_price * coefficient
--   vat_amount     = sale_price * vat_rate / 100
--   total_with_vat = sale_price + vat_amount
--   planned_amount = sale_price * quantity
-- =============================================================================

INSERT INTO budget_items (
    id, budget_id, sequence, category, name, planned_amount, actual_amount,
    committed_amount, is_section, parent_id, discipline_mark, item_type,
    quantity, unit, cost_price, coefficient, sale_price, vat_rate,
    vat_amount, total_with_vat, contracted_amount, act_signed_amount,
    invoiced_amount, paid_amount, doc_status, deleted, created_by, version
)
VALUES
-- AR-1: Земляные работы
-- sale_price = 850 * 1.15 = 977.50
-- vat_amount = 977.50 * 22 / 100 = 215.05
-- total_with_vat = 977.50 + 215.05 = 1192.55
-- planned_amount = 977.50 * 1200 = 1173000.00
-- doc_status = PAID → contracted_amount, act_signed_amount, invoiced_amount, paid_amount populated
(
    'bbbbbbbb-0001-0001-0001-000000000001',
    '33333333-3333-3333-3333-333333333333',
    11, 'SUBCONTRACT',
    'Земляные работы',
    1173000.00, 1400000.00, 1400000.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000001', 'АР', 'WORKS',
    1200, 'м³', 850.00, 1.1500, 977.50, 22.00,
    215.05, 1192.55,
    14250000.00,  -- contracted_amount (fraction of contract 1 total 18500000)
    1400000.00,   -- act_signed_amount
    1400000.00,   -- invoiced_amount
    1400000.00,   -- paid_amount (PAID)
    'PAID', FALSE, 'seed', 0
),
-- AR-2: Монолитные конструкции фундамент
-- sale_price = 15000 * 1.12 = 16800.00
-- vat_amount = 16800 * 22 / 100 = 3696.00
-- total_with_vat = 16800 + 3696 = 20496.00
-- planned_amount = 16800 * 450 = 7560000.00
-- doc_status = ACT_SIGNED
(
    'bbbbbbbb-0001-0001-0001-000000000002',
    '33333333-3333-3333-3333-333333333333',
    12, 'SUBCONTRACT',
    'Монолитные конструкции фундамент',
    7560000.00, 4250000.00, 4250000.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000001', 'АР', 'WORKS',
    450, 'м³', 15000.00, 1.1200, 16800.00, 22.00,
    3696.00, 20496.00,
    4250000.00,   -- contracted_amount (remainder of contract 1)
    4250000.00,   -- act_signed_amount
    0.00,
    0.00,
    'ACT_SIGNED', FALSE, 'seed', 0
),
-- AR-3: Монолитные конструкции перекрытия
-- sale_price = 6500 * 1.12 = 7280.00
-- vat_amount = 7280 * 22 / 100 = 1601.60
-- total_with_vat = 7280 + 1601.60 = 8881.60
-- planned_amount = 7280 * 2800 = 20384000.00
-- doc_status = CONTRACTED
(
    'bbbbbbbb-0001-0001-0001-000000000003',
    '33333333-3333-3333-3333-333333333333',
    13, 'SUBCONTRACT',
    'Монолитные конструкции перекрытия',
    20384000.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000001', 'АР', 'WORKS',
    2800, 'м²', 6500.00, 1.1200, 7280.00, 22.00,
    1601.60, 8881.60,
    0.00, 0.00, 0.00, 0.00,
    'CONTRACTED', FALSE, 'seed', 0
),
-- AR-4: Кирпичная кладка стен
-- sale_price = 4200 * 1.10 = 4620.00
-- vat_amount = 4620 * 22 / 100 = 1016.40
-- total_with_vat = 4620 + 1016.40 = 5636.40
-- planned_amount = 4620 * 3200 = 14784000.00
-- doc_status = CONTRACTED
(
    'bbbbbbbb-0001-0001-0001-000000000004',
    '33333333-3333-3333-3333-333333333333',
    14, 'SUBCONTRACT',
    'Кирпичная кладка стен',
    14784000.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000001', 'АР', 'WORKS',
    3200, 'м²', 4200.00, 1.1000, 4620.00, 22.00,
    1016.40, 5636.40,
    0.00, 0.00, 0.00, 0.00,
    'CONTRACTED', FALSE, 'seed', 0
),
-- AR-5: Фасадные работы
-- sale_price = 8500 * 1.10 = 9350.00
-- vat_amount = 9350 * 22 / 100 = 2057.00
-- total_with_vat = 9350 + 2057 = 11407.00
-- planned_amount = 9350 * 2100 = 19635000.00
-- doc_status = PLANNED
(
    'bbbbbbbb-0001-0001-0001-000000000005',
    '33333333-3333-3333-3333-333333333333',
    15, 'SUBCONTRACT',
    'Фасадные работы',
    19635000.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000001', 'АР', 'WORKS',
    2100, 'м²', 8500.00, 1.1000, 9350.00, 22.00,
    2057.00, 11407.00,
    0.00, 0.00, 0.00, 0.00,
    'PLANNED', FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 6. BUDGET POSITIONS under ОВ section
-- =============================================================================

INSERT INTO budget_items (
    id, budget_id, sequence, category, name, planned_amount, actual_amount,
    committed_amount, is_section, parent_id, discipline_mark, item_type,
    quantity, unit, cost_price, coefficient, sale_price, vat_rate,
    vat_amount, total_with_vat, contracted_amount, act_signed_amount,
    invoiced_amount, paid_amount, doc_status, deleted, created_by, version
)
VALUES
-- OV-1: Монтаж системы отопления
-- sale_price = 4500000 * 1.08 = 4860000.00
-- vat_amount = 4860000 * 22 / 100 = 1069200.00
-- total_with_vat = 4860000 + 1069200 = 5929200.00
-- planned_amount = 4860000 * 1 = 4860000.00
-- doc_status = CONTRACTED → contract signed, КС-2 подписан
(
    'bbbbbbbb-0002-0002-0002-000000000001',
    '33333333-3333-3333-3333-333333333333',
    21, 'SUBCONTRACT',
    'Монтаж системы отопления',
    4860000.00, 4860000.00, 4860000.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000002', 'ОВ', 'WORKS',
    1, 'компл', 4500000.00, 1.0800, 4860000.00, 22.00,
    1069200.00, 5929200.00,
    4860000.00,   -- contracted_amount
    4860000.00,   -- act_signed_amount (КС-2 подписан)
    4860000.00,   -- invoiced_amount (счёт выставлен)
    0.00,
    'CONTRACTED', FALSE, 'seed', 0
),
-- OV-2: Монтаж вентиляции приточно-вытяжной
-- sale_price = 3200000 * 1.08 = 3456000.00
-- vat_amount = 3456000 * 22 / 100 = 760320.00
-- total_with_vat = 3456000 + 760320 = 4216320.00
-- planned_amount = 3456000 * 1 = 3456000.00
-- doc_status = PLANNED
(
    'bbbbbbbb-0002-0002-0002-000000000002',
    '33333333-3333-3333-3333-333333333333',
    22, 'SUBCONTRACT',
    'Монтаж вентиляции приточно-вытяжной',
    3456000.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000002', 'ОВ', 'WORKS',
    1, 'компл', 3200000.00, 1.0800, 3456000.00, 22.00,
    760320.00, 4216320.00,
    0.00, 0.00, 0.00, 0.00,
    'PLANNED', FALSE, 'seed', 0
),
-- OV-3: Пусконаладочные работы ОВ
-- sale_price = 450000 * 1.10 = 495000.00
-- vat_amount = 495000 * 22 / 100 = 108900.00
-- total_with_vat = 495000 + 108900 = 603900.00
-- planned_amount = 495000 * 1 = 495000.00
-- doc_status = PLANNED
(
    'bbbbbbbb-0002-0002-0002-000000000003',
    '33333333-3333-3333-3333-333333333333',
    23, 'SUBCONTRACT',
    'Пусконаладочные работы ОВ',
    495000.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000002', 'ОВ', 'WORKS',
    1, 'компл', 450000.00, 1.1000, 495000.00, 22.00,
    108900.00, 603900.00,
    0.00, 0.00, 0.00, 0.00,
    'PLANNED', FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 7. BUDGET POSITIONS under ВК section
-- =============================================================================

INSERT INTO budget_items (
    id, budget_id, sequence, category, name, planned_amount, actual_amount,
    committed_amount, is_section, parent_id, discipline_mark, item_type,
    quantity, unit, cost_price, coefficient, sale_price, vat_rate,
    vat_amount, total_with_vat, contracted_amount, act_signed_amount,
    invoiced_amount, paid_amount, doc_status, deleted, created_by, version
)
VALUES
-- VK-1: Монтаж внутреннего водопровода
-- sale_price = 1800000 * 1.08 = 1944000.00
-- vat_amount = 1944000 * 22 / 100 = 427680.00
-- total_with_vat = 1944000 + 427680 = 2371680.00
-- planned_amount = 1944000
-- doc_status = INVOICED
(
    'bbbbbbbb-0003-0003-0003-000000000001',
    '33333333-3333-3333-3333-333333333333',
    31, 'SUBCONTRACT',
    'Монтаж внутреннего водопровода',
    1944000.00, 1944000.00, 1944000.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000003', 'ВК', 'WORKS',
    1, 'компл', 1800000.00, 1.0800, 1944000.00, 22.00,
    427680.00, 2371680.00,
    1944000.00,   -- contracted_amount
    1944000.00,   -- act_signed_amount
    1944000.00,   -- invoiced_amount
    0.00,
    'INVOICED', FALSE, 'seed', 0
),
-- VK-2: Монтаж внутренней канализации
-- sale_price = 1200000 * 1.08 = 1296000.00
-- vat_amount = 1296000 * 22 / 100 = 285120.00
-- total_with_vat = 1296000 + 285120 = 1581120.00
-- planned_amount = 1296000
-- doc_status = ACT_SIGNED
(
    'bbbbbbbb-0003-0003-0003-000000000002',
    '33333333-3333-3333-3333-333333333333',
    32, 'SUBCONTRACT',
    'Монтаж внутренней канализации',
    1296000.00, 1296000.00, 1296000.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000003', 'ВК', 'WORKS',
    1, 'компл', 1200000.00, 1.0800, 1296000.00, 22.00,
    285120.00, 1581120.00,
    1296000.00,   -- contracted_amount
    1296000.00,   -- act_signed_amount
    0.00,
    0.00,
    'ACT_SIGNED', FALSE, 'seed', 0
),
-- VK-3: Монтаж ГВС и рециркуляции
-- sale_price = 950000 * 1.10 = 1045000.00
-- vat_amount = 1045000 * 22 / 100 = 229900.00
-- total_with_vat = 1045000 + 229900 = 1274900.00
-- planned_amount = 1045000
-- doc_status = PLANNED
(
    'bbbbbbbb-0003-0003-0003-000000000003',
    '33333333-3333-3333-3333-333333333333',
    33, 'SUBCONTRACT',
    'Монтаж ГВС и рециркуляции',
    1045000.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000003', 'ВК', 'WORKS',
    1, 'компл', 950000.00, 1.1000, 1045000.00, 22.00,
    229900.00, 1274900.00,
    0.00, 0.00, 0.00, 0.00,
    'PLANNED', FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 8. BUDGET POSITIONS under ЭОМ section
-- =============================================================================

INSERT INTO budget_items (
    id, budget_id, sequence, category, name, planned_amount, actual_amount,
    committed_amount, is_section, parent_id, discipline_mark, item_type,
    quantity, unit, cost_price, coefficient, sale_price, vat_rate,
    vat_amount, total_with_vat, contracted_amount, act_signed_amount,
    invoiced_amount, paid_amount, doc_status, deleted, created_by, version
)
VALUES
-- EOM-1: Монтаж электрооборудования ВРУ
-- sale_price = 2100000 * 1.10 = 2310000.00
-- vat_amount = 2310000 * 22 / 100 = 508200.00
-- total_with_vat = 2310000 + 508200 = 2818200.00
-- planned_amount = 2310000
-- doc_status = CONTRACTED
(
    'bbbbbbbb-0004-0004-0004-000000000001',
    '33333333-3333-3333-3333-333333333333',
    41, 'SUBCONTRACT',
    'Монтаж электрооборудования ВРУ',
    2310000.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000004', 'ЭОМ', 'WORKS',
    1, 'компл', 2100000.00, 1.1000, 2310000.00, 22.00,
    508200.00, 2818200.00,
    0.00, 0.00, 0.00, 0.00,
    'CONTRACTED', FALSE, 'seed', 0
),
-- EOM-2: Разводка электросети квартиры
-- sale_price = 45000 * 1.10 = 49500.00
-- vat_amount = 49500 * 22 / 100 = 10890.00
-- total_with_vat = 49500 + 10890 = 60390.00
-- planned_amount = 49500 * 180 = 8910000.00
-- doc_status = PAID (КС-2 CLOSED, счёт оплачен)
(
    'bbbbbbbb-0004-0004-0004-000000000002',
    '33333333-3333-3333-3333-333333333333',
    42, 'SUBCONTRACT',
    'Разводка электросети квартиры',
    8910000.00, 8100000.00, 8100000.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000004', 'ЭОМ', 'WORKS',
    180, 'шт', 45000.00, 1.1000, 49500.00, 22.00,
    10890.00, 60390.00,
    8100000.00,   -- contracted_amount
    8100000.00,   -- act_signed_amount (КС-2 CLOSED)
    8100000.00,   -- invoiced_amount
    8100000.00,   -- paid_amount (PAID)
    'PAID', FALSE, 'seed', 0
),
-- EOM-3: Монтаж освещения МОП
-- sale_price = 680000 * 1.08 = 734400.00
-- vat_amount = 734400 * 22 / 100 = 161568.00
-- total_with_vat = 734400 + 161568 = 895968.00
-- planned_amount = 734400
-- doc_status = PLANNED
(
    'bbbbbbbb-0004-0004-0004-000000000003',
    '33333333-3333-3333-3333-333333333333',
    43, 'SUBCONTRACT',
    'Монтаж освещения МОП',
    734400.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000004', 'ЭОМ', 'WORKS',
    1, 'компл', 680000.00, 1.0800, 734400.00, 22.00,
    161568.00, 895968.00,
    0.00, 0.00, 0.00, 0.00,
    'PLANNED', FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 9. BUDGET POSITIONS under АОВ section
-- =============================================================================

INSERT INTO budget_items (
    id, budget_id, sequence, category, name, planned_amount, actual_amount,
    committed_amount, is_section, parent_id, discipline_mark, item_type,
    quantity, unit, cost_price, coefficient, sale_price, vat_rate,
    vat_amount, total_with_vat, contracted_amount, act_signed_amount,
    invoiced_amount, paid_amount, doc_status, deleted, created_by, version
)
VALUES
-- AOV-1: Система автоматики котельной
-- sale_price = 1500000 * 1.12 = 1680000.00
-- vat_amount = 1680000 * 22 / 100 = 369600.00
-- total_with_vat = 1680000 + 369600 = 2049600.00
-- planned_amount = 1680000
-- doc_status = CONTRACTED
(
    'bbbbbbbb-0005-0005-0005-000000000001',
    '33333333-3333-3333-3333-333333333333',
    51, 'SUBCONTRACT',
    'Система автоматики котельной',
    1680000.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000005', 'АОВ', 'WORKS',
    1, 'компл', 1500000.00, 1.1200, 1680000.00, 22.00,
    369600.00, 2049600.00,
    1680000.00,   -- contracted_amount
    0.00, 0.00, 0.00,
    'CONTRACTED', FALSE, 'seed', 0
),
-- AOV-2: Диспетчеризация инженерных систем
-- sale_price = 850000 * 1.10 = 935000.00
-- vat_amount = 935000 * 22 / 100 = 205700.00
-- total_with_vat = 935000 + 205700 = 1140700.00
-- planned_amount = 935000
-- doc_status = PLANNED
(
    'bbbbbbbb-0005-0005-0005-000000000002',
    '33333333-3333-3333-3333-333333333333',
    52, 'SUBCONTRACT',
    'Диспетчеризация инженерных систем',
    935000.00, 0.00, 0.00,
    FALSE, 'aaaaaaaa-0001-0001-0001-000000000005', 'АОВ', 'WORKS',
    1, 'компл', 850000.00, 1.1000, 935000.00, 22.00,
    205700.00, 1140700.00,
    0.00, 0.00, 0.00, 0.00,
    'PLANNED', FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 10. COUNTERPARTIES (subcontractors)
--
-- Note: V89 added organization_id NOT NULL and uq_counterparty_org_inn
-- INN is 10-digit (юридические лица)
-- =============================================================================

INSERT INTO counterparties (
    id, name, inn, kpp, ogrn,
    legal_address, bank_account, bik, correspondent_account,
    is_supplier, is_customer, is_active,
    organization_id,
    deleted, created_by, version
)
VALUES
-- Генеральный подрядчик (АС работы)
(
    'cccccccc-0001-0001-0001-000000000001',
    'ООО «СтройМонтажГрупп»',
    '7709876543',
    '770901001',
    '1027709000001',
    'г. Москва, ул. Строителей, д. 12, стр. 1',
    '40702810900000012345',
    '044525225',
    '30101810400000000225',
    TRUE, FALSE, TRUE,
    '11111111-1111-1111-1111-111111111111',
    FALSE, 'seed', 0
),
-- МЭП подрядчик (ОВ)
(
    'cccccccc-0002-0002-0002-000000000002',
    'ООО «МонтажИнжиниринг»',
    '7703456789',
    '770301001',
    '1027703000001',
    'г. Москва, пр-т Мира, д. 45',
    '40702810200000034567',
    '044525974',
    '30101810145250000974',
    TRUE, FALSE, TRUE,
    '11111111-1111-1111-1111-111111111111',
    FALSE, 'seed', 0
),
-- Электромонтажный подрядчик (ЭОМ)
(
    'cccccccc-0003-0003-0003-000000000003',
    'ООО «ЭлектроМонтаж-М»',
    '7707654321',
    '770701001',
    '1027707000001',
    'г. Москва, ул. Электрозаводская, д. 33, оф. 215',
    '40702810700000056789',
    '044525545',
    '30101810200000000545',
    TRUE, FALSE, TRUE,
    '11111111-1111-1111-1111-111111111111',
    FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 11. CONTRACTS
--
-- Note: V95 added organization_id NOT NULL and uq_contract_org_number
--       V121 added budget_item_id (link to primary budget position)
--
-- contracts.amount = сумма без НДС
-- contracts.vat_rate = 20%
-- contracts.vat_amount = amount * 20 / 100
-- contracts.total_with_vat = amount + vat_amount
-- =============================================================================

-- Resolve the SUBCONTRACT contract_type id at runtime
-- We use a CTE approach with DO NOTHING to keep it idempotent.

INSERT INTO contracts (
    id, name, number, contract_date,
    partner_id, partner_name,
    project_id, organization_id,
    status, amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    retention_percent,
    budget_item_id,
    total_invoiced, total_paid,
    notes, deleted, created_by, version
)
VALUES
-- Contract 1: АС работы (СтройМонтажГрупп)
-- amount = 18500000 (без НДС), vat = 20%, vat_amount = 3700000, total = 22200000
(
    'dddddddd-0001-0001-0001-000000000001',
    'Договор на АС работы №СМГ-2024/01',
    'СМГ-2024/01',
    '2024-03-15',
    'cccccccc-0001-0001-0001-000000000001',
    'ООО «СтройМонтажГрупп»',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'SIGNED',
    18500000.00,
    20.00,
    3700000.00,
    22200000.00,
    'Оплата в течение 30 дней с момента подписания КС-2 и КС-3. '
    || 'Авансирование — 30% от суммы договора.',
    '2024-03-20',
    '2025-06-30',
    5.00,
    'bbbbbbbb-0001-0001-0001-000000000001',  -- budget_item_id → Земляные работы
    1400000.00,   -- total_invoiced
    1400000.00,   -- total_paid
    'Договор субподряда на выполнение архитектурно-строительных работ. '
    || 'Включает: земляные работы и монолитные конструкции фундамента.',
    FALSE, 'seed', 0
),
-- Contract 2: ОВ (МонтажИнжиниринг)
-- amount = 4860000 (без НДС), vat = 20%, vat_amount = 972000, total = 5832000
(
    'dddddddd-0002-0002-0002-000000000002',
    'Договор ОВ №МИ-2024/15',
    'МИ-2024/15',
    '2024-04-01',
    'cccccccc-0002-0002-0002-000000000002',
    'ООО «МонтажИнжиниринг»',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'SIGNED',
    4860000.00,
    20.00,
    972000.00,
    5832000.00,
    'Оплата в течение 20 дней с момента подписания актов КС-2.',
    '2024-05-01',
    '2025-03-31',
    5.00,
    'bbbbbbbb-0002-0002-0002-000000000001',  -- budget_item_id → Монтаж системы отопления
    4860000.00,   -- total_invoiced
    0.00,
    'Договор субподряда на монтаж системы отопления и вентиляции.',
    FALSE, 'seed', 0
),
-- Contract 3: ЭОМ (ЭлектроМонтаж-М)
-- amount = 8100000 (без НДС), vat = 20%, vat_amount = 1620000, total = 9720000
(
    'dddddddd-0003-0003-0003-000000000003',
    'Договор ЭОМ №ЭМ-2024/08',
    'ЭМ-2024/08',
    '2024-04-10',
    'cccccccc-0003-0003-0003-000000000003',
    'ООО «ЭлектроМонтаж-М»',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'SIGNED',
    8100000.00,
    20.00,
    1620000.00,
    9720000.00,
    'Оплата в течение 15 дней с момента подписания КС-2. '
    || 'Авансирование — 20%.',
    '2024-04-15',
    '2024-12-31',
    5.00,
    'bbbbbbbb-0004-0004-0004-000000000002',  -- budget_item_id → Разводка электросети квартиры
    8100000.00,   -- total_invoiced
    8100000.00,   -- total_paid
    'Договор субподряда на монтаж электрооборудования и разводку электросети '
    || 'в 180 квартирах жилого комплекса.',
    FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 12. КС-2 DOCUMENTS (Акты выполненных работ)
--
-- Note: V118 added total_vat_amount, total_with_vat to ks2_documents
-- КС-2 №1: Contract 3 (ЭОМ) — CLOSED (работы завершены и оплачены)
-- КС-2 №2: Contract 2 (ОВ)  — SIGNED (подписан, счёт выставлен)
-- =============================================================================

INSERT INTO ks2_documents (
    id, number, document_date, name,
    project_id, contract_id,
    status, total_amount, total_quantity,
    total_vat_amount, total_with_vat,
    signed_at,
    notes, deleted, created_by, version
)
VALUES
-- КС-2 №1: ЭОМ — разводка электросети (CLOSED)
-- total_amount = 8100000 (без НДС)
-- total_vat_amount = 8100000 * 20 / 100 = 1620000
-- total_with_vat = 8100000 + 1620000 = 9720000
(
    'eeeeeeee-0001-0001-0001-000000000001',
    'КС-2/ЭМ-2024/08-001',
    '2024-11-30',
    'Акт о приёмке выполненных работ. Разводка электросети квартиры, 180 шт.',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-0003-0003-0003-000000000003',
    'CLOSED',
    8100000.00,
    180.000,
    1620000.00,
    9720000.00,
    '2024-11-30 17:00:00+03',
    'Акт подписан обеими сторонами. Работы выполнены в полном объёме. '
    || 'Все 180 квартир сданы по актам скрытых работ.',
    FALSE, 'seed', 0
),
-- КС-2 №2: ОВ — монтаж системы отопления (SIGNED)
-- total_amount = 4860000 (без НДС)
-- total_vat_amount = 4860000 * 20 / 100 = 972000
-- total_with_vat = 4860000 + 972000 = 5832000
(
    'eeeeeeee-0002-0002-0002-000000000002',
    'КС-2/МИ-2024/15-001',
    '2024-12-20',
    'Акт о приёмке выполненных работ. Монтаж системы отопления, 1 компл.',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-0002-0002-0002-000000000002',
    'SIGNED',
    4860000.00,
    1.000,
    972000.00,
    5832000.00,
    '2024-12-20 16:00:00+03',
    'Акт подписан. Система отопления смонтирована и прошла гидравлические испытания. '
    || 'Ожидается оплата.',
    FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 13. КС-2 LINES (Строки актов)
--
-- Note: V118 added vat_rate, vat_amount, amount_with_vat to ks2_lines
-- =============================================================================

INSERT INTO ks2_lines (
    id, ks2_id, sequence, name,
    quantity, unit_price, amount, unit_of_measure,
    vat_rate, vat_amount, amount_with_vat,
    notes, deleted, created_by, version
)
VALUES
-- Lines for КС-2 №1 (ЭОМ)
(
    gen_random_uuid(),
    'eeeeeeee-0001-0001-0001-000000000001',
    1,
    'Разводка электросети, монтаж электрощитов и розеточных групп в квартирах',
    180.000,
    45000.00,
    8100000.00,
    'шт',
    20.00,
    1620000.00,
    9720000.00,
    NULL,
    FALSE, 'seed', 0
),
-- Lines for КС-2 №2 (ОВ)
(
    gen_random_uuid(),
    'eeeeeeee-0002-0002-0002-000000000002',
    1,
    'Монтаж системы отопления: трубопроводы, радиаторы, коллекторы',
    1.000,
    3600000.00,
    3600000.00,
    'компл',
    20.00,
    720000.00,
    4320000.00,
    NULL,
    FALSE, 'seed', 0
),
(
    gen_random_uuid(),
    'eeeeeeee-0002-0002-0002-000000000002',
    2,
    'Обвязка котельного оборудования и установка расширительных баков',
    1.000,
    1260000.00,
    1260000.00,
    'компл',
    20.00,
    252000.00,
    1512000.00,
    NULL,
    FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 14. INVOICES (Счета на оплату)
--
-- Note: V113 changed invoices.number uniqueness to (organization_id, number)
--       V117 added organization_id NOT NULL
--
-- Invoice 1: ЭОМ — счёт по КС-2 №1 (PAID)
-- Invoice 2: ОВ  — счёт по КС-2 №2 (SENT)
-- =============================================================================

INSERT INTO invoices (
    id, number, invoice_date, due_date,
    project_id, contract_id, partner_id, partner_name,
    organization_id,
    invoice_type, status,
    subtotal, vat_rate, vat_amount, total_amount,
    paid_amount, remaining_amount,
    ks2_id,
    notes, deleted, created_by, version
)
VALUES
-- Invoice 1: ЭОМ (PAID)
-- subtotal = 8100000, vat_rate=20, vat_amount=1620000, total=9720000
-- paid_amount = 9720000 (полностью оплачен)
(
    'ffffffff-0001-0001-0001-000000000001',
    'СЧ-ЭМ-2024/001',
    '2024-12-05',
    '2024-12-20',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-0003-0003-0003-000000000003',
    'cccccccc-0003-0003-0003-000000000003',
    'ООО «ЭлектроМонтаж-М»',
    '11111111-1111-1111-1111-111111111111',
    'RECEIVED',
    'PAID',
    8100000.00,
    20.00,
    1620000.00,
    9720000.00,
    9720000.00,   -- paid_amount
    0.00,         -- remaining_amount
    'eeeeeeee-0001-0001-0001-000000000001',
    'Счёт по акту КС-2/ЭМ-2024/08-001. Разводка электросети 180 квартир. '
    || 'Оплачен в полном объёме п/п №456 от 18.12.2024.',
    FALSE, 'seed', 0
),
-- Invoice 2: ОВ (SENT — ожидает оплаты)
-- subtotal = 4860000, vat_rate=20, vat_amount=972000, total=5832000
-- paid_amount = 0 (не оплачен)
(
    'ffffffff-0002-0002-0002-000000000002',
    'СЧ-МИ-2024/002',
    '2024-12-25',
    '2025-01-15',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-0002-0002-0002-000000000002',
    'cccccccc-0002-0002-0002-000000000002',
    'ООО «МонтажИнжиниринг»',
    '11111111-1111-1111-1111-111111111111',
    'RECEIVED',
    'SENT',
    4860000.00,
    20.00,
    972000.00,
    5832000.00,
    0.00,
    5832000.00,   -- remaining_amount = total (не оплачен)
    'eeeeeeee-0002-0002-0002-000000000002',
    'Счёт по акту КС-2/МИ-2024/15-001. Монтаж системы отопления. '
    || 'Срок оплаты 15.01.2025.',
    FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 15. INVOICE LINES (Строки счетов)
-- =============================================================================

INSERT INTO invoice_lines (
    id, invoice_id, sequence, name,
    quantity, unit_price, amount, unit_of_measure,
    deleted, created_by, version
)
VALUES
-- Lines for Invoice 1 (ЭОМ)
(
    gen_random_uuid(),
    'ffffffff-0001-0001-0001-000000000001',
    1,
    'Разводка электросети, монтаж электрощитов и розеточных групп в квартирах',
    180.000,
    45000.00,
    8100000.00,
    'шт',
    FALSE, 'seed', 0
),
-- Lines for Invoice 2 (ОВ)
(
    gen_random_uuid(),
    'ffffffff-0002-0002-0002-000000000002',
    1,
    'Монтаж системы отопления: трубопроводы, радиаторы, коллекторы',
    1.000,
    3600000.00,
    3600000.00,
    'компл',
    FALSE, 'seed', 0
),
(
    gen_random_uuid(),
    'ffffffff-0002-0002-0002-000000000002',
    2,
    'Обвязка котельного оборудования и установка расширительных баков',
    1.000,
    1260000.00,
    1260000.00,
    'компл',
    FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 16. PAYMENT (Платёж по оплаченному счёту ЭОМ)
-- =============================================================================

INSERT INTO payments (
    id, number, payment_date,
    project_id, contract_id, partner_id, partner_name,
    organization_id,
    payment_type, status,
    amount, vat_amount, total_amount,
    purpose, bank_account,
    invoice_id,
    paid_at,
    notes, deleted, created_by, version
)
VALUES
(
    '99999999-0001-0001-0001-000000000001',
    'ПП-2024/456',
    '2024-12-18',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-0003-0003-0003-000000000003',
    'cccccccc-0003-0003-0003-000000000003',
    'ООО «ЭлектроМонтаж-М»',
    '11111111-1111-1111-1111-111111111111',
    'OUTGOING',
    'PAID',
    8100000.00,
    1620000.00,
    9720000.00,
    'Оплата по договору ЭМ-2024/08 за выполненные работы по разводке электросети '
    || '(КС-2 №КС-2/ЭМ-2024/08-001). В т.ч. НДС 20% — 1 620 000,00 руб.',
    '40702810700000056789',
    'ffffffff-0001-0001-0001-000000000001',
    '2024-12-18 14:30:00+03',
    'Платёжное поручение №456 от 18.12.2024. '
    || 'Проведено банком 18.12.2024.',
    FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 17. CASH FLOW ENTRY (движение денег по оплате ЭОМ)
-- =============================================================================

INSERT INTO cash_flow_entries (
    id, project_id, entry_date, direction, category,
    amount, description,
    payment_id, invoice_id,
    notes, deleted, created_by, version
)
VALUES
(
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    '2024-12-18',
    'out',
    'SUBCONTRACT',
    9720000.00,
    'Оплата ООО «ЭлектроМонтаж-М» по договору ЭМ-2024/08',
    '99999999-0001-0001-0001-000000000001',
    'ffffffff-0001-0001-0001-000000000001',
    'ЭОМ: разводка электросети 180 квартир',
    FALSE, 'seed', 0
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Done.
-- Summary of seeded financial chain:
--
--   Project "ЖК Северный квартал" (PRJ-SKVART)
--     └─ Budget "Бюджет строительства ЖК..." (ACTIVE)
--          ├─ АР section
--          │    ├─ Земляные работы            (PAID)      → Contract СМГ-2024/01
--          │    ├─ Монолитные конструкции фунд (ACT_SIGNED)→ Contract СМГ-2024/01
--          │    ├─ Монолитные конструкции перекр(CONTRACTED)
--          │    ├─ Кирпичная кладка стен       (CONTRACTED)
--          │    └─ Фасадные работы             (PLANNED)
--          ├─ ОВ section
--          │    ├─ Монтаж системы отопления    (CONTRACTED)→ Contract МИ-2024/15
--          │    │    └─ КС-2/МИ-2024/15-001 (SIGNED)
--          │    │         └─ Invoice СЧ-МИ-2024/002 (SENT, ожидает оплаты)
--          │    ├─ Монтаж вентиляции           (PLANNED)
--          │    └─ Пусконаладочные ОВ          (PLANNED)
--          ├─ ВК section
--          │    ├─ Монтаж водопровода          (INVOICED)
--          │    ├─ Монтаж канализации          (ACT_SIGNED)
--          │    └─ Монтаж ГВС                  (PLANNED)
--          ├─ ЭОМ section
--          │    ├─ Монтаж ВРУ                  (CONTRACTED)
--          │    ├─ Разводка электросети        (PAID)      → Contract ЭМ-2024/08
--          │    │    └─ КС-2/ЭМ-2024/08-001 (CLOSED)
--          │    │         └─ Invoice СЧ-ЭМ-2024/001 (PAID)
--          │    │              └─ Payment ПП-2024/456 (PAID, 18.12.2024)
--          │    │                   └─ CashFlow OUT 9 720 000 ₽
--          │    └─ Монтаж освещения МОП        (PLANNED)
--          └─ АОВ section
--               ├─ Система автоматики котельной (CONTRACTED)
--               └─ Диспетчеризация             (PLANNED)
-- =============================================================================
