-- =============================================================================
-- V1004: Демо-сметные данные
-- Спецификации и сметные позиции с реалистичными ценами
-- =============================================================================

BEGIN;

-- =============================================================================
-- СПЕЦИФИКАЦИИ (Ведомости объёмов работ)
-- =============================================================================

-- Спецификация для ЖК Солнечный
INSERT INTO specifications (id, name, project_id, doc_version, is_current, status, notes, created_by)
SELECT uuid_generate_v4(), 'SPEC-00001', p.id, 1, TRUE, 'ACTIVE',
       'Основная ведомость объёмов работ для ЖК "Солнечный". Секции 1-3.',
       'seed'
FROM projects p WHERE p.code = 'PRJ-00001'
ON CONFLICT (name) DO NOTHING;

-- Спецификация для БЦ Горизонт
INSERT INTO specifications (id, name, project_id, doc_version, is_current, status, notes, created_by)
SELECT uuid_generate_v4(), 'SPEC-00002', p.id, 1, TRUE, 'ACTIVE',
       'Ведомость объёмов работ для БЦ "Горизонт". Основное здание + паркинг.',
       'seed'
FROM projects p WHERE p.code = 'PRJ-00002'
ON CONFLICT (name) DO NOTHING;

-- Спецификация для Школы №45
INSERT INTO specifications (id, name, project_id, doc_version, is_current, status, notes, created_by)
SELECT uuid_generate_v4(), 'SPEC-00003', p.id, 1, TRUE, 'DRAFT',
       'Предварительная ведомость работ по капремонту Школы №45.',
       'seed'
FROM projects p WHERE p.code = 'PRJ-00003'
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- ПОЗИЦИИ СПЕЦИФИКАЦИИ (spec_items) — ЖК Солнечный
-- Реальные строительные работы и материалы
-- =============================================================================

-- Материалы
INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 1, 'MATERIAL', 'Бетон B25 W6 F150 (фундаменты и плиты перекрытий)', 'BET-B25-W6',
       4500.000, 'м3', 31500000.00, 'ordered', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 2, 'MATERIAL', 'Арматура А500С d12-d32 (каркасы монолитных конструкций)', 'ARM-A500C',
       850.000, 'т', 42500000.00, 'ordered', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 3, 'MATERIAL', 'Кирпич керамический лицевой М150 (кладка наружных стен)', 'KIR-M150',
       1200000.000, 'шт', 18000000.00, 'in_selection', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 4, 'MATERIAL', 'Утеплитель минераловатный 100мм (фасад)', 'UTL-MW100',
       12000.000, 'м2', 7200000.00, 'in_selection', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 5, 'MATERIAL', 'Окна ПВХ двухкамерные (жилые помещения)', 'OKN-PVH-2K',
       1500.000, 'шт', 22500000.00, 'not_started', 'in_work', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

-- Работы
INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 10, 'WORK', 'Устройство буронабивных свай d600 L=12м', 'WRK-SVAI-600',
       320.000, 'шт', 16000000.00, 'not_started', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 11, 'WORK', 'Монолитные работы (фундаменты, стены, перекрытия)', 'WRK-MONO',
       28000.000, 'м3', 126000000.00, 'not_started', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 12, 'WORK', 'Кладка стен и перегородок', 'WRK-KLAD',
       18500.000, 'м2', 37000000.00, 'not_started', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 13, 'WORK', 'Электромонтажные работы (полный комплекс)', 'WRK-ELEC',
       42000.000, 'м2', 33600000.00, 'not_started', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 14, 'WORK', 'Сантехнические работы (ВК, отопление)', 'WRK-SANT',
       42000.000, 'м2', 46200000.00, 'not_started', 'in_work', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 15, 'WORK', 'Отделочные работы (штукатурка, окраска, плитка)', 'WRK-OTDL',
       42000.000, 'м2', 84000000.00, 'not_started', 'not_started', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

-- Оборудование
INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 20, 'EQUIPMENT', 'Лифты пассажирские грузоподъёмность 1000 кг', 'EQP-LIFT-1000',
       9.000, 'шт', 27000000.00, 'not_started', 'in_work', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ПОЗИЦИИ СПЕЦИФИКАЦИИ — БЦ "Горизонт" (ключевые)
