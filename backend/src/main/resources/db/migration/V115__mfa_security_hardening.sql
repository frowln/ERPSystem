-- V115: MFA Security Hardening
-- P0-01: Fix MFA placeholder — backup codes now BCrypt-hashed, code column removed from audit

-- Rename 'code' column to 'code_type' in mfa_attempts (no longer stores plaintext codes)
ALTER TABLE mfa_attempts RENAME COLUMN code TO code_type;
ALTER TABLE mfa_attempts ALTER COLUMN code_type DROP NOT NULL;
