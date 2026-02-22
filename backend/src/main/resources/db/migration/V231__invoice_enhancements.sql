-- =============================================================================
-- V231: Invoice enhancements — discipline mark, matching status, line linking
-- =============================================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discipline_mark VARCHAR(20);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS matching_status VARCHAR(20) DEFAULT 'UNMATCHED';

CREATE INDEX IF NOT EXISTS idx_invoice_discipline ON invoices(discipline_mark);
CREATE INDEX IF NOT EXISTS idx_invoice_matching ON invoices(matching_status);

-- Invoice lines table (if not exists from earlier migrations)
CREATE TABLE IF NOT EXISTS invoice_lines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id          UUID NOT NULL REFERENCES invoices(id),
    name                VARCHAR(500) NOT NULL,
    quantity            NUMERIC(18,4) NOT NULL DEFAULT 0,
    unit                VARCHAR(50),
    unit_price          NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    total_price         NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    vat_rate            NUMERIC(5,2) DEFAULT 20.00,
    vat_amount          NUMERIC(18,2) DEFAULT 0.00,
    budget_item_id      UUID,
    cp_item_id          UUID,
    is_selected_for_cp  BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns if table already existed
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS budget_item_id UUID;
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS cp_item_id UUID;
ALTER TABLE invoice_lines ADD COLUMN IF NOT EXISTS is_selected_for_cp BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_invoice_line_invoice ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_budget_item ON invoice_lines(budget_item_id);
