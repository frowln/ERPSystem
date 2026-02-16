-- =============================================================================
-- V1006: Демо-финансовые данные
-- Коды затрат, строки бюджета, обязательства, прогнозы стоимости
-- =============================================================================

BEGIN;

-- =============================================================================
-- КОДЫ ЗАТРАТ (cost_codes) — ЖК "Солнечный" (PRJ-00001)
-- Структура CSI-подобная, адаптированная для РФ
-- =============================================================================

-- Уровень 1: Основные разделы
INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '01', 'Подготовительные работы', 'Подготовка территории, временные сооружения', 'LEVEL1', 15000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '02', 'Земляные работы', 'Разработка котлована, обратная засыпка', 'LEVEL1', 22000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '03', 'Фундаменты', 'Свайное основание, ростверки, фундаментная плита', 'LEVEL1', 45000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '04', 'Монолитный каркас', 'Колонны, стены, перекрытия, лестницы', 'LEVEL1', 120000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '05', 'Кладочные работы', 'Наружные стены, перегородки', 'LEVEL1', 38000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '06', 'Кровля', 'Плоская кровля, водоотведение', 'LEVEL1', 18000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '07', 'Фасад', 'Утепление, облицовка, витражи', 'LEVEL1', 42000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '08', 'Окна и двери', 'ПВХ окна, входные группы, противопожарные двери', 'LEVEL1', 28000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '09', 'Отделочные работы', 'Штукатурка, шпаклёвка, окраска, плитка', 'LEVEL1', 85000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '10', 'Электромонтаж', 'Силовое электроснабжение, освещение, СКС', 'LEVEL1', 35000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '11', 'Сантехника и отопление', 'ВК, отопление, теплоснабжение', 'LEVEL1', 48000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '12', 'Вентиляция и кондиционирование', 'Приточно-вытяжная вентиляция, дымоудаление', 'LEVEL1', 22000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '13', 'Лифтовое оборудование', 'Лифты, подъёмники', 'LEVEL1', 27000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '14', 'Благоустройство', 'Озеленение, дорожки, площадки, освещение', 'LEVEL1', 25000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '15', 'Наружные сети', 'Водопровод, канализация, электрика, связь', 'LEVEL1', 30000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00001' ON CONFLICT (project_id, code) DO NOTHING;

