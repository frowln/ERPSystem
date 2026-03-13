-- P0-WAR-1: ФСБУ 5/2019 — партионный учёт материалов (batch tracking for weighted-average costing)
CREATE TABLE IF NOT EXISTS stock_batches (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID          NOT NULL,
    material_id       UUID          NOT NULL,
    location_id       UUID          NOT NULL,
    receipt_date      DATE          NOT NULL,
    unit_cost_price   NUMERIC(18,4) NOT NULL DEFAULT 0,
    original_qty      NUMERIC(16,3) NOT NULL DEFAULT 0,
    remaining_qty     NUMERIC(16,3) NOT NULL DEFAULT 0,
    stock_movement_id UUID,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ,
    created_by        VARCHAR(255),
    updated_by        VARCHAR(255),
    version           BIGINT,
    deleted           BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_stock_batches_org_mat_loc
    ON stock_batches(organization_id, material_id, location_id);

CREATE INDEX IF NOT EXISTS idx_stock_batches_org_mat_remaining
    ON stock_batches(organization_id, material_id, remaining_qty);

COMMENT ON TABLE stock_batches IS
    'ФСБУ 5/2019: партии материалов для метода средневзвешенной цены. '
    'Каждый приходный документ создаёт новую партию; remainingQty уменьшается при расходе.';

COMMENT ON COLUMN stock_batches.unit_cost_price IS
    'Цена единицы на дату прихода партии (NUMERIC 18,4).';
COMMENT ON COLUMN stock_batches.original_qty IS
    'Исходное количество партии на момент прихода.';
COMMENT ON COLUMN stock_batches.remaining_qty IS
    'Текущий остаток партии (уменьшается при расходе/списании).';
COMMENT ON COLUMN stock_batches.stock_movement_id IS
    'Ссылка на stock_movements.id (источник партии).';
