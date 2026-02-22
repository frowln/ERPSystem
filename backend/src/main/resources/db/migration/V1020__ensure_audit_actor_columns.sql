DO
$$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT c.table_schema, c.table_name
        FROM information_schema.columns c
                 JOIN information_schema.tables t
                      ON t.table_schema = c.table_schema
                          AND t.table_name = c.table_name
        WHERE c.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND c.column_name = 'created_at'
          AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns c2
            WHERE c2.table_schema = c.table_schema
              AND c2.table_name = c.table_name
              AND c2.column_name = 'created_by'
        )
        LOOP
            EXECUTE format(
                    'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS created_by VARCHAR(255)',
                    rec.table_schema,
                    rec.table_name
                    );
        END LOOP;

    FOR rec IN
        SELECT c.table_schema, c.table_name
        FROM information_schema.columns c
                 JOIN information_schema.tables t
                      ON t.table_schema = c.table_schema
                          AND t.table_name = c.table_name
        WHERE c.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND c.column_name = 'updated_at'
          AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns c2
            WHERE c2.table_schema = c.table_schema
              AND c2.table_name = c.table_name
              AND c2.column_name = 'updated_by'
        )
        LOOP
            EXECUTE format(
                    'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255)',
                    rec.table_schema,
                    rec.table_name
                    );
        END LOOP;
END
$$;
