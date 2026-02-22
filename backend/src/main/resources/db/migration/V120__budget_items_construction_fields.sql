-- V120: Add construction-specific fields to budget_items
-- Replaces JSON hacks in notes field with proper normalised columns

ALTER TABLE budget_items
    ADD COLUMN IF NOT EXISTS item_type          VARCHAR(20)    DEFAULT 'WORKS',
    ADD COLUMN IF NOT EXISTS is_section         BOOLEAN        NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS parent_id          UUID           REFERENCES budget_items(id),
    ADD COLUMN IF NOT EXISTS quantity           NUMERIC(18,4)  DEFAULT 1,
    ADD COLUMN IF NOT EXISTS unit               VARCHAR(20)    DEFAULT 'шт',
    ADD COLUMN IF NOT EXISTS cost_price         NUMERIC(18,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS coefficient        NUMERIC(8,4)   DEFAULT 1.0000,
    ADD COLUMN IF NOT EXISTS sale_price         NUMERIC(18,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_rate           NUMERIC(5,2)   DEFAULT 22.00,
    ADD COLUMN IF NOT EXISTS vat_amount         NUMERIC(18,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_with_vat     NUMERIC(18,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS contracted_amount  NUMERIC(18,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS act_signed_amount  NUMERIC(18,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS invoiced_amount    NUMERIC(18,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS paid_amount        NUMERIC(18,2)  DEFAULT 0,
    ADD COLUMN IF NOT EXISTS doc_status         VARCHAR(20)    DEFAULT 'PLANNED',
    ADD COLUMN IF NOT EXISTS price_source_type  VARCHAR(20)    DEFAULT 'MANUAL',
    ADD COLUMN IF NOT EXISTS price_source_id    UUID;

-- Index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_budget_item_parent ON budget_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_budget_item_doc_status ON budget_items(doc_status);
