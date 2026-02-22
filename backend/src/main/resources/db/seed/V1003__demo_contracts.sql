-- =============================================================================
-- V1003: Демо-договоры
-- Генеральные подряды, субподряды и договоры поставки
-- =============================================================================

BEGIN;

-- =============================================================================
-- ПРОЕКТ 1: ЖК "Солнечный" (PRJ-00001)
-- =============================================================================

-- 1. Генеральный подряд с заказчиком на ЖК Солнечный
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Договор генерального подряда на строительство ЖК "Солнечный"',
    'CTR-2025-001',
    '2025-02-15'::DATE,
    NULL,
    'ООО "ДевелопМосква" (Заказчик)',
    p.id,
p.organization_id,
ct.id,
    'ACTIVE',
    400000000.00,
    20.00,
    80000000.00,
    480000000.00,
    'Авансирование 10%, ежемесячная оплата по КС-2/КС-3 в течение 15 рабочих дней',
    '2025-03-01'::DATE,
    '2027-06-30'::DATE,
    u.id,
    5.00,
    'seed'
FROM projects p, contract_types ct, users u
WHERE p.code = 'PRJ-00001'
  AND ct.code = 'GENERAL'
  AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (id) DO NOTHING;

-- 2. Субподряд на монолитные работы ЖК Солнечный
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Субподряд на монолитные работы (фундамент и каркас) — ЖК "Солнечный"',
    'CTR-2025-002',
    '2025-03-10'::DATE,
    org.id,
    'ООО "СубСтрой"',
    p.id,
p.organization_id,
ct.id,
    'ACTIVE',
    95000000.00,
    20.00,
    19000000.00,
    114000000.00,
    'Оплата по выполнению этапов, 10 рабочих дней после подписания КС-2',
    '2025-04-01'::DATE,
    '2026-08-31'::DATE,
    u.id,
    5.00,
    'seed'
FROM projects p, contract_types ct, users u, organizations org
WHERE p.code = 'PRJ-00001'
  AND ct.code = 'SUBCONTRACT'
  AND u.email = 'petrov@stroyinvest.ru'
  AND org.inn = '7702345678'
ON CONFLICT (id) DO NOTHING;

-- 3. Субподряд на электромонтаж ЖК Солнечный
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Субподряд на электромонтажные работы — ЖК "Солнечный"',
    'CTR-2025-003',
    '2025-05-20'::DATE,
    org.id,
    'ИП Кузнецов А.В. "Электромонтаж"',
    p.id,
p.organization_id,
ct.id,
    'SIGNED',
    28000000.00,
    20.00,
    5600000.00,
    33600000.00,
    'Ежемесячная оплата по факту выполнения, 15 рабочих дней',
    '2025-09-01'::DATE,
    '2027-03-31'::DATE,
    u.id,
    3.00,
    'seed'
FROM projects p, contract_types ct, users u, organizations org
WHERE p.code = 'PRJ-00001'
  AND ct.code = 'SUBCONTRACT'
  AND u.email = 'volkov@stroyinvest.ru'
  AND org.inn = '770512345678'
ON CONFLICT (id) DO NOTHING;

-- 4. Поставка бетона ЖК Солнечный
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Поставка товарного бетона и раствора — ЖК "Солнечный"',
    'CTR-2025-004',
    '2025-03-25'::DATE,
    org.id,
    'АО "БетонПром"',
    p.id,
p.organization_id,
ct.id,
    'ACTIVE',
    42000000.00,
    20.00,
    8400000.00,
    50400000.00,
    'Оплата за каждую партию в течение 10 рабочих дней после поставки',
    '2025-04-01'::DATE,
    '2026-10-31'::DATE,
    u.id,
    0.00,
    'seed'
FROM projects p, contract_types ct, users u, organizations org
WHERE p.code = 'PRJ-00001'
  AND ct.code = 'SUPPLY'
  AND u.email = 'volkov@stroyinvest.ru'
  AND org.inn = '7703456789'
ON CONFLICT (id) DO NOTHING;

-- 5. Поставка арматуры ЖК Солнечный
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Поставка арматуры и металлопроката — ЖК "Солнечный"',
    'CTR-2025-005',
    '2025-03-20'::DATE,
    org.id,
    'ООО "МеталлСнаб"',
    p.id,
p.organization_id,
ct.id,
    'ACTIVE',
    35000000.00,
    20.00,
    7000000.00,
    42000000.00,
    'Предоплата 30%, остаток в течение 5 рабочих дней после поставки',
    '2025-04-01'::DATE,
    '2026-09-30'::DATE,
    u.id,
    0.00,
    'seed'
FROM projects p, contract_types ct, users u, organizations org
WHERE p.code = 'PRJ-00001'
  AND ct.code = 'SUPPLY'
  AND u.email = 'volkov@stroyinvest.ru'
  AND org.inn = '7704567890'
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ПРОЕКТ 2: БЦ "Горизонт" (PRJ-00002)
-- =============================================================================

-- 6. Генеральный подряд на БЦ Горизонт
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Договор генерального подряда на строительство БЦ "Горизонт"',
    'CTR-2025-006',
    '2025-01-10'::DATE,
    NULL,
    'ООО "Горизонт Девелопмент" (Заказчик)',
    p.id,
p.organization_id,
ct.id,
    'ACTIVE',
    958333333.33,
    20.00,
    191666666.67,
    1150000000.00,
    'Авансирование 15%, ежемесячная оплата по КС-2/КС-3 в течение 20 рабочих дней',
    '2025-01-15'::DATE,
    '2027-12-31'::DATE,
    u.id,
    5.00,
    'seed'
FROM projects p, contract_types ct, users u
WHERE p.code = 'PRJ-00002'
  AND ct.code = 'GENERAL'
  AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (id) DO NOTHING;

