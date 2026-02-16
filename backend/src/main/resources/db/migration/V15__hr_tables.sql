-- =============================================================================
-- Sequence for employee numbers (EMP-00001, EMP-00002, etc.)
-- =============================================================================
CREATE SEQUENCE employee_number_seq START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- Employees (Сотрудники)
-- =============================================================================
CREATE TABLE employees (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID,
    first_name          VARCHAR(255) NOT NULL,
    last_name           VARCHAR(255) NOT NULL,
    middle_name         VARCHAR(255),
    full_name           VARCHAR(765),
    employee_number     VARCHAR(20) UNIQUE,
    position            VARCHAR(200),
    department_id       UUID,
    organization_id     UUID,
    hire_date           DATE NOT NULL,
    termination_date    DATE,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    phone               VARCHAR(50),
    email               VARCHAR(255),
    passport_number     VARCHAR(20),
    inn                 VARCHAR(12),
    snils               VARCHAR(14),
    hourly_rate         NUMERIC(10, 2) DEFAULT 0,
    monthly_rate        NUMERIC(12, 2) DEFAULT 0,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_employee_status CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED')),
    CONSTRAINT chk_employee_hourly_rate CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
    CONSTRAINT chk_employee_monthly_rate CHECK (monthly_rate IS NULL OR monthly_rate >= 0)
);

CREATE INDEX IF NOT EXISTS idx_employee_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_organization ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employee_active ON employees(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Employee Certificates (Сертификаты сотрудников)
-- =============================================================================
CREATE TABLE employee_certificates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    certificate_type    VARCHAR(30) NOT NULL,
    name                VARCHAR(500) NOT NULL,
    number              VARCHAR(100),
    issued_date         DATE NOT NULL,
    expiry_date         DATE,
    issued_by           VARCHAR(500),
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_cert_type CHECK (certificate_type IN (
        'SAFETY_GENERAL', 'SAFETY_HEIGHTS', 'SAFETY_ELECTRICAL', 'SAFETY_FIRE',
        'MEDICAL', 'QUALIFICATION', 'DRIVING_LICENSE', 'WELDING', 'OTHER'
    ))
);

CREATE INDEX IF NOT EXISTS idx_cert_employee ON employee_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_cert_expiry ON employee_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_cert_active ON employee_certificates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_employee_certificates_updated_at
    BEFORE UPDATE ON employee_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Crew Assignments (Назначения в бригады)
-- =============================================================================
CREATE TABLE crew_assignments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL,
    role                VARCHAR(200),
    start_date          DATE NOT NULL,
    end_date            DATE,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    hourly_rate         NUMERIC(10, 2),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_crew_hourly_rate CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
    CONSTRAINT chk_crew_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_crew_employee ON crew_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_crew_project ON crew_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_crew_active ON crew_assignments(active) WHERE active = TRUE;

CREATE TRIGGER update_crew_assignments_updated_at
    BEFORE UPDATE ON crew_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Timesheets (Табели учёта рабочего времени)
-- =============================================================================
CREATE TABLE timesheets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL,
    work_date           DATE NOT NULL,
    hours_worked        NUMERIC(4, 2) NOT NULL,
    overtime_hours      NUMERIC(4, 2) DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approved_by_id      UUID,
    notes               TEXT,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uq_ts_employee_project_date UNIQUE (employee_id, project_id, work_date),
    CONSTRAINT chk_ts_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_ts_hours_worked CHECK (hours_worked >= 0),
    CONSTRAINT chk_ts_overtime_hours CHECK (overtime_hours IS NULL OR overtime_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ts_employee ON timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_ts_project ON timesheets(project_id);
CREATE INDEX IF NOT EXISTS idx_ts_work_date ON timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_ts_status ON timesheets(status);
CREATE INDEX IF NOT EXISTS idx_ts_active ON timesheets(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_timesheets_updated_at
    BEFORE UPDATE ON timesheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
