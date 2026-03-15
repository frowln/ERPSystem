-- Add missing BaseEntity columns (created_by, updated_by, version) to tables that extend BaseEntity
-- These tables were created without the full BaseEntity column set

ALTER TABLE okei_units ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE okei_units ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE okei_units ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

ALTER TABLE ppe_norms ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE ppe_norms ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE ppe_norms ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

ALTER TABLE rotation_schedules ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE rotation_schedules ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
ALTER TABLE rotation_schedules ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
