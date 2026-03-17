-- Add rejection fields to competitive list entries
ALTER TABLE competitive_list_entries
    ADD COLUMN IF NOT EXISTS rejection_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN competitive_list_entries.rejection_type IS 'PRICE | TECHNICAL | DELIVERY | OTHER';
COMMENT ON COLUMN competitive_list_entries.rejection_reason IS 'Free-text rejection justification';
