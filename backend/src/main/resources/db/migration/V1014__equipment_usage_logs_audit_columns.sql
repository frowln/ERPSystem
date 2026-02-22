-- =============================================================================
-- V1014: Align equipment_usage_logs audit columns with BaseEntity (VARCHAR)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'equipment_usage_logs'
          AND column_name = 'created_by'
          AND udt_name = 'uuid'
    ) THEN
        ALTER TABLE equipment_usage_logs
            ALTER COLUMN created_by TYPE VARCHAR(255)
            USING created_by::text;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'equipment_usage_logs'
          AND column_name = 'updated_by'
          AND udt_name = 'uuid'
    ) THEN
        ALTER TABLE equipment_usage_logs
            ALTER COLUMN updated_by TYPE VARCHAR(255)
            USING updated_by::text;
    END IF;
END $$;
