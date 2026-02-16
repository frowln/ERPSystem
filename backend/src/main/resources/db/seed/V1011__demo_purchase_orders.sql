-- =============================================================================
-- V1011: Demo purchase orders for procurement workflow
-- Creates realistic PO records + line items for primary demo tenant.
-- =============================================================================

BEGIN;

WITH ctx AS (
    SELECT
        o.id AS organization_id,
        (SELECT p.id FROM projects p WHERE p.organization_id = o.id AND p.code = 'PRJ-00001' LIMIT 1) AS project_1_id,
        (SELECT p.id FROM projects p WHERE p.organization_id = o.id AND p.code = 'PRJ-00002' LIMIT 1) AS project_2_id,
        COALESCE(
            (SELECT s.id FROM organizations s WHERE s.inn = '7703456789' LIMIT 1),
            o.id
        ) AS supplier_1_id,
        COALESCE(
            (SELECT s.id FROM organizations s WHERE s.inn = '7704567890' LIMIT 1),
            o.id
        ) AS supplier_2_id,
        (SELECT pr.id FROM purchase_requests pr WHERE pr.organization_id = o.id AND pr.deleted = FALSE ORDER BY pr.created_at ASC LIMIT 1) AS request_1_id,
        (SELECT pr.id FROM purchase_requests pr WHERE pr.organization_id = o.id AND pr.deleted = FALSE ORDER BY pr.created_at DESC LIMIT 1) AS request_2_id
    FROM organizations o
    WHERE o.inn = '7701234567'
    LIMIT 1
)
INSERT INTO purchase_orders (
    id, order_number, project_id, purchase_request_id, supplier_id,
    order_date, expected_delivery_date, actual_delivery_date,
    subtotal, vat_amount, total_amount, currency, status,
    payment_terms, delivery_address, notes, organization_id, created_by
)
SELECT
    seed.id::UUID,
    seed.order_number,
    CASE seed.project_ref WHEN 'project_1' THEN ctx.project_1_id ELSE ctx.project_2_id END,
    CASE
        WHEN seed.request_ref = 'request_1' THEN ctx.request_1_id
        WHEN seed.request_ref = 'request_2' THEN ctx.request_2_id
        ELSE NULL
    END,
    CASE seed.supplier_ref WHEN 'supplier_1' THEN ctx.supplier_1_id ELSE ctx.supplier_2_id END,
    seed.order_date,
    seed.expected_delivery_date,
    seed.actual_delivery_date,
    seed.subtotal,
    seed.vat_amount,
    seed.total_amount,
    'RUB',
    seed.status,
    seed.payment_terms,
    seed.delivery_address,
    seed.notes,
    ctx.organization_id,
    'seed'
FROM ctx
JOIN (
    VALUES
        (
            '10110000-0000-0000-0000-000000000001',
            'PO-2026-0001',
            'project_1',
            'request_1',
            'supplier_1',
            CURRENT_DATE - INTERVAL '3 days',
            CURRENT_DATE + INTERVAL '7 days',
            NULL,
            4250000.00::NUMERIC,
            850000.00::NUMERIC,
            5100000.00::NUMERIC,
            'DRAFT',
            'Оплата 50% аванс, 50% после поставки',
            'ЖК "Солнечный", секция 2, разгрузочная зона B',
            'Поставка арматуры и закладных деталей по графику работ'
        ),
        (
            '10110000-0000-0000-0000-000000000002',
            'PO-2026-0002',
            'project_2',
            'request_2',
            'supplier_2',
            CURRENT_DATE - INTERVAL '9 days',
            CURRENT_DATE + INTERVAL '2 days',
            NULL,
            3120000.00::NUMERIC,
            624000.00::NUMERIC,
            3744000.00::NUMERIC,
            'SENT',
            '100% постоплата в течение 10 дней',
            'БЦ "Горизонт", склад №1',
            'Срочная поставка материалов для фасадных работ'
        )
) AS seed(
    id,
    order_number,
    project_ref,
    request_ref,
    supplier_ref,
    order_date,
    expected_delivery_date,
    actual_delivery_date,
    subtotal,
    vat_amount,
    total_amount,
    status,
    payment_terms,
    delivery_address,
    notes
) ON TRUE
ON CONFLICT (organization_id, order_number) DO UPDATE
SET
    project_id = EXCLUDED.project_id,
    purchase_request_id = EXCLUDED.purchase_request_id,
    supplier_id = EXCLUDED.supplier_id,
    order_date = EXCLUDED.order_date,
    expected_delivery_date = EXCLUDED.expected_delivery_date,
    actual_delivery_date = EXCLUDED.actual_delivery_date,
    subtotal = EXCLUDED.subtotal,
    vat_amount = EXCLUDED.vat_amount,
    total_amount = EXCLUDED.total_amount,
    status = EXCLUDED.status,
    payment_terms = EXCLUDED.payment_terms,
    delivery_address = EXCLUDED.delivery_address,
    notes = EXCLUDED.notes,
    deleted = FALSE,
    updated_at = NOW(),
    updated_by = 'seed';

INSERT INTO purchase_order_items (
    id, purchase_order_id, material_id, material_name, unit,
    quantity, unit_price, vat_rate, total_amount, delivered_quantity, created_by
)
SELECT
    seed.id::UUID,
    po.id,
    seed.material_id::UUID,
    seed.material_name,
    seed.unit,
    seed.quantity,
    seed.unit_price,
    seed.vat_rate,
    seed.total_amount,
    seed.delivered_quantity,
    'seed'
FROM purchase_orders po
JOIN (
    VALUES
        (
            '10110000-0000-0000-0000-000000001001',
            'PO-2026-0001',
            '10110000-0000-0000-0000-000000009001',
            'Арматура A500C d16',
            'кг',
            4200.0000::NUMERIC,
            650.00::NUMERIC,
            20.00::NUMERIC,
            2730000.00::NUMERIC,
            0.0000::NUMERIC
        ),
        (
            '10110000-0000-0000-0000-000000001002',
            'PO-2026-0001',
            '10110000-0000-0000-0000-000000009002',
            'Закладные детали МЗ-12',
            'шт',
            1800.0000::NUMERIC,
            844.44::NUMERIC,
            20.00::NUMERIC,
            1520000.00::NUMERIC,
            0.0000::NUMERIC
        ),
        (
            '10110000-0000-0000-0000-000000001003',
            'PO-2026-0002',
            '10110000-0000-0000-0000-000000009003',
            'Фасадная подсистема алюминиевая',
            'компл',
            12.0000::NUMERIC,
            260000.00::NUMERIC,
            20.00::NUMERIC,
            3120000.00::NUMERIC,
            0.0000::NUMERIC
        )
) AS seed(
    id,
    order_number,
    material_id,
    material_name,
    unit,
    quantity,
    unit_price,
    vat_rate,
    total_amount,
    delivered_quantity
) ON po.order_number = seed.order_number
WHERE po.deleted = FALSE
ON CONFLICT (id) DO UPDATE
SET
    purchase_order_id = EXCLUDED.purchase_order_id,
    material_id = EXCLUDED.material_id,
    material_name = EXCLUDED.material_name,
    unit = EXCLUDED.unit,
    quantity = EXCLUDED.quantity,
    unit_price = EXCLUDED.unit_price,
    vat_rate = EXCLUDED.vat_rate,
    total_amount = EXCLUDED.total_amount,
    delivered_quantity = EXCLUDED.delivered_quantity,
    deleted = FALSE,
    updated_at = NOW(),
    updated_by = 'seed';

COMMIT;
