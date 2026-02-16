-- =============================================================================
-- V1002: Демо-проекты
-- Три реалистичных строительных проекта в разных стадиях
-- =============================================================================

BEGIN;

-- =============================================================================
-- Проект 1: ЖК "Солнечный" — жилой комплекс, активная фаза строительства
-- Бюджет ~500 млн руб., генподряд
-- =============================================================================
INSERT INTO projects (
    id, code, name, description, status,
    organization_id, manager_id,
    planned_start_date, planned_end_date, actual_start_date,
    address, city, region, latitude, longitude,
    budget_amount, contract_amount,
    type, category, priority,
    created_by
)
SELECT
    uuid_generate_v4(),
    'PRJ-00001',
    'ЖК "Солнечный"',
    'Строительство жилого комплекса из 3 секций (17 этажей). '
    || 'Подземный паркинг на 200 м/м. Общая площадь 42 000 м2. '
    || 'Благоустройство территории, детская площадка.',
    'IN_PROGRESS',
    o.id,
    u.id,
    '2025-03-01'::DATE,
    '2027-06-30'::DATE,
    '2025-03-15'::DATE,
    'г. Москва, р-н Митино, ул. Новая, вл. 12-14',
    'Москва',
    'Московская область',
    55.8453000,
    37.3621000,
    500000000.00,
    480000000.00,
    'RESIDENTIAL',
    'Жилищное строительство',
    'HIGH',
    'seed'
FROM organizations o, users u
WHERE o.inn = '7701234567' AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- Проект 2: БЦ "Горизонт" — бизнес-центр класса A, активная фаза
-- Бюджет ~1.2 млрд руб.
-- =============================================================================
INSERT INTO projects (
    id, code, name, description, status,
    organization_id, manager_id,
    planned_start_date, planned_end_date, actual_start_date,
    address, city, region, latitude, longitude,
    budget_amount, contract_amount,
    type, category, priority,
    created_by
)
SELECT
    uuid_generate_v4(),
    'PRJ-00002',
    'БЦ "Горизонт"',
    'Строительство бизнес-центра класса A (25 этажей). '
    || 'Подземный паркинг 3 уровня на 450 м/м. Общая площадь 68 000 м2. '
    || 'Вентилируемый фасад, панорамное остекление.',
    'IN_PROGRESS',
    o.id,
    u.id,
    '2025-01-15'::DATE,
    '2027-12-31'::DATE,
    '2025-02-01'::DATE,
    'г. Москва, Пресненская наб., вл. 8',
    'Москва',
    'Московская область',
    55.7494000,
    37.5365000,
    1200000000.00,
    1150000000.00,
    'COMMERCIAL',
    'Коммерческое строительство',
    'CRITICAL',
    'seed'
FROM organizations o, users u
WHERE o.inn = '7701234567' AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- Проект 3: Школа №45 — капитальный ремонт школы, фаза планирования
-- Бюджет ~80 млн руб., муниципальный заказ
-- =============================================================================
INSERT INTO projects (
    id, code, name, description, status,
    organization_id, manager_id,
    planned_start_date, planned_end_date,
    address, city, region, latitude, longitude,
    budget_amount, contract_amount,
    type, category, priority,
    created_by
)
SELECT
    uuid_generate_v4(),
    'PRJ-00003',
    'Капремонт школы №45',
    'Капитальный ремонт здания ГБОУ Школа №45. '
    || 'Замена кровли, фасадные работы, ремонт спортзала, '
    || 'модернизация систем отопления и вентиляции, электрика.',
    'PLANNING',
    o.id,
    u.id,
    '2026-06-01'::DATE,
    '2026-12-15'::DATE,
    'г. Москва, р-н Южное Бутово, ул. Академика Понтрягина, д. 21',
    'Москва',
    'Московская область',
    55.5432000,
    37.5298000,
    80000000.00,
    76000000.00,
    'RENOVATION',
    'Реконструкция и ремонт',
    'NORMAL',
    'seed'
FROM organizations o, users u
WHERE o.inn = '7701234567' AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- Участники проектов (project_members)
-- =============================================================================

-- ЖК Солнечный — полная команда
INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'MANAGER'
FROM projects p, users u WHERE p.code = 'PRJ-00001' AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'FOREMAN'
FROM projects p, users u WHERE p.code = 'PRJ-00001' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'ENGINEER'
FROM projects p, users u WHERE p.code = 'PRJ-00001' AND u.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'SUPPLY_MANAGER'
FROM projects p, users u WHERE p.code = 'PRJ-00001' AND u.email = 'volkov@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'SAFETY_OFFICER'
FROM projects p, users u WHERE p.code = 'PRJ-00001' AND u.email = 'morozova@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'ACCOUNTANT'
FROM projects p, users u WHERE p.code = 'PRJ-00001' AND u.email = 'kozlova@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

-- БЦ Горизонт — полная команда
INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'MANAGER'
FROM projects p, users u WHERE p.code = 'PRJ-00002' AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'FOREMAN'
FROM projects p, users u WHERE p.code = 'PRJ-00002' AND u.email = 'sidorov@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'ENGINEER'
FROM projects p, users u WHERE p.code = 'PRJ-00002' AND u.email = 'novikova@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'SUPPLY_MANAGER'
FROM projects p, users u WHERE p.code = 'PRJ-00002' AND u.email = 'volkov@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'SAFETY_OFFICER'
FROM projects p, users u WHERE p.code = 'PRJ-00002' AND u.email = 'morozova@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'ACCOUNTANT'
FROM projects p, users u WHERE p.code = 'PRJ-00002' AND u.email = 'kozlova@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

-- Школа №45 — пока только менеджер и инженер (фаза планирования)
INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'MANAGER'
FROM projects p, users u WHERE p.code = 'PRJ-00003' AND u.email = 'petrov@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

INSERT INTO project_members (id, project_id, user_id, role)
SELECT uuid_generate_v4(), p.id, u.id, 'ENGINEER'
FROM projects p, users u WHERE p.code = 'PRJ-00003' AND u.email = 'sokolov@stroyinvest.ru'
ON CONFLICT (project_id, user_id, role) DO NOTHING;

COMMIT;
