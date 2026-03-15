-- P1-PRJ-4: Add CLOSEOUT status to project status lifecycle
-- Spring Boot / Hibernate uses VARCHAR for @Enumerated(EnumType.STRING) — no DB check constraint by default.
-- This migration documents the change and is a no-op for VARCHAR columns.

DO $$ BEGIN
    -- Drop any hand-crafted check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname LIKE '%projects_status%' AND contype = 'c'
    ) THEN
        ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
    END IF;
END $$;

-- Ensure the column is wide enough (VARCHAR(30) covers all new enum values)
ALTER TABLE projects
    ALTER COLUMN status TYPE VARCHAR(30);
