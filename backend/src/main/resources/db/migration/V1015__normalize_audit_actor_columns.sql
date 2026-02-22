-- =============================================================================
-- V1015: Normalize created_by / updated_by columns to VARCHAR for BaseEntity
-- =============================================================================

DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT c.table_name, c.column_name
        FROM information_schema.columns c
        JOIN information_schema.tables t
          ON t.table_schema = c.table_schema
         AND t.table_name = c.table_name
        WHERE c.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND c.column_name IN ('created_by', 'updated_by')
          AND c.udt_name = 'uuid'
    LOOP
        EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I TYPE VARCHAR(255) USING %I::text',
            rec.table_name,
            rec.column_name,
            rec.column_name
        );
    END LOOP;
END $$;
