-- =============================================================================
-- V118: Add per-line VAT support to KS-2 documents
-- Russian construction standard: each line has its own VAT rate (0%, 10%, 20%, or exempt)
-- =============================================================================

-- KS-2 lines: per-line VAT fields
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2);
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ks2_lines ADD COLUMN IF NOT EXISTS amount_with_vat NUMERIC(18,2) DEFAULT 0;

-- KS-2 documents: aggregate VAT totals
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS total_vat_amount NUMERIC(18,2) DEFAULT 0;
ALTER TABLE ks2_documents ADD COLUMN IF NOT EXISTS total_with_vat NUMERIC(18,2) DEFAULT 0;

-- Backfill existing lines: assume 20% VAT (standard Russian rate for construction)
UPDATE ks2_lines
SET vat_rate = 20.00,
    vat_amount = COALESCE(amount, 0) * 0.20,
    amount_with_vat = COALESCE(amount, 0) * 1.20
WHERE vat_rate IS NULL AND deleted = false;

-- Backfill existing documents: recalculate totals from lines
UPDATE ks2_documents d
SET total_vat_amount = COALESCE(sub.total_vat, 0),
    total_with_vat = COALESCE(sub.total_incl, 0)
FROM (
    SELECT ks2_id,
           SUM(COALESCE(vat_amount, 0)) AS total_vat,
           SUM(COALESCE(amount_with_vat, 0)) AS total_incl
    FROM ks2_lines
    WHERE deleted = false
    GROUP BY ks2_id
) sub
WHERE d.id = sub.ks2_id AND d.deleted = false;
