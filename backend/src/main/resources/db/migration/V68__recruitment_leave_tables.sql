-- =============================================================================
-- V68: Recruitment & Leave Management tables
-- =============================================================================

-- =============================================================================
-- Recruitment Stages (Этапы подбора)
-- =============================================================================
CREATE TABLE recruitment_stages (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    sequence            INT NOT NULL,
    fold_state          VARCHAR(50),
    is_hired            BOOLEAN NOT NULL DEFAULT FALSE,
    requirements        TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_recruitment_stage_sequence ON recruitment_stages(sequence);
CREATE INDEX IF NOT EXISTS idx_recruitment_stage_active ON recruitment_stages(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_recruitment_stages_updated_at
    BEFORE UPDATE ON recruitment_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Job Positions (Вакансии)
-- =============================================================================
CREATE TABLE job_positions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    department_id       UUID,
    description         TEXT,
    requirements        TEXT,
    expected_employees  INT NOT NULL DEFAULT 1,
    hired_employees     INT NOT NULL DEFAULT 0,
    status              VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    deadline            DATE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_job_position_status CHECK (status IN ('OPEN', 'RECRUITMENT_IN_PROGRESS', 'CLOSED')),
    CONSTRAINT chk_job_position_expected CHECK (expected_employees >= 0),
    CONSTRAINT chk_job_position_hired CHECK (hired_employees >= 0)
);

CREATE INDEX IF NOT EXISTS idx_job_position_department ON job_positions(department_id);
CREATE INDEX IF NOT EXISTS idx_job_position_status ON job_positions(status);
CREATE INDEX IF NOT EXISTS idx_job_position_deadline ON job_positions(deadline);
CREATE INDEX IF NOT EXISTS idx_job_position_active ON job_positions(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_job_positions_updated_at
    BEFORE UPDATE ON job_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Applicants (Кандидаты)
-- =============================================================================
CREATE TABLE applicants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name        VARCHAR(255) NOT NULL,
    email               VARCHAR(255),
    phone               VARCHAR(50),
    job_position_id     UUID REFERENCES job_positions(id),
    stage_id            UUID REFERENCES recruitment_stages(id),
    source              VARCHAR(255),
    medium              VARCHAR(255),
    priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    salary              NUMERIC(12, 2),
    salary_currency     VARCHAR(10),
    availability        DATE,
    description         TEXT,
    interview_notes     TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'NEW',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_applicant_priority CHECK (priority IN ('NORMAL', 'GOOD', 'VERY_GOOD', 'EXCELLENT')),
    CONSTRAINT chk_applicant_status CHECK (status IN (
        'NEW', 'INITIAL_QUALIFICATION', 'FIRST_INTERVIEW', 'SECOND_INTERVIEW',
        'CONTRACT_PROPOSAL', 'WON', 'REFUSED'
    )),
    CONSTRAINT chk_applicant_salary CHECK (salary IS NULL OR salary >= 0)
);

CREATE INDEX IF NOT EXISTS idx_applicant_job_position ON applicants(job_position_id);
CREATE INDEX IF NOT EXISTS idx_applicant_stage ON applicants(stage_id);
CREATE INDEX IF NOT EXISTS idx_applicant_status ON applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicant_email ON applicants(email);
CREATE INDEX IF NOT EXISTS idx_applicant_active ON applicants(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_applicants_updated_at
    BEFORE UPDATE ON applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Interviews (Собеседования)
-- =============================================================================
CREATE TABLE interviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id        UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
    interviewer_id      UUID,
    scheduled_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    duration            INT NOT NULL DEFAULT 60,
    location            VARCHAR(500),
    result              VARCHAR(20),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_interview_result CHECK (result IS NULL OR result IN ('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'NO_SHOW')),
    CONSTRAINT chk_interview_duration CHECK (duration > 0)
);

CREATE INDEX IF NOT EXISTS idx_interview_applicant ON interviews(applicant_id);
CREATE INDEX IF NOT EXISTS idx_interview_interviewer ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_interview_scheduled_at ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interview_result ON interviews(result);
CREATE INDEX IF NOT EXISTS idx_interview_active ON interviews(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Leave Types (Типы отпусков)
-- =============================================================================
CREATE TABLE leave_types (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    code                VARCHAR(50) NOT NULL UNIQUE,
    color               VARCHAR(20),
    max_days            NUMERIC(5, 1),
    requires_approval   BOOLEAN NOT NULL DEFAULT TRUE,
    allow_negative      BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    validity_start      DATE,
    validity_end        DATE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_leave_type_max_days CHECK (max_days IS NULL OR max_days >= 0),
    CONSTRAINT chk_leave_type_validity CHECK (validity_end IS NULL OR validity_start IS NULL OR validity_end >= validity_start)
);

CREATE INDEX IF NOT EXISTS idx_leave_type_code ON leave_types(code);
CREATE INDEX IF NOT EXISTS idx_leave_type_active ON leave_types(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_leave_type_not_deleted ON leave_types(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_leave_types_updated_at
    BEFORE UPDATE ON leave_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Leave Requests (Запросы на отпуск)
-- =============================================================================
CREATE TABLE leave_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL,
    leave_type_id       UUID NOT NULL REFERENCES leave_types(id),
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    number_of_days      NUMERIC(5, 1) NOT NULL,
    reason              TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approver_id         UUID,
    approved_at         TIMESTAMP WITH TIME ZONE,
    refusal_reason      VARCHAR(500),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_leave_request_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REFUSED', 'CANCELLED')),
    CONSTRAINT chk_leave_request_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_leave_request_days CHECK (number_of_days > 0)
);

CREATE INDEX IF NOT EXISTS idx_leave_request_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_type ON leave_requests(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_request_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_request_approver ON leave_requests(approver_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_active ON leave_requests(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Leave Allocations (Выделение дней отпуска)
-- =============================================================================
CREATE TABLE leave_allocations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL,
    leave_type_id       UUID NOT NULL REFERENCES leave_types(id),
    allocated_days      NUMERIC(5, 1) NOT NULL DEFAULT 0,
    used_days           NUMERIC(5, 1) NOT NULL DEFAULT 0,
    remaining_days      NUMERIC(5, 1) NOT NULL DEFAULT 0,
    year                INT NOT NULL,
    notes               VARCHAR(1000),
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_leave_alloc_status CHECK (status IN ('DRAFT', 'APPROVED', 'REFUSED')),
    CONSTRAINT chk_leave_alloc_days CHECK (allocated_days >= 0),
    CONSTRAINT chk_leave_alloc_used CHECK (used_days >= 0),
    CONSTRAINT chk_leave_alloc_year CHECK (year >= 2000),
    CONSTRAINT uq_leave_alloc_employee_type_year UNIQUE (employee_id, leave_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_leave_alloc_employee ON leave_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_alloc_type ON leave_allocations(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_alloc_year ON leave_allocations(year);
CREATE INDEX IF NOT EXISTS idx_leave_alloc_status ON leave_allocations(status);
CREATE INDEX IF NOT EXISTS idx_leave_alloc_active ON leave_allocations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_leave_allocations_updated_at
    BEFORE UPDATE ON leave_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
