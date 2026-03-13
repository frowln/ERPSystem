-- V1150: P0-WAR-1 — ФСБУ 5/2019 средневзвешенная цена (weighted-average costing)
-- Добавить unit_cost_price в stock_movement_lines для хранения цены прихода,
-- используемой при пересчёте средневзвешенной стоимости остатка.
ALTER TABLE stock_movement_lines ADD COLUMN IF NOT EXISTS unit_cost_price NUMERIC(18,4) DEFAULT 0;
COMMENT ON COLUMN stock_movement_lines.unit_cost_price IS
    'Цена единицы при приходе (RECEIPT/RETURN). Используется для расчёта средневзвешенной цены по ФСБУ 5/2019.';
