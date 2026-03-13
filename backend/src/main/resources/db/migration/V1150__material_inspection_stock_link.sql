-- V1148: P1-SAF-6 — MaterialInspection → авто StockMovement при ACCEPTED
-- Добавить поля для привязки к материалу и складу, чтобы при приёмке авто-создавать приходный ордер
ALTER TABLE material_inspections
    ADD COLUMN IF NOT EXISTS material_id UUID,
    ADD COLUMN IF NOT EXISTS quantity NUMERIC(16, 3),
    ADD COLUMN IF NOT EXISTS destination_location_id UUID;

COMMENT ON COLUMN material_inspections.material_id IS
    'UUID материала — при result=accepted и наличии material_id+quantity авто-создаётся StockMovement(RECEIPT)';
COMMENT ON COLUMN material_inspections.quantity IS
    'Количество принятого материала для авто-создания прихода на склад';
COMMENT ON COLUMN material_inspections.destination_location_id IS
    'Склад-назначение для авто-создания приходного ордера';
