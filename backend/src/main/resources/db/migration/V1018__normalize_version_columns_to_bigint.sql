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
          AND c.column_name = 'version'
          AND c.data_type IN ('integer', 'smallint')
          AND t.table_type = 'BASE TABLE'
        LOOP
            EXECUTE format(
                    'ALTER TABLE %I.%I ALTER COLUMN version TYPE BIGINT USING version::bigint',
                    rec.table_schema,
                    rec.table_name
                    );
        END LOOP;
END
$$;
