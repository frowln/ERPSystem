-- =============================================================================
-- V1007: Демо-документы
-- CDE-контейнеры, ревизии, КС-2, КС-3, М-29
-- =============================================================================

BEGIN;

-- =============================================================================
-- CDE DOCUMENT CONTAINERS — Общая среда данных (ISO 19650)
-- =============================================================================

-- АР — Архитектурный раздел
INSERT INTO cde_document_containers (
    id, project_id, document_number, title, description,
    classification, lifecycle_state, discipline, zone, level,
    originator_code, type_code, created_by
)
SELECT gen_random_uuid(), p.id, 'SI-AR-001',
    'Архитектурные планы 1-5 этажей секции 1',
    'Поэтажные планы с экспликацией помещений, ведомость отделки',
    'DESIGN', 'SHARED', 'Архитектура', 'Секция 1', 'Этажи 1-5',
    'SI', 'DWG', 'seed'
FROM projects p WHERE p.code = 'PRJ-00001'
ON CONFLICT (project_id, document_number) DO NOTHING;

INSERT INTO cde_document_containers (
    id, project_id, document_number, title, description,
    classification, lifecycle_state, discipline, zone, level,
    originator_code, type_code, created_by
)
SELECT gen_random_uuid(), p.id, 'SI-AR-002',
    'Архитектурные планы 6-17 этажей секции 1',
    'Типовые поэтажные планы верхних этажей',
    'DESIGN', 'SHARED', 'Архитектура', 'Секция 1', 'Этажи 6-17',
    'SI', 'DWG', 'seed'
FROM projects p WHERE p.code = 'PRJ-00001'
ON CONFLICT (project_id, document_number) DO NOTHING;

-- КЖ — Конструкции железобетонные
INSERT INTO cde_document_containers (
    id, project_id, document_number, title, description,
    classification, lifecycle_state, discipline, zone,
    originator_code, type_code, created_by
)
SELECT gen_random_uuid(), p.id, 'SI-KJ-001',
    'Рабочие чертежи фундаментной плиты секции 1',
    'Армирование, опалубочные чертежи, спецификация арматуры',
    'DESIGN', 'PUBLISHED', 'Конструкции ЖБ', 'Секция 1',
    'SI', 'DWG', 'seed'
FROM projects p WHERE p.code = 'PRJ-00001'
ON CONFLICT (project_id, document_number) DO NOTHING;

INSERT INTO cde_document_containers (
    id, project_id, document_number, title, description,
    classification, lifecycle_state, discipline, zone,
    originator_code, type_code, created_by
)
SELECT gen_random_uuid(), p.id, 'SI-KJ-002',
    'Рабочие чертежи монолитного каркаса 1-5 этажи',
    'Колонны, ригели, плиты перекрытий',
    'DESIGN', 'SHARED', 'Конструкции ЖБ', 'Секция 1',
    'SI', 'DWG', 'seed'
FROM projects p WHERE p.code = 'PRJ-00001'
ON CONFLICT (project_id, document_number) DO NOTHING;

-- ЭО — Электрооборудование
INSERT INTO cde_document_containers (
    id, project_id, document_number, title, description,
    classification, lifecycle_state, discipline,
    originator_code, type_code, created_by
)
SELECT gen_random_uuid(), p.id, 'SI-EO-001',
    'Проект электроснабжения ЖК "Солнечный"',
    'Однолинейная схема, расчёт нагрузок, спецификация оборудования',
    'DESIGN', 'WIP', 'Электроснабжение',
    'SI', 'PDF', 'seed'
FROM projects p WHERE p.code = 'PRJ-00001'
ON CONFLICT (project_id, document_number) DO NOTHING;

-- ПОС — Проект организации строительства
INSERT INTO cde_document_containers (
    id, project_id, document_number, title, description,
    classification, lifecycle_state, discipline,
    originator_code, type_code, created_by
)
SELECT gen_random_uuid(), p.id, 'SI-POS-001',
    'ПОС — Проект организации строительства ЖК "Солнечный"',
    'Стройгенплан, графики работ, потребность в ресурсах',
    'MANAGEMENT', 'PUBLISHED', 'Организация строительства',
    'SI', 'PDF', 'seed'
