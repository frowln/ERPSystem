-- =============================================================================
-- V1178: Add onboarding_completed_at to users table
-- Tracks when a user completed the initial onboarding wizard.
-- =============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;
