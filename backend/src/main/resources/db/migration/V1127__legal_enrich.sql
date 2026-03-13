-- V1127: Enrich legal_cases for production-quality legal module
-- Align DB CHECK constraints with application-level enums,
-- add opposing_party, resolved_amount, and migrate old statuses.

-- 1) Drop legacy status CHECK and add comprehensive one
ALTER TABLE legal_cases DROP CONSTRAINT IF EXISTS chk_legal_case_status;
ALTER TABLE legal_cases ADD CONSTRAINT chk_legal_case_status
    CHECK (status IN ('DRAFT','OPEN','IN_PROGRESS','ON_HOLD','HEARING','RESOLVED','APPEAL','CLOSED'));

-- 2) Migrate old DB statuses to new values
UPDATE legal_cases SET status = 'DRAFT'    WHERE status = 'PREPARATION';
UPDATE legal_cases SET status = 'OPEN'     WHERE status = 'FILED';
UPDATE legal_cases SET status = 'RESOLVED' WHERE status = 'DECIDED';
UPDATE legal_cases SET status = 'RESOLVED' WHERE status = 'SETTLEMENT';
UPDATE legal_cases SET status = 'CLOSED'   WHERE status = 'WON';
UPDATE legal_cases SET status = 'CLOSED'   WHERE status = 'LOST';

-- 3) Add missing columns the frontend needs
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS opposing_party VARCHAR(300);
ALTER TABLE legal_cases ADD COLUMN IF NOT EXISTS resolved_amount NUMERIC(18,2);

-- 4) contract_legal_templates: drop restrictive CHECK so we can use frontend categories
ALTER TABLE contract_legal_templates DROP CONSTRAINT IF EXISTS chk_legal_template_type;
