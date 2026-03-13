-- V1130: Expand sick_leaves.diagnosis column to TEXT to accommodate encrypted (Base64) values.
-- EncryptedFieldConverter has graceful plaintext fallback, so no data migration needed.
ALTER TABLE sick_leaves ALTER COLUMN diagnosis TYPE TEXT;