FROM projects p WHERE p.code = 'PRJ-00001'
ON CONFLICT (project_id, document_number) DO NOTHING;

-- БЦ Горизонт — основные документы
INSERT INTO cde_document_containers (
    id, project_id, document_number, title, description,
    classification, lifecycle_state, discipline,
    originator_code, type_code, created_by
)
SELECT gen_random_uuid(), p.id, 'GR-KJ-001',
    'Проект монолитного каркаса БЦ "Горизонт"',
    'Полный комплект КЖ: фундаменты, колонны, перекрытия',
    'DESIGN', 'PUBLISHED', 'Конструкции ЖБ',
    'GR', 'DWG', 'seed'
FROM projects p WHERE p.code = 'PRJ-00002'
ON CONFLICT (project_id, document_number) DO NOTHING;

INSERT INTO cde_document_containers (
    id, project_id, document_number, title, description,
    classification, lifecycle_state, discipline,
    originator_code, type_code, created_by
)
SELECT gen_random_uuid(), p.id, 'GR-AR-001',
    'Архитектурные решения БЦ "Горизонт"',
    'Планы этажей, фасады, разрезы, узлы',
    'DESIGN', 'SHARED', 'Архитектура',
    'GR', 'DWG', 'seed'
FROM projects p WHERE p.code = 'PRJ-00002'
ON CONFLICT (project_id, document_number) DO NOTHING;

INSERT INTO cde_document_containers (
    id, project_id, document_number, title, description,
    classification, lifecycle_state, discipline,
    originator_code, type_code, created_by
)
SELECT gen_random_uuid(), p.id, 'GR-FASAD-001',
    'Проект вентилируемого фасада БЦ "Горизонт"',
    'Узлы крепления, спецификация систем, теплотехнический расчёт',
    'DESIGN', 'WIP', 'Фасадные системы',
    'GR', 'PDF', 'seed'
FROM projects p WHERE p.code = 'PRJ-00002'
ON CONFLICT (project_id, document_number) DO NOTHING;

-- =============================================================================
-- CDE DOCUMENT REVISIONS
-- =============================================================================

-- Ревизии для КЖ-001 (фундаментная плита) — опубликовано
INSERT INTO cde_document_revisions (
    id, document_container_id, revision_number, revision_status,
    description, file_name, file_size, mime_type,
    uploaded_by_id, uploaded_at, approved_by_id, approved_at, created_by
)
SELECT gen_random_uuid(), dc.id, 'P01', 'SUPERSEDED',
    'Первичный выпуск', 'SI-KJ-001_P01.dwg', 4500000, 'application/acad',
    eng.id, NOW() - INTERVAL '90 days', pm.id, NOW() - INTERVAL '88 days', 'seed'
FROM cde_document_containers dc, users eng, users pm
WHERE dc.document_number = 'SI-KJ-001'
  AND dc.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00001')
  AND eng.email = 'novikova@stroyinvest.ru'
  AND pm.email = 'petrov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

INSERT INTO cde_document_revisions (
    id, document_container_id, revision_number, revision_status,
    description, file_name, file_size, mime_type,
    uploaded_by_id, uploaded_at, approved_by_id, approved_at, created_by
)
SELECT gen_random_uuid(), dc.id, 'P02', 'CURRENT',
    'Корректировка по замечаниям авторского надзора. Доп. армирование узлов сопряжения.',
    'SI-KJ-001_P02.dwg', 4800000, 'application/acad',
    eng.id, NOW() - INTERVAL '45 days', pm.id, NOW() - INTERVAL '43 days', 'seed'
FROM cde_document_containers dc, users eng, users pm
WHERE dc.document_number = 'SI-KJ-001'
  AND dc.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00001')
  AND eng.email = 'novikova@stroyinvest.ru'
  AND pm.email = 'petrov@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- Ревизия для ПОС
INSERT INTO cde_document_revisions (
    id, document_container_id, revision_number, revision_status,
    description, file_name, file_size, mime_type,
    uploaded_by_id, uploaded_at, created_by
)
SELECT gen_random_uuid(), dc.id, 'P01', 'CURRENT',
    'Утверждённый ПОС', 'SI-POS-001_P01.pdf', 12000000, 'application/pdf',
    eng.id, NOW() - INTERVAL '120 days', 'seed'
