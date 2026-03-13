-- V1147: P0-WAR-2 — Бюджетный контроль на закупки (ФСБУ 5/2019)
-- Добавить budget_item_id в purchase_orders для проверки лимита при создании ЗаказаПоставщику
ALTER TABLE purchase_orders ADD COLUMN budget_item_id UUID;
COMMENT ON COLUMN purchase_orders.budget_item_id IS
    'FK на статью бюджета — при создании ПЗ проверяется остаток: plannedAmount - committedAmount - contractedAmount >= poTotalAmount';
