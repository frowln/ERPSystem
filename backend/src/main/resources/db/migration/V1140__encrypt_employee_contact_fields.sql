-- V1140: Widen employee contact fields to TEXT for AES-256-GCM encrypted storage
-- Required by 152-ФЗ — personal contact data must be protected at rest
ALTER TABLE employees ALTER COLUMN phone TYPE TEXT;
ALTER TABLE employees ALTER COLUMN email TYPE TEXT;
