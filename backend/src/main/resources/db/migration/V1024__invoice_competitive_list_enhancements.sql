-- Structured payment fields for invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS prepayment_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_delay_days INTEGER DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS matched_po_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS matched_receipt_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS matching_confidence NUMERIC(5,2);

-- Extended competitive list entry fields
ALTER TABLE competitive_list_entries ADD COLUMN IF NOT EXISTS prepayment_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE competitive_list_entries ADD COLUMN IF NOT EXISTS payment_delay_days INTEGER DEFAULT 0;
ALTER TABLE competitive_list_entries ADD COLUMN IF NOT EXISTS warranty_months INTEGER;
ALTER TABLE competitive_list_entries ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);
ALTER TABLE competitive_list_entries ADD COLUMN IF NOT EXISTS rank_position INTEGER;

-- Extended competitive list fields
ALTER TABLE competitive_lists ADD COLUMN IF NOT EXISTS budget_item_id UUID;
ALTER TABLE competitive_lists ADD COLUMN IF NOT EXISTS best_price NUMERIC(18,2);
ALTER TABLE competitive_lists ADD COLUMN IF NOT EXISTS best_vendor_name VARCHAR(500);