FROM cde_document_containers dc, users eng
WHERE dc.document_number = 'SI-POS-001'
  AND dc.project_id = (SELECT id FROM projects WHERE code = 'PRJ-00001')
  AND eng.email = 'novikova@stroyinvest.ru'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- КС-2 — Акты выполненных работ
-- =============================================================================

-- КС-2 №1 — ЖК Солнечный, земляные работы (SIGNED)
INSERT INTO ks2_documents (
    id, number, document_date, name, project_id, contract_id,
    status, total_amount, notes, created_by
)
SELECT uuid_generate_v4(), 'КС2-001', '2025-06-30'::DATE,
    'Акт КС-2 №1: Земляные работы, разработка котлована секций 1-2',
    p.id, c.id,
    'SIGNED', 18200000.00,
    'Земляные работы полностью завершены для секций 1 и 2', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00001' AND c.number = 'CTR-2025-001'
ON CONFLICT DO NOTHING;

-- КС-2 №2 — ЖК Солнечный, фундаменты секция 1 (SIGNED)
INSERT INTO ks2_documents (
    id, number, document_date, name, project_id, contract_id,
    status, total_amount, notes, created_by
)
SELECT uuid_generate_v4(), 'КС2-002', '2025-09-30'::DATE,
    'Акт КС-2 №2: Свайное основание и ростверк секции 1',
    p.id, c.id,
    'SIGNED', 22000000.00,
    'Буронабивные сваи (160 шт), ростверк секции 1', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00001' AND c.number = 'CTR-2025-001'
ON CONFLICT DO NOTHING;

-- КС-2 №3 — ЖК Солнечный, монолит (SUBMITTED)
INSERT INTO ks2_documents (
    id, number, document_date, name, project_id, contract_id,
    status, total_amount, notes, created_by
)
SELECT uuid_generate_v4(), 'КС2-003', '2026-01-31'::DATE,
    'Акт КС-2 №3: Монолитные работы 1-5 этажей секции 1',
    p.id, c.id,
    'SUBMITTED', 32000000.00,
    'Монолитный каркас: колонны, стены, перекрытия, лестницы 1-5 этажей', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00001' AND c.number = 'CTR-2025-002'
ON CONFLICT DO NOTHING;

-- КС-2 №4 — БЦ Горизонт, подземная часть (SIGNED)
INSERT INTO ks2_documents (
    id, number, document_date, name, project_id, contract_id,
    status, total_amount, notes, created_by
)
SELECT uuid_generate_v4(), 'КС2-004', '2025-12-31'::DATE,
    'Акт КС-2 №1: Подземная часть (паркинг -1, -2, -3 уровни)',
    p.id, c.id,
    'SIGNED', 68000000.00,
    'Монолитные работы трёх уровней подземного паркинга', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00002' AND c.number = 'CTR-2025-007'
ON CONFLICT DO NOTHING;

-- КС-2 №5 — БЦ Горизонт, 1-5 этажи (DRAFT)
INSERT INTO ks2_documents (
    id, number, document_date, name, project_id, contract_id,
    status, total_amount, notes, created_by
)
SELECT uuid_generate_v4(), 'КС2-005', '2026-02-28'::DATE,
    'Акт КС-2 №2: Монолитный каркас 1-5 этажей',
    p.id, c.id,
    'DRAFT', 45000000.00,
    'Черновик — работы в процессе', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00002' AND c.number = 'CTR-2025-007'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- КС-2 LINES (строки актов)
-- =============================================================================

-- Строки КС2-001 (земляные работы)
INSERT INTO ks2_lines (id, ks2_id, sequence, name, quantity, unit_price, amount, unit_of_measure, created_by)
SELECT uuid_generate_v4(), ks.id, 1,
    'Разработка грунта экскаваторами с погрузкой на автосамосвалы',
    15000.000, 850.00, 12750000.00, 'м3', 'seed'
FROM ks2_documents ks WHERE ks.number = 'КС2-001'
ON CONFLICT DO NOTHING;

