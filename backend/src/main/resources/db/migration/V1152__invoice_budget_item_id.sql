-- P1-CHN-1: FK на строку ФМ (budget_items) для счёта
-- Закрывает разрыв Счёт↔ФМ, позволяет трассировать Invoice→BudgetItem
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS budget_item_id UUID;