-- Уровень 2: Детализация монолитного каркаса
INSERT INTO cost_codes (id, project_id, code, name, description, parent_id, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '04.01', 'Арматурные работы', 'Вязка и установка арматурных каркасов',
       parent.id, 'LEVEL2', 42000000.00, 'seed'
FROM projects p, cost_codes parent
WHERE p.code = 'PRJ-00001' AND parent.code = '04' AND parent.project_id = p.id
ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, parent_id, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '04.02', 'Опалубочные работы', 'Монтаж/демонтаж опалубки',
       parent.id, 'LEVEL2', 28000000.00, 'seed'
FROM projects p, cost_codes parent
WHERE p.code = 'PRJ-00001' AND parent.code = '04' AND parent.project_id = p.id
ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, parent_id, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '04.03', 'Бетонирование', 'Укладка и уход за бетоном',
       parent.id, 'LEVEL2', 50000000.00, 'seed'
FROM projects p, cost_codes parent
WHERE p.code = 'PRJ-00001' AND parent.code = '04' AND parent.project_id = p.id
ON CONFLICT (project_id, code) DO NOTHING;

-- =============================================================================
-- КОДЫ ЗАТРАТ — БЦ "Горизонт" (PRJ-00002) — основные
-- =============================================================================

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '01', 'Подготовительные работы', 'Подготовка площадки, ограждение', 'LEVEL1', 28000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00002' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '02', 'Земляные работы', 'Котлован 3 уровня, водопонижение', 'LEVEL1', 55000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00002' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '03', 'Фундаменты и подземная часть', 'Сваи, ростверк, подземные уровни', 'LEVEL1', 120000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00002' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '04', 'Монолитный каркас', 'Надземная часть 25 этажей', 'LEVEL1', 280000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00002' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '05', 'Фасад и остекление', 'Вентфасад, витражи, панорамное остекление', 'LEVEL1', 250000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00002' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '06', 'Инженерные системы', 'ОВК, ВК, электрика, слаботочные', 'LEVEL1', 180000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00002' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '07', 'Отделочные работы', 'Внутренняя отделка, МОП', 'LEVEL1', 150000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00002' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '08', 'Лифтовое оборудование', 'Скоростные лифты, эскалаторы', 'LEVEL1', 72000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00002' ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO cost_codes (id, project_id, code, name, description, level, budget_amount, created_by)
SELECT uuid_generate_v4(), p.id, '09', 'Благоустройство и наружные сети', 'Прилегающая территория, подключения', 'LEVEL1', 65000000.00, 'seed'
FROM projects p WHERE p.code = 'PRJ-00002' ON CONFLICT (project_id, code) DO NOTHING;

-- =============================================================================
-- СТРОКИ БЮДЖЕТА (budget_lines) — ЖК "Солнечный"
-- =============================================================================

INSERT INTO budget_lines (id, project_id, cost_code_id, description, original_budget, approved_changes, revised_budget, committed_cost, actual_cost, forecast_final_cost, variance_amount, created_by)
SELECT uuid_generate_v4(), p.id, cc.id,
    'Подготовительные работы: расчистка, временные дороги, бытовки',
    15000000.00, 0.00, 15000000.00, 14200000.00, 13800000.00, 14500000.00, 500000.00, 'seed'
FROM projects p, cost_codes cc WHERE p.code = 'PRJ-00001' AND cc.code = '01' AND cc.project_id = p.id
ON CONFLICT DO NOTHING;

INSERT INTO budget_lines (id, project_id, cost_code_id, description, original_budget, approved_changes, revised_budget, committed_cost, actual_cost, forecast_final_cost, variance_amount, created_by)
SELECT uuid_generate_v4(), p.id, cc.id,
    'Земляные работы: котлован, вывоз грунта, обратная засыпка',
    22000000.00, 0.00, 22000000.00, 20500000.00, 18200000.00, 21000000.00, 1000000.00, 'seed'
FROM projects p, cost_codes cc WHERE p.code = 'PRJ-00001' AND cc.code = '02' AND cc.project_id = p.id
ON CONFLICT DO NOTHING;

INSERT INTO budget_lines (id, project_id, cost_code_id, description, original_budget, approved_changes, revised_budget, committed_cost, actual_cost, forecast_final_cost, variance_amount, created_by)
SELECT uuid_generate_v4(), p.id, cc.id,
    'Фундаменты: буронабивные сваи, ростверк, плита',
    45000000.00, 8500000.00, 53500000.00, 48000000.00, 35000000.00, 52000000.00, 1500000.00, 'seed'
FROM projects p, cost_codes cc WHERE p.code = 'PRJ-00001' AND cc.code = '03' AND cc.project_id = p.id
ON CONFLICT DO NOTHING;

INSERT INTO budget_lines (id, project_id, cost_code_id, description, original_budget, approved_changes, revised_budget, committed_cost, actual_cost, forecast_final_cost, variance_amount, created_by)
SELECT uuid_generate_v4(), p.id, cc.id,
    'Монолитный каркас: арматура, опалубка, бетонирование',
    120000000.00, 0.00, 120000000.00, 95000000.00, 42000000.00, 118000000.00, 2000000.00, 'seed'
FROM projects p, cost_codes cc WHERE p.code = 'PRJ-00001' AND cc.code = '04' AND cc.project_id = p.id
ON CONFLICT DO NOTHING;

INSERT INTO budget_lines (id, project_id, cost_code_id, description, original_budget, approved_changes, revised_budget, committed_cost, actual_cost, forecast_final_cost, variance_amount, created_by)
SELECT uuid_generate_v4(), p.id, cc.id,
    'Электромонтажные работы: силовые, осветительные',
    35000000.00, 0.00, 35000000.00, 28000000.00, 0.00, 35000000.00, 0.00, 'seed'
FROM projects p, cost_codes cc WHERE p.code = 'PRJ-00001' AND cc.code = '10' AND cc.project_id = p.id
ON CONFLICT DO NOTHING;

INSERT INTO budget_lines (id, project_id, cost_code_id, description, original_budget, approved_changes, revised_budget, committed_cost, actual_cost, forecast_final_cost, variance_amount, created_by)
SELECT uuid_generate_v4(), p.id, cc.id,
    'Сантехника и отопление',
    48000000.00, 0.00, 48000000.00, 0.00, 0.00, 48000000.00, 0.00, 'seed'
FROM projects p, cost_codes cc WHERE p.code = 'PRJ-00001' AND cc.code = '11' AND cc.project_id = p.id
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ОБЯЗАТЕЛЬСТВА (commitments) — ЖК "Солнечный"
-- =============================================================================

-- Обязательство 1: Субподряд на монолитные работы (APPROVED)
INSERT INTO commitments (
    id, project_id, number, title, commitment_type, status,
    vendor_id, contract_id,
    original_amount, revised_amount, approved_change_orders,
    invoiced_amount, paid_amount, retention_percent,
    start_date, end_date, cost_code_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CMT-001',
    'Субподряд: монолитные работы ООО "СубСтрой"',
    'SUBCONTRACT', 'APPROVED',
    org.id, c.id,
    95000000.00, 95000000.00, 0.00,
    32000000.00, 28000000.00, 5.00,
    '2025-04-01'::DATE, '2026-08-31'::DATE,
    cc.id, 'seed'
FROM projects p, organizations org, contracts c, cost_codes cc
WHERE p.code = 'PRJ-00001'
  AND org.inn = '7702345678'
  AND c.number = 'CTR-2025-002'
  AND cc.code = '04' AND cc.project_id = p.id
ON CONFLICT (project_id, number) DO NOTHING;

-- Обязательство 2: Поставка бетона (APPROVED)
INSERT INTO commitments (
    id, project_id, number, title, commitment_type, status,
    vendor_id, contract_id,
    original_amount, revised_amount, approved_change_orders,
    invoiced_amount, paid_amount, retention_percent,
    start_date, end_date, cost_code_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CMT-002',
    'Поставка бетона АО "БетонПром"',
    'PURCHASE_ORDER', 'APPROVED',
    org.id, c.id,
    42000000.00, 42000000.00, 0.00,
    18500000.00, 17000000.00, 0.00,
    '2025-04-01'::DATE, '2026-10-31'::DATE,
    cc.id, 'seed'
FROM projects p, organizations org, contracts c, cost_codes cc
WHERE p.code = 'PRJ-00001'
  AND org.inn = '7703456789'
  AND c.number = 'CTR-2025-004'
  AND cc.code = '04' AND cc.project_id = p.id
ON CONFLICT (project_id, number) DO NOTHING;

-- Обязательство 3: Поставка арматуры (APPROVED)
INSERT INTO commitments (
    id, project_id, number, title, commitment_type, status,
    vendor_id, contract_id,
    original_amount, revised_amount, approved_change_orders,
    invoiced_amount, paid_amount, retention_percent,
    start_date, end_date, cost_code_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CMT-003',
    'Поставка арматуры ООО "МеталлСнаб"',
    'PURCHASE_ORDER', 'APPROVED',
    org.id, c.id,
    35000000.00, 35000000.00, 0.00,
    15200000.00, 14000000.00, 0.00,
    '2025-04-01'::DATE, '2026-09-30'::DATE,
    cc.id, 'seed'
FROM projects p, organizations org, contracts c, cost_codes cc
WHERE p.code = 'PRJ-00001'
  AND org.inn = '7704567890'
  AND c.number = 'CTR-2025-005'
  AND cc.code = '04' AND cc.project_id = p.id
ON CONFLICT (project_id, number) DO NOTHING;

-- Обязательство 4: Электромонтаж (ISSUED)
INSERT INTO commitments (
    id, project_id, number, title, commitment_type, status,
    vendor_id, contract_id,
    original_amount, invoiced_amount, paid_amount, retention_percent,
    start_date, end_date, cost_code_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CMT-004',
    'Электромонтаж ИП Кузнецов',
    'SUBCONTRACT', 'ISSUED',
    org.id, c.id,
    28000000.00, 0.00, 0.00, 3.00,
    '2025-09-01'::DATE, '2027-03-31'::DATE,
    cc.id, 'seed'
FROM projects p, organizations org, contracts c, cost_codes cc
WHERE p.code = 'PRJ-00001'
  AND org.inn = '770512345678'
  AND c.number = 'CTR-2025-003'
  AND cc.code = '10' AND cc.project_id = p.id
ON CONFLICT (project_id, number) DO NOTHING;

-- Обязательство 5: DRAFT — подготовка
INSERT INTO commitments (
    id, project_id, number, title, commitment_type, status,
    original_amount, invoiced_amount, paid_amount, retention_percent,
    start_date, end_date, cost_code_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CMT-005',
    'Проект: кладочные работы (тендер не завершён)',
    'SUBCONTRACT', 'DRAFT',
    38000000.00, 0.00, 0.00, 5.00,
    '2026-03-01'::DATE, '2027-01-31'::DATE,
    cc.id, 'seed'
FROM projects p, cost_codes cc
WHERE p.code = 'PRJ-00001'
  AND cc.code = '05' AND cc.project_id = p.id
ON CONFLICT (project_id, number) DO NOTHING;

-- =============================================================================
-- ОБЯЗАТЕЛЬСТВА — БЦ "Горизонт"
-- =============================================================================

INSERT INTO commitments (
    id, project_id, number, title, commitment_type, status,
    vendor_id, contract_id,
    original_amount, revised_amount, approved_change_orders,
    invoiced_amount, paid_amount, retention_percent,
    start_date, end_date, cost_code_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CMT-001',
    'Субподряд: монолитные работы ООО "СубСтрой" — БЦ',
    'SUBCONTRACT', 'APPROVED',
    org.id, c.id,
    220000000.00, 220000000.00, 0.00,
    68000000.00, 60000000.00, 5.00,
    '2025-03-01'::DATE, '2027-02-28'::DATE,
    cc.id, 'seed'
FROM projects p, organizations org, contracts c, cost_codes cc
WHERE p.code = 'PRJ-00002'
  AND org.inn = '7702345678'
  AND c.number = 'CTR-2025-007'
  AND cc.code = '04' AND cc.project_id = p.id
ON CONFLICT (project_id, number) DO NOTHING;

INSERT INTO commitments (
    id, project_id, number, title, commitment_type, status,
    vendor_id, contract_id,
    original_amount, invoiced_amount, paid_amount, retention_percent,
    start_date, end_date, cost_code_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CMT-002',
    'Поставка бетона АО "БетонПром" — БЦ',
    'PURCHASE_ORDER', 'APPROVED',
    org.id, c.id,
    85000000.00, 35000000.00, 32000000.00, 0.00,
    '2025-03-01'::DATE, '2027-06-30'::DATE,
    cc.id, 'seed'
FROM projects p, organizations org, contracts c, cost_codes cc
WHERE p.code = 'PRJ-00002'
  AND org.inn = '7703456789'
  AND c.number = 'CTR-2025-008'
  AND cc.code = '04' AND cc.project_id = p.id
ON CONFLICT (project_id, number) DO NOTHING;

INSERT INTO commitments (
    id, project_id, number, title, commitment_type, status,
    vendor_id, contract_id,
    original_amount, invoiced_amount, paid_amount, retention_percent,
    start_date, end_date, cost_code_id, created_by
)
SELECT uuid_generate_v4(), p.id, 'CMT-003',
    'Поставка металлоконструкций ООО "МеталлСнаб" — БЦ',
    'PURCHASE_ORDER', 'APPROVED',
    org.id, c.id,
    72000000.00, 28000000.00, 25000000.00, 0.00,
    '2025-03-01'::DATE, '2027-04-30'::DATE,
    cc.id, 'seed'
FROM projects p, organizations org, contracts c, cost_codes cc
WHERE p.code = 'PRJ-00002'
  AND org.inn = '7704567890'
  AND c.number = 'CTR-2025-009'
  AND cc.code = '04' AND cc.project_id = p.id
ON CONFLICT (project_id, number) DO NOTHING;

-- =============================================================================
-- ПРОГНОЗЫ СТОИМОСТИ / EVM (cost_forecasts) — ЖК "Солнечный"
-- =============================================================================

-- Январь 2026
INSERT INTO cost_forecasts (
    id, project_id, forecast_date, forecast_method,
    budget_at_completion, earned_value, planned_value, actual_cost,
    estimate_at_completion, estimate_to_complete, variance_at_completion,
    cost_performance_index, schedule_performance_index,
    cost_variance, schedule_variance, percent_complete,
    notes, created_by
)
SELECT uuid_generate_v4(), p.id, '2026-01-31'::DATE, 'EARNED_VALUE',
    500000000.00,  -- BAC
    109000000.00,  -- EV (выполнено работ на 109M)
    120000000.00,  -- PV (план на эту дату)
    112000000.00,  -- AC (фактические затраты)
    514000000.00,  -- EAC (прогноз итоговой стоимости)
    402000000.00,  -- ETC (ещё нужно потратить)
    -14000000.00,  -- VAC (перерасход)
    0.9732,        -- CPI = EV/AC
    0.9083,        -- SPI = EV/PV
    -3000000.00,   -- CV = EV - AC
    -11000000.00,  -- SV = EV - PV
    21.80,         -- % выполнения
    'Отставание от графика на 2 недели по секции 2 (грунтовые условия). '
    || 'Небольшой перерасход по фундаментам. CPI и SPI ниже 1.0.',
    'seed'
FROM projects p WHERE p.code = 'PRJ-00001'
ON CONFLICT DO NOTHING;

-- Декабрь 2025
INSERT INTO cost_forecasts (
    id, project_id, forecast_date, forecast_method,
    budget_at_completion, earned_value, planned_value, actual_cost,
    estimate_at_completion, estimate_to_complete, variance_at_completion,
    cost_performance_index, schedule_performance_index,
    cost_variance, schedule_variance, percent_complete,
    notes, created_by
)
SELECT uuid_generate_v4(), p.id, '2025-12-31'::DATE, 'EARNED_VALUE',
    500000000.00,
    85000000.00,
    90000000.00,
    83000000.00,
    488000000.00,
    405000000.00,
    12000000.00,
    1.0241,
    0.9444,
    2000000.00,
    -5000000.00,
    17.00,
    'Незначительное отставание от графика. Затраты под контролем.',
    'seed'
FROM projects p WHERE p.code = 'PRJ-00001'
ON CONFLICT DO NOTHING;

-- БЦ Горизонт — январь 2026
INSERT INTO cost_forecasts (
    id, project_id, forecast_date, forecast_method,
    budget_at_completion, earned_value, planned_value, actual_cost,
    estimate_at_completion, estimate_to_complete, variance_at_completion,
    cost_performance_index, schedule_performance_index,
    cost_variance, schedule_variance, percent_complete,
    notes, created_by
)
SELECT uuid_generate_v4(), p.id, '2026-01-31'::DATE, 'EARNED_VALUE',
    1200000000.00,
    192000000.00,
    200000000.00,
    188000000.00,
    1175000000.00,
    987000000.00,
    25000000.00,
    1.0213,
    0.9600,
    4000000.00,
    -8000000.00,
    16.00,
    'Небольшое отставание по подземной части. Затраты в пределах бюджета.',
    'seed'
FROM projects p WHERE p.code = 'PRJ-00002'
ON CONFLICT DO NOTHING;

COMMIT;