INSERT INTO ks2_lines (id, ks2_id, sequence, name, quantity, unit_price, amount, unit_of_measure, created_by)
SELECT uuid_generate_v4(), ks.id, 2,
    'Транспортировка грунта автосамосвалами до 15 км',
    15000.000, 280.00, 4200000.00, 'м3', 'seed'
FROM ks2_documents ks WHERE ks.number = 'КС2-001'
ON CONFLICT DO NOTHING;

INSERT INTO ks2_lines (id, ks2_id, sequence, name, quantity, unit_price, amount, unit_of_measure, created_by)
SELECT uuid_generate_v4(), ks.id, 3,
    'Устройство песчаной подготовки h=300мм',
    2500.000, 500.00, 1250000.00, 'м2', 'seed'
FROM ks2_documents ks WHERE ks.number = 'КС2-001'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- КС-3 — Справки о стоимости выполненных работ
-- =============================================================================

-- КС-3 №1 — ЖК Солнечный, 2 квартал 2025 (SIGNED)
INSERT INTO ks3_documents (
    id, number, document_date, name, period_from, period_to,
    project_id, contract_id, status,
    total_amount, retention_percent, retention_amount, net_amount,
    notes, created_by
)
SELECT uuid_generate_v4(), 'КС3-001', '2025-07-05'::DATE,
    'Справка КС-3 №1 за 2 кв. 2025',
    '2025-04-01'::DATE, '2025-06-30'::DATE,
    p.id, c.id, 'SIGNED',
    18200000.00, 5.00, 910000.00, 17290000.00,
    'Земляные работы, расчистка территории', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00001' AND c.number = 'CTR-2025-001'
ON CONFLICT DO NOTHING;

-- КС-3 №2 — ЖК Солнечный, 3 квартал 2025 (SIGNED)
INSERT INTO ks3_documents (
    id, number, document_date, name, period_from, period_to,
    project_id, contract_id, status,
    total_amount, retention_percent, retention_amount, net_amount,
    notes, created_by
)
SELECT uuid_generate_v4(), 'КС3-002', '2025-10-05'::DATE,
    'Справка КС-3 №2 за 3 кв. 2025',
    '2025-07-01'::DATE, '2025-09-30'::DATE,
    p.id, c.id, 'SIGNED',
    22000000.00, 5.00, 1100000.00, 20900000.00,
    'Свайное основание, ростверк секции 1', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00001' AND c.number = 'CTR-2025-001'
ON CONFLICT DO NOTHING;

-- КС-3 №3 — ЖК Солнечный, январь 2026 (SUBMITTED)
INSERT INTO ks3_documents (
    id, number, document_date, name, period_from, period_to,
    project_id, contract_id, status,
    total_amount, retention_percent, retention_amount, net_amount,
    notes, created_by
)
SELECT uuid_generate_v4(), 'КС3-003', '2026-02-05'::DATE,
    'Справка КС-3 №3 за январь 2026',
    '2026-01-01'::DATE, '2026-01-31'::DATE,
    p.id, c.id, 'SUBMITTED',
    32000000.00, 5.00, 1600000.00, 30400000.00,
    'Монолитные работы 1-5 этажей секции 1', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00001' AND c.number = 'CTR-2025-001'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- М-29 — Отчёты о расходе материалов
-- =============================================================================

-- М-29 №1 — бетон за декабрь 2025
INSERT INTO m29_documents (
    id, name, document_date, project_id, contract_id, status, notes, created_by
)
SELECT uuid_generate_v4(), 'М-29-00001', '2025-12-31'::DATE,
    p.id, c.id, 'APPROVED',
    'Отчёт о расходе бетона за декабрь 2025. Секция 1, этажи 3-5.', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00001' AND c.number = 'CTR-2025-004'
ON CONFLICT (name) DO NOTHING;

-- М-29 №2 — арматура за декабрь 2025
INSERT INTO m29_documents (
    id, name, document_date, project_id, contract_id, status, notes, created_by
)
SELECT uuid_generate_v4(), 'М-29-00002', '2025-12-31'::DATE,
    p.id, c.id, 'VERIFIED',
    'Отчёт о расходе арматуры за декабрь 2025. Секция 1, перекрытия.', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00001' AND c.number = 'CTR-2025-005'