-- =============================================================================

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 1, 'MATERIAL', 'Бетон B30 W8 F200 (каркас и перекрытия)', 'BET-B30-W8',
       12000.000, 'м3', 96000000.00, 'ordered', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00002'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 2, 'MATERIAL', 'Арматура А500С d16-d40 (монолитный каркас)', 'ARM-A500C-L',
       2200.000, 'т', 132000000.00, 'ordered', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00002'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 3, 'MATERIAL', 'Витражное остекление (алюм. профиль + стеклопакет)', 'OKN-VITR',
       15000.000, 'м2', 225000000.00, 'in_selection', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00002'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 10, 'WORK', 'Монолитные работы (каркас 25 этажей + 3 уровня паркинга)', 'WRK-MONO-BC',
       65000.000, 'м3', 390000000.00, 'not_started', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00002'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 11, 'WORK', 'Устройство вентилируемого фасада', 'WRK-FASAD',
       18000.000, 'м2', 162000000.00, 'not_started', 'in_work', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00002'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 12, 'WORK', 'Электромонтажные работы (силовые и слаботочные)', 'WRK-ELEC-BC',
       68000.000, 'м2', 68000000.00, 'not_started', 'approved', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00002'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 20, 'EQUIPMENT', 'Лифты скоростные грузоподъёмность 1600 кг', 'EQP-LIFT-1600',
       8.000, 'шт', 64000000.00, 'not_started', 'in_work', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00002'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ПОЗИЦИИ СПЕЦИФИКАЦИИ — Школа №45 (предварительные)
-- =============================================================================

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 1, 'WORK', 'Демонтаж и замена кровельного покрытия', 'WRK-KROV',
       2800.000, 'м2', 8400000.00, 'not_started', 'not_started', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00003'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 2, 'WORK', 'Ремонт фасада (штукатурка, утепление, окраска)', 'WRK-FASAD-SH',
       4200.000, 'м2', 16800000.00, 'not_started', 'not_started', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00003'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 3, 'WORK', 'Ремонт спортивного зала (пол, стены, потолок)', 'WRK-SPORT',
       600.000, 'м2', 4800000.00, 'not_started', 'not_started', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00003'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 4, 'WORK', 'Замена системы отопления', 'WRK-OTOP',
       1.000, 'комп', 12000000.00, 'not_started', 'not_started', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00003'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 5, 'WORK', 'Монтаж системы вентиляции', 'WRK-VENT',
       1.000, 'комп', 9000000.00, 'not_started', 'not_started', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00003'
ON CONFLICT DO NOTHING;

INSERT INTO spec_items (id, specification_id, sequence, item_type, name, product_code, quantity, unit_of_measure, planned_amount, procurement_status, estimate_status, created_by)
SELECT uuid_generate_v4(), s.id, 6, 'WORK', 'Электромонтажные работы (полная замена)', 'WRK-ELEC-SH',
       5800.000, 'м2', 14500000.00, 'not_started', 'not_started', 'seed'
FROM specifications s WHERE s.name = 'SPEC-00003'
ON CONFLICT DO NOTHING;

-- =============================================================================
-- СМЕТЫ (estimates) — привязаны к спецификациям
-- =============================================================================

INSERT INTO estimates (id, name, project_id, specification_id, status, total_amount, notes, created_by)
SELECT uuid_generate_v4(), 'Смета ЖК "Солнечный" — основные работы', p.id, s.id, 'ACTIVE', 491000000.00,
       'Локальная смета на основные СМР по объекту ЖК "Солнечный"', 'seed'
FROM projects p, specifications s
WHERE p.code = 'PRJ-00001' AND s.name = 'SPEC-00001'
ON CONFLICT DO NOTHING;

INSERT INTO estimates (id, name, project_id, specification_id, status, total_amount, notes, created_by)
SELECT uuid_generate_v4(), 'Смета БЦ "Горизонт" — основные работы', p.id, s.id, 'ACTIVE', 1137000000.00,
       'Сводная смета на СМР БЦ "Горизонт"', 'seed'
FROM projects p, specifications s
WHERE p.code = 'PRJ-00002' AND s.name = 'SPEC-00002'
ON CONFLICT DO NOTHING;

INSERT INTO estimates (id, name, project_id, specification_id, status, total_amount, notes, created_by)
SELECT uuid_generate_v4(), 'Предварительная смета — Школа №45', p.id, s.id, 'DRAFT', 65500000.00,
       'Предварительная смета для тендерной документации', 'seed'
FROM projects p, specifications s
WHERE p.code = 'PRJ-00003' AND s.name = 'SPEC-00003'
ON CONFLICT DO NOTHING;

COMMIT;
