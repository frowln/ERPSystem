-- Link invoices to budget items for tracking which budget position each invoice belongs to
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS budget_item_id UUID;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_budget_item;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_budget_item
    FOREIGN KEY (budget_item_id) REFERENCES budget_items(id);

CREATE INDEX IF NOT EXISTS idx_invoices_budget_item_id ON invoices(budget_item_id);