ON CONFLICT (name) DO NOTHING;

-- М-29 №3 — бетон за январь 2026
INSERT INTO m29_documents (
    id, name, document_date, project_id, contract_id, status, notes, created_by
)
SELECT uuid_generate_v4(), 'М-29-00003', '2026-01-31'::DATE,
    p.id, c.id, 'CONFIRMED',
    'Отчёт о расходе бетона за январь 2026. Секция 1, этажи 5-7.', 'seed'
FROM projects p, contracts c
WHERE p.code = 'PRJ-00001' AND c.number = 'CTR-2025-004'
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- М-29 LINES (строки отчётов)
-- =============================================================================

-- Строки М-29-00001 (бетон)
INSERT INTO m29_lines (id, m29_id, sequence, name, planned_quantity, actual_quantity, unit_of_measure, variance, notes, created_by)
SELECT uuid_generate_v4(), m.id, 1,
    'Бетон B25 W6 F150 для перекрытий',
    280.000, 285.500, 'м3', 5.500,
    'Перерасход 2% — компенсация потерь при укладке в зимних условиях', 'seed'
FROM m29_documents m WHERE m.name = 'М-29-00001'
ON CONFLICT DO NOTHING;

INSERT INTO m29_lines (id, m29_id, sequence, name, planned_quantity, actual_quantity, unit_of_measure, variance, notes, created_by)
SELECT uuid_generate_v4(), m.id, 2,
    'Бетон B25 W6 F150 для стен',
    180.000, 176.200, 'м3', -3.800,
    'Экономия за счёт точной опалубки', 'seed'
FROM m29_documents m WHERE m.name = 'М-29-00001'
ON CONFLICT DO NOTHING;

INSERT INTO m29_lines (id, m29_id, sequence, name, planned_quantity, actual_quantity, unit_of_measure, variance, notes, created_by)
SELECT uuid_generate_v4(), m.id, 3,
    'Раствор М200 для заделки стыков',
    12.000, 13.500, 'м3', 1.500,
    'Дополнительный расход на заделку технологических отверстий', 'seed'
FROM m29_documents m WHERE m.name = 'М-29-00001'
ON CONFLICT DO NOTHING;

-- Строки М-29-00002 (арматура)
INSERT INTO m29_lines (id, m29_id, sequence, name, planned_quantity, actual_quantity, unit_of_measure, variance, notes, created_by)
SELECT uuid_generate_v4(), m.id, 1,
    'Арматура А500С d12',
    8.500, 8.350, 'т', -0.150,
    'Экономия за счёт оптимизации нахлёстов', 'seed'
FROM m29_documents m WHERE m.name = 'М-29-00002'
ON CONFLICT DO NOTHING;

INSERT INTO m29_lines (id, m29_id, sequence, name, planned_quantity, actual_quantity, unit_of_measure, variance, notes, created_by)
SELECT uuid_generate_v4(), m.id, 2,
    'Арматура А500С d16',
    15.200, 15.400, 'т', 0.200,
    'Незначительный перерасход', 'seed'
FROM m29_documents m WHERE m.name = 'М-29-00002'
ON CONFLICT DO NOTHING;

INSERT INTO m29_lines (id, m29_id, sequence, name, planned_quantity, actual_quantity, unit_of_measure, variance, notes, created_by)
SELECT uuid_generate_v4(), m.id, 3,
    'Арматура А500С d25',
    12.000, 12.100, 'т', 0.100,
    'В пределах нормы', 'seed'
FROM m29_documents m WHERE m.name = 'М-29-00002'
ON CONFLICT DO NOTHING;

INSERT INTO m29_lines (id, m29_id, sequence, name, planned_quantity, actual_quantity, unit_of_measure, variance, notes, created_by)
SELECT uuid_generate_v4(), m.id, 4,
    'Проволока вязальная d1.2',
    0.450, 0.480, 'т', 0.030,
    'Норма расхода', 'seed'
FROM m29_documents m WHERE m.name = 'М-29-00002'
ON CONFLICT DO NOTHING;

COMMIT;