-- 7. Субподряд на монолит БЦ Горизонт
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Субподряд на монолитные работы (каркас здания) — БЦ "Горизонт"',
    'CTR-2025-007',
    '2025-02-01'::DATE,
    org.id,
    'ООО "СубСтрой"',
    p.id,
p.organization_id,
ct.id,
    'ACTIVE',
    220000000.00,
    20.00,
    44000000.00,
    264000000.00,
    'Оплата по этапам работ, 15 рабочих дней после подписания КС-2',
    '2025-03-01'::DATE,
    '2027-02-28'::DATE,
    u.id,
    5.00,
    'seed'
FROM projects p, contract_types ct, users u, organizations org
WHERE p.code = 'PRJ-00002'
  AND ct.code = 'SUBCONTRACT'
  AND u.email = 'petrov@stroyinvest.ru'
  AND org.inn = '7702345678'
ON CONFLICT (id) DO NOTHING;

-- 8. Поставка бетона БЦ Горизонт
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Поставка товарного бетона — БЦ "Горизонт"',
    'CTR-2025-008',
    '2025-02-10'::DATE,
    org.id,
    'АО "БетонПром"',
    p.id,
p.organization_id,
ct.id,
    'ACTIVE',
    85000000.00,
    20.00,
    17000000.00,
    102000000.00,
    'Оплата каждой партии в течение 7 рабочих дней',
    '2025-03-01'::DATE,
    '2027-06-30'::DATE,
    u.id,
    0.00,
    'seed'
FROM projects p, contract_types ct, users u, organizations org
WHERE p.code = 'PRJ-00002'
  AND ct.code = 'SUPPLY'
  AND u.email = 'volkov@stroyinvest.ru'
  AND org.inn = '7703456789'
ON CONFLICT (id) DO NOTHING;

-- 9. Поставка металлоконструкций БЦ Горизонт
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Поставка металлоконструкций и арматуры — БЦ "Горизонт"',
    'CTR-2025-009',
    '2025-02-15'::DATE,
    org.id,
    'ООО "МеталлСнаб"',
    p.id,
p.organization_id,
ct.id,
    'ACTIVE',
    72000000.00,
    20.00,
    14400000.00,
    86400000.00,
    'Предоплата 25%, окончательный расчёт при поставке',
    '2025-03-01'::DATE,
    '2027-04-30'::DATE,
    u.id,
    0.00,
    'seed'
FROM projects p, contract_types ct, users u, organizations org
WHERE p.code = 'PRJ-00002'
  AND ct.code = 'SUPPLY'
  AND u.email = 'volkov@stroyinvest.ru'
  AND org.inn = '7704567890'
ON CONFLICT (id) DO NOTHING;

-- 10. Субподряд на электромонтаж БЦ Горизонт
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Субподряд на электромонтажные работы — БЦ "Горизонт"',
    'CTR-2025-010',
    '2025-06-01'::DATE,
    org.id,
    'ИП Кузнецов А.В. "Электромонтаж"',
    p.id,
p.organization_id,
ct.id,
    'DRAFT',
    55000000.00,
    20.00,
    11000000.00,
    66000000.00,
    'Ежемесячная оплата по факту выполнения, 20 рабочих дней',
    '2025-10-01'::DATE,
    '2027-10-31'::DATE,
    u.id,
    5.00,
    'seed'
FROM projects p, contract_types ct, users u, organizations org
WHERE p.code = 'PRJ-00002'
  AND ct.code = 'SUBCONTRACT'
  AND u.email = 'volkov@stroyinvest.ru'
  AND org.inn = '770512345678'
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- ПРОЕКТ 3: Школа №45 (PRJ-00003) — фаза планирования
-- =============================================================================

-- 11. Генеральный подряд на капремонт школы (проект договора)
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Муниципальный контракт на капремонт ГБОУ Школа №45',
    'CTR-2026-001',
    '2026-04-15'::DATE,
    NULL,
    'Департамент образования г. Москвы',
    p.id,
p.organization_id,
ct.id,
    'DRAFT',
    63333333.33,
    20.00,
    12666666.67,
    76000000.00,
    'Авансирование 30%, этапная оплата по актам КС-2/КС-3',
    '2026-06-01'::DATE,
    '2026-12-15'::DATE,
    u.id,
    5.00,
    'seed'
FROM projects p, contract_types ct, users u
WHERE p.code = 'PRJ-00003'
  AND ct.code = 'GENERAL'
  AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (id) DO NOTHING;

-- 12. Планируемый субподряд на кровельные работы школы
INSERT INTO contracts (
    id, name, number, contract_date, partner_id, partner_name,
    project_id, organization_id, type_id, status,
    amount, vat_rate, vat_amount, total_with_vat,
    payment_terms, planned_start_date, planned_end_date,
    responsible_id, retention_percent,
    created_by
)
SELECT
    uuid_generate_v4(),
    'Субподряд на кровельные работы — Школа №45',
    'CTR-2026-002',
    NULL,
    org.id,
    'ООО "СубСтрой"',
    p.id,
p.organization_id,
ct.id,
    'DRAFT',
    12000000.00,
    20.00,
    2400000.00,
    14400000.00,
    'Оплата по завершении этапов',
    '2026-06-15'::DATE,
    '2026-08-31'::DATE,
    u.id,
    5.00,
    'seed'
FROM projects p, contract_types ct, users u, organizations org
WHERE p.code = 'PRJ-00003'
  AND ct.code = 'SUBCONTRACT'
  AND u.email = 'petrov@stroyinvest.ru'
  AND org.inn = '7702345678'
ON CONFLICT (id) DO NOTHING;

COMMIT;
