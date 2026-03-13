-- V1141: Widen military record sensitive fields to TEXT for AES-256-GCM encrypted storage
-- Required by 152-ФЗ ст.10 — military records are special category personal data
ALTER TABLE military_records ALTER COLUMN category TYPE TEXT;
ALTER TABLE military_records ALTER COLUMN rank TYPE TEXT;
ALTER TABLE military_records ALTER COLUMN specialty TYPE TEXT;
ALTER TABLE military_records ALTER COLUMN fitness_category TYPE TEXT;
