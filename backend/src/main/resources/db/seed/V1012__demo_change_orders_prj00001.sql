-- =============================================================================
-- V1012: Тестовые допсоглашения для PRJ-00001 (ЖК "Солнечный")
-- Цель: показать влияние допсоглашений на финансовую аналитику проекта.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- CO-101: Доходный контракт (GENERAL) — увеличение выручки проекта
-- -----------------------------------------------------------------------------
INSERT INTO change_orders (
    id, project_id, contract_id, number, title, description,
    change_order_type, status,
    total_amount, schedule_impact_days,
    original_contract_amount, revised_contract_amount,
    approved_date, created_at, deleted, created_by
)
SELECT
    uuid_generate_v4(),
    p.id,
    c.id,
    'CO-101',
    'Доп. соглашение №1: благоустройство и фасадные доработки',
    'Увеличение объёма работ по благоустройству территории и фасадным узлам по запросу заказчика.',
    'ADDITION',
    'APPROVED',
    25000000.00,
    14,
    c.amount,
    c.amount + 25000000.00,
    '2026-01-18'::DATE,
    NOW(),
    FALSE,
    'seed'
FROM projects p
JOIN contracts c ON c.project_id = p.id
WHERE p.code = 'PRJ-00001'
  AND c.number = 'CTR-2025-001'
  AND NOT EXISTS (
      SELECT 1 FROM change_orders existing
      WHERE existing.project_id = p.id
        AND existing.number = 'CO-101'
  );

INSERT INTO change_order_items (
    id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_at, deleted, created_by
)
SELECT
    uuid_generate_v4(),
    co.id,
    'Дополнительное благоустройство дворовой территории',
    1.0000, 'компл', 15000000.00, 15000000.00, 1, NOW(), FALSE, 'seed'
FROM change_orders co
JOIN projects p ON p.id = co.project_id
WHERE p.code = 'PRJ-00001' AND co.number = 'CO-101'
ON CONFLICT DO NOTHING;

INSERT INTO change_order_items (
    id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_at, deleted, created_by
)
SELECT
    uuid_generate_v4(),
    co.id,
    'Фасадные доработки входных групп',
    1.0000, 'компл', 10000000.00, 10000000.00, 2, NOW(), FALSE, 'seed'
FROM change_orders co
JOIN projects p ON p.id = co.project_id
WHERE p.code = 'PRJ-00001' AND co.number = 'CO-101'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- CO-102: Расходный контракт (SUBCONTRACT) — увеличение себестоимости
-- -----------------------------------------------------------------------------
INSERT INTO change_orders (
    id, project_id, contract_id, number, title, description,
    change_order_type, status,
    total_amount, schedule_impact_days,
    original_contract_amount, revised_contract_amount,
    approved_date, executed_date, created_at, deleted, created_by
)
SELECT
    uuid_generate_v4(),
    p.id,
    c.id,
    'CO-102',
    'Доп. соглашение №1 к субподряду: усиление монолита',
    'Дополнительное армирование и усиление отдельных узлов монолитного каркаса.',
    'ADDITION',
    'EXECUTED',
    6500000.00,
    10,
    c.amount,
    c.amount + 6500000.00,
    '2025-11-10'::DATE,
    '2025-12-05'::DATE,
    NOW(),
    FALSE,
    'seed'
FROM projects p
JOIN contracts c ON c.project_id = p.id
WHERE p.code = 'PRJ-00001'
  AND c.number = 'CTR-2025-002'
  AND NOT EXISTS (
      SELECT 1 FROM change_orders existing
      WHERE existing.project_id = p.id
        AND existing.number = 'CO-102'
  );

INSERT INTO change_order_items (
    id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_at, deleted, created_by
)
SELECT
    uuid_generate_v4(),
    co.id,
    'Усиление каркаса в зоне технического этажа',
    1.0000, 'компл', 3800000.00, 3800000.00, 1, NOW(), FALSE, 'seed'
FROM change_orders co
JOIN projects p ON p.id = co.project_id
WHERE p.code = 'PRJ-00001' AND co.number = 'CO-102'
ON CONFLICT DO NOTHING;

INSERT INTO change_order_items (
    id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_at, deleted, created_by
)
SELECT
    uuid_generate_v4(),
    co.id,
    'Дополнительные работы по армированию узлов',
    1.0000, 'компл', 2700000.00, 2700000.00, 2, NOW(), FALSE, 'seed'
FROM change_orders co
JOIN projects p ON p.id = co.project_id
WHERE p.code = 'PRJ-00001' AND co.number = 'CO-102'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- CO-103: Расходный контракт (SUPPLY) — увеличение стоимости поставки
-- -----------------------------------------------------------------------------
INSERT INTO change_orders (
    id, project_id, contract_id, number, title, description,
    change_order_type, status,
    total_amount, schedule_impact_days,
    original_contract_amount, revised_contract_amount,
    approved_date, created_at, deleted, created_by
)
SELECT
    uuid_generate_v4(),
    p.id,
    c.id,
    'CO-103',
    'Доп. соглашение к поставке: удорожание бетона',
    'Индексация стоимости бетонной смеси и логистики по согласованию сторон.',
    'ADDITION',
    'APPROVED',
    2200000.00,
    0,
    c.amount,
    c.amount + 2200000.00,
    '2025-10-02'::DATE,
    NOW(),
    FALSE,
    'seed'
FROM projects p
JOIN contracts c ON c.project_id = p.id
WHERE p.code = 'PRJ-00001'
  AND c.number = 'CTR-2025-004'
  AND NOT EXISTS (
      SELECT 1 FROM change_orders existing
      WHERE existing.project_id = p.id
        AND existing.number = 'CO-103'
  );

INSERT INTO change_order_items (
    id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_at, deleted, created_by
)
SELECT
    uuid_generate_v4(),
    co.id,
    'Индексация стоимости бетона (класс B30/B35)',
    1.0000, 'компл', 1700000.00, 1700000.00, 1, NOW(), FALSE, 'seed'
FROM change_orders co
JOIN projects p ON p.id = co.project_id
WHERE p.code = 'PRJ-00001' AND co.number = 'CO-103'
ON CONFLICT DO NOTHING;

INSERT INTO change_order_items (
    id, change_order_id, description, quantity, unit, unit_price, total_price, sort_order, created_at, deleted, created_by
)
SELECT
    uuid_generate_v4(),
    co.id,
    'Индексация стоимости доставки и разгрузки',
    1.0000, 'компл', 500000.00, 500000.00, 2, NOW(), FALSE, 'seed'
FROM change_orders co
JOIN projects p ON p.id = co.project_id
WHERE p.code = 'PRJ-00001' AND co.number = 'CO-103'
ON CONFLICT DO NOTHING;

COMMIT;
