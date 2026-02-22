DO
$$
BEGIN
    IF to_regclass('public.general_journal_entries') IS NULL THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'general_journal_entries'
          AND column_name = 'entry_date'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'general_journal_entries'
          AND column_name = 'date'
    ) THEN
        EXECUTE 'ALTER TABLE public.general_journal_entries RENAME COLUMN entry_date TO date';
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_gje_date ON general_journal_entries(date);
