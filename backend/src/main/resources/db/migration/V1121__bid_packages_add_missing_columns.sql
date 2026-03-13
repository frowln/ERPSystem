-- V1059 used CREATE TABLE IF NOT EXISTS which was a no-op since V55 already created bid_packages.
-- This migration adds the columns that V1059 intended but never actually created.
ALTER TABLE bid_packages ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE bid_packages ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE bid_packages ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT '';
ALTER TABLE bid_packages ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE bid_packages ADD COLUMN IF NOT EXISTS bid_due_date TIMESTAMP;
ALTER TABLE bid_packages ADD COLUMN IF NOT EXISTS scope_of_work TEXT;
ALTER TABLE bid_packages ADD COLUMN IF NOT EXISTS spec_sections TEXT;

-- Backfill organization_id from the linked opportunity where possible
UPDATE bid_packages bp
SET organization_id = o.organization_id
FROM opportunities o
WHERE bp.opportunity_id = o.id
  AND bp.organization_id IS NULL
  AND o.organization_id IS NOT NULL;
