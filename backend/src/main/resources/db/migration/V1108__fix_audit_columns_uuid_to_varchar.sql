-- V1108: Fix audit columns type mismatch — BaseEntity maps created_by/updated_by as VARCHAR,
-- but several migrations defined them as UUID, causing Hibernate type conversion errors.

-- fleet_waybills
ALTER TABLE fleet_waybills
    ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::TEXT,
    ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::TEXT;

-- equipment_usage_logs
ALTER TABLE equipment_usage_logs
    ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::TEXT,
    ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::TEXT;

-- maintenance_schedule_rules
ALTER TABLE maintenance_schedule_rules
    ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::TEXT,
    ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::TEXT;

-- work_volume_entries (created_by was UUID; updated_by column was missing entirely)
ALTER TABLE work_volume_entries
    ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::TEXT;
ALTER TABLE work_volume_entries
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);
