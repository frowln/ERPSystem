-- Widen PII columns on self_employed_workers to TEXT
-- so that AES-256-GCM encrypted values fit (Base64 output exceeds original length limits).
ALTER TABLE self_employed_workers ALTER COLUMN inn TYPE TEXT;
ALTER TABLE self_employed_workers ALTER COLUMN phone TYPE TEXT;
ALTER TABLE self_employed_workers ALTER COLUMN email TYPE TEXT;
