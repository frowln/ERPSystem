DO
$$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT t.table_schema, t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns c
            WHERE c.table_schema = t.table_schema
              AND c.table_name = t.table_name
              AND c.column_name = 'version'
        )
        LOOP
            EXECUTE format(
                    'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0',
                    rec.table_schema,
                    rec.table_name
                    );
        END LOOP;
END
$$;
