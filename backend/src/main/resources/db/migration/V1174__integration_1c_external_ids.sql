-- Add external_id and source columns to track 1C origin on financial entities

-- Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS source VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_invoices_external_id ON invoices(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_source ON invoices(source) WHERE source IS NOT NULL;

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_source ON payments(source) WHERE source IS NOT NULL;

-- Contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS source VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_contracts_external_id ON contracts(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_source ON contracts(source) WHERE source IS NOT NULL;

COMMENT ON COLUMN invoices.external_id IS '1C Ref_Key or other external system identifier';
COMMENT ON COLUMN invoices.source IS 'Import origin: 1C, manual, import, etc.';
COMMENT ON COLUMN payments.external_id IS '1C Ref_Key or other external system identifier';
COMMENT ON COLUMN payments.source IS 'Import origin: 1C, manual, import, etc.';
COMMENT ON COLUMN contracts.external_id IS '1C Ref_Key or other external system identifier';
COMMENT ON COLUMN contracts.source IS 'Import origin: 1C, manual, import, etc.';
