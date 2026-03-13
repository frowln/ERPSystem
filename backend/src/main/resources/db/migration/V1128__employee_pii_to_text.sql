-- Widen PII columns to TEXT for encrypted (Base64) storage
ALTER TABLE employees ALTER COLUMN passport_number TYPE TEXT;
ALTER TABLE employees ALTER COLUMN inn TYPE TEXT;
ALTER TABLE employees ALTER COLUMN snils TYPE TEXT;
