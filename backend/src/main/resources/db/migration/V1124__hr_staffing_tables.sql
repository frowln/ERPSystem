-- Staffing positions table
CREATE TABLE IF NOT EXISTS hr_staffing_positions (
    id              UUID         NOT NULL PRIMARY KEY,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(255),
    deleted         BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ,
    updated_by      VARCHAR(255),
    version         BIGINT       DEFAULT 0,
    organization_id UUID,
    department      VARCHAR(255) NOT NULL,
    position        VARCHAR(255) NOT NULL,
    grade           VARCHAR(50),
    salary_min      NUMERIC(12,2) DEFAULT 0,
    salary_max      NUMERIC(12,2) DEFAULT 0,
    filled_count    INTEGER       DEFAULT 0,
    total_count     INTEGER       DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_staffing_pos_org  ON hr_staffing_positions (organization_id);
CREATE INDEX IF NOT EXISTS idx_staffing_pos_dept ON hr_staffing_positions (department);

-- Staffing vacancies table
CREATE TABLE IF NOT EXISTS hr_staffing_vacancies (
    id                   UUID         NOT NULL PRIMARY KEY,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by           VARCHAR(255),
    deleted              BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at           TIMESTAMPTZ,
    updated_by           VARCHAR(255),
    version              BIGINT       DEFAULT 0,
    staffing_position_id UUID         NOT NULL REFERENCES hr_staffing_positions(id),
    status               VARCHAR(30)  NOT NULL DEFAULT 'OPEN'
);

CREATE INDEX IF NOT EXISTS idx_vacancy_position ON hr_staffing_vacancies (staffing_position_id);

-- Check constraint for vacancy status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hr_staffing_vacancies_status_check'
    ) THEN
        ALTER TABLE hr_staffing_vacancies
            ADD CONSTRAINT hr_staffing_vacancies_status_check
            CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED'));
    END IF;
END $$;
