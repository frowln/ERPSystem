DO
$$
BEGIN
    IF to_regclass('public.hidden_work_acts') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'hidden_work_acts'
              AND column_name = 'act_date'
        )
        AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'hidden_work_acts'
              AND column_name = 'date'
        ) THEN
        EXECUTE 'ALTER TABLE public.hidden_work_acts RENAME COLUMN act_date TO date';
    END IF;

    IF to_regclass('public.ks11_acceptance_acts') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'ks11_acceptance_acts'
              AND column_name = 'act_date'
        )
        AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'ks11_acceptance_acts'
              AND column_name = 'date'
        ) THEN
        EXECUTE 'ALTER TABLE public.ks11_acceptance_acts RENAME COLUMN act_date TO date';
    END IF;

    IF to_regclass('public.safety_trainings') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'safety_trainings'
              AND column_name = 'training_date'
        )
        AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'safety_trainings'
              AND column_name = 'date'
        ) THEN
        EXECUTE 'ALTER TABLE public.safety_trainings RENAME COLUMN training_date TO date';
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_hwa_date ON hidden_work_acts(date);
CREATE INDEX IF NOT EXISTS idx_ks11_date ON ks11_acceptance_acts(date);
CREATE INDEX IF NOT EXISTS idx_safety_training_date ON safety_trainings(date);
