-- V1139: Widen PII columns to TEXT for encrypted storage
ALTER TABLE employees ALTER COLUMN passport_number TYPE TEXT;
ALTER TABLE employees ALTER COLUMN inn TYPE TEXT;
ALTER TABLE employees ALTER COLUMN snils TYPE TEXT;
