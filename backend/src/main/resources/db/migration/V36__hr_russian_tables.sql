-- =============================================================================
-- V36: Extended HR Russian Module Tables
-- Russian HR Documents, Crew Time, Certificates, Timesheet Integration
-- =============================================================================

-- =============================================================================
-- Staffing Table (Штатное расписание)
-- =============================================================================
CREATE TABLE staffing_table (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_name       VARCHAR(300) NOT NULL,
    department_id       UUID,
    grade               VARCHAR(50),
    salary_min          NUMERIC(14, 2) NOT NULL DEFAULT 0,
    salary_max          NUMERIC(14, 2) NOT NULL DEFAULT 0,
    headcount           INT NOT NULL DEFAULT 1,
    filled_count        INT NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    effective_date      DATE NOT NULL,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_staffing_salary CHECK (salary_min >= 0 AND salary_max >= salary_min),
    CONSTRAINT chk_staffing_headcount CHECK (headcount >= 0),
    CONSTRAINT chk_staffing_filled CHECK (filled_count >= 0 AND filled_count <= headcount)
);

CREATE INDEX IF NOT EXISTS idx_staffing_dept ON staffing_table(department_id);
CREATE INDEX IF NOT EXISTS idx_staffing_active ON staffing_table(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_staffing_table_updated_at
    BEFORE UPDATE ON staffing_table
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Employment Contracts (Трудовые договоры)
-- =============================================================================
CREATE TABLE employment_contracts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_number     VARCHAR(50) NOT NULL,
    contract_type       VARCHAR(30) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE,
    salary              NUMERIC(14, 2) NOT NULL DEFAULT 0,
    salary_type         VARCHAR(20) NOT NULL,
    position            VARCHAR(300),
    department          VARCHAR(300),
    probation_end_date  DATE,
    work_schedule       VARCHAR(200),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_contract_type CHECK (contract_type IN ('СРОЧНЫЙ', 'БЕССРОЧНЫЙ', 'ГПХ')),
    CONSTRAINT chk_salary_type CHECK (salary_type IN ('ОКЛАД', 'ЧАСОВАЯ', 'СДЕЛЬНАЯ')),
    CONSTRAINT chk_contract_status CHECK (status IN ('ACTIVE', 'TERMINATED', 'SUSPENDED', 'EXPIRED')),
    CONSTRAINT chk_contract_salary CHECK (salary >= 0),
    CONSTRAINT chk_contract_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_contract_employee ON employment_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contract_status ON employment_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_number ON employment_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contract_active ON employment_contracts(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_employment_contracts_updated_at
    BEFORE UPDATE ON employment_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Employment Orders (Кадровые приказы)
-- =============================================================================
CREATE TABLE employment_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    order_number        VARCHAR(50) NOT NULL,
    order_type          VARCHAR(30) NOT NULL,
    order_date          DATE NOT NULL,
    effective_date      DATE NOT NULL,
    reason              TEXT,
    basis               VARCHAR(500),
    signed_by_id        UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_order_type CHECK (order_type IN ('ПРИЕМ', 'УВОЛЬНЕНИЕ', 'ПЕРЕВОД', 'ОТПУСК', 'КОМАНДИРОВКА'))
);

CREATE INDEX IF NOT EXISTS idx_order_employee ON employment_orders(employee_id);
CREATE INDEX IF NOT EXISTS idx_order_type ON employment_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_order_date ON employment_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_order_active ON employment_orders(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_employment_orders_updated_at
    BEFORE UPDATE ON employment_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Vacations (Отпуска)
-- =============================================================================
CREATE TABLE vacations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id             UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    vacation_type           VARCHAR(30) NOT NULL,
    start_date              DATE NOT NULL,
    end_date                DATE NOT NULL,
    days_count              INT NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    order_id                UUID REFERENCES employment_orders(id) ON DELETE SET NULL,
    substituting_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_vacation_type CHECK (vacation_type IN ('ЕЖЕГОДНЫЙ', 'ДОПОЛНИТЕЛЬНЫЙ', 'БЕЗ_СОДЕРЖАНИЯ', 'УЧЕБНЫЙ', 'ДЕКРЕТНЫЙ')),
    CONSTRAINT chk_vacation_status CHECK (status IN ('PLANNED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_vacation_days CHECK (days_count > 0),
    CONSTRAINT chk_vacation_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_vacation_employee ON vacations(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacation_dates ON vacations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vacation_status ON vacations(status);
CREATE INDEX IF NOT EXISTS idx_vacation_active ON vacations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_vacations_updated_at
    BEFORE UPDATE ON vacations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Sick Leaves (Больничные листы)
-- =============================================================================
CREATE TABLE sick_leaves (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    sick_leave_number   VARCHAR(50),
    diagnosis           VARCHAR(500),
    is_extension        BOOLEAN NOT NULL DEFAULT FALSE,
    previous_sick_leave_id UUID REFERENCES sick_leaves(id) ON DELETE SET NULL,
    payment_amount      NUMERIC(12, 2),
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_sick_status CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
    CONSTRAINT chk_sick_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_sick_payment CHECK (payment_amount IS NULL OR payment_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sick_employee ON sick_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_sick_dates ON sick_leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_sick_status ON sick_leaves(status);
CREATE INDEX IF NOT EXISTS idx_sick_active ON sick_leaves(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_sick_leaves_updated_at
    BEFORE UPDATE ON sick_leaves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Business Trips (Командировки)
-- =============================================================================
CREATE TABLE business_trips (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    destination         VARCHAR(500) NOT NULL,
    purpose             TEXT NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    daily_allowance     NUMERIC(10, 2) DEFAULT 0,
    total_budget        NUMERIC(14, 2) DEFAULT 0,
    order_id            UUID REFERENCES employment_orders(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PLANNED',
    report_date         DATE,
    report_url          VARCHAR(1000),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_trip_status CHECK (status IN ('PLANNED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_trip_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_trip_budget CHECK (daily_allowance >= 0 AND total_budget >= 0)
);

CREATE INDEX IF NOT EXISTS idx_trip_employee ON business_trips(employee_id);
CREATE INDEX IF NOT EXISTS idx_trip_dates ON business_trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trip_status ON business_trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_active ON business_trips(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_business_trips_updated_at
    BEFORE UPDATE ON business_trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Personal Cards T-2 (Личная карточка Т-2)
-- =============================================================================
CREATE TABLE personal_cards (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    form_t2_data        JSONB NOT NULL DEFAULT '{}',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_personal_card_employee ON personal_cards(employee_id);

CREATE TRIGGER update_personal_cards_updated_at
    BEFORE UPDATE ON personal_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Military Records (Воинский учет)
-- =============================================================================
CREATE TABLE military_records (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    category            VARCHAR(50),
    rank                VARCHAR(100),
    specialty           VARCHAR(200),
    fitness_category    VARCHAR(10),
    registration_office VARCHAR(300),
    is_registered       BOOLEAN NOT NULL DEFAULT FALSE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_military_employee ON military_records(employee_id);

CREATE TRIGGER update_military_records_updated_at
    BEFORE UPDATE ON military_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Work Books (Трудовые книжки)
-- =============================================================================
CREATE TABLE work_books (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    serial_number       VARCHAR(50),
    entries             JSONB NOT NULL DEFAULT '[]',
    is_electronic       BOOLEAN NOT NULL DEFAULT FALSE,
    last_entry_date     DATE,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_workbook_employee ON work_books(employee_id);

CREATE TRIGGER update_work_books_updated_at
    BEFORE UPDATE ON work_books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Crew Assignments Extended (Назначения в бригады — расширенная версия)
-- =============================================================================
CREATE TABLE hr_crew_assignments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crew_id             UUID NOT NULL,
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role                VARCHAR(200),
    start_date          DATE NOT NULL,
    end_date            DATE,
    daily_rate          NUMERIC(10, 2) DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_hr_crew_daily_rate CHECK (daily_rate IS NULL OR daily_rate >= 0),
    CONSTRAINT chk_hr_crew_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_hr_crew_assign_crew ON hr_crew_assignments(crew_id);
CREATE INDEX IF NOT EXISTS idx_hr_crew_assign_employee ON hr_crew_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_crew_assign_active ON hr_crew_assignments(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_hr_crew_assignments_updated_at
    BEFORE UPDATE ON hr_crew_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Crew Time Reports (Табель бригады)
-- =============================================================================
CREATE TABLE crew_time_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crew_id             UUID NOT NULL,
    project_id          UUID NOT NULL,
    report_date         DATE NOT NULL,
    total_hours         NUMERIC(6, 2) NOT NULL DEFAULT 0,
    overtime_hours      NUMERIC(6, 2) NOT NULL DEFAULT 0,
    night_hours         NUMERIC(6, 2) NOT NULL DEFAULT 0,
    entries             JSONB NOT NULL DEFAULT '[]',
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approved_by_id      UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_crew_report_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_crew_report_hours CHECK (total_hours >= 0 AND overtime_hours >= 0 AND night_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_crew_report_crew ON crew_time_reports(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_report_project ON crew_time_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_crew_report_date ON crew_time_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_crew_report_active ON crew_time_reports(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_crew_time_reports_updated_at
    BEFORE UPDATE ON crew_time_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Certificate Types (Типы сертификатов — справочник)
-- =============================================================================
CREATE TABLE certificate_types (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                    VARCHAR(50) NOT NULL UNIQUE,
    name                    VARCHAR(300) NOT NULL,
    required_for_positions  JSONB NOT NULL DEFAULT '[]',
    validity_months         INT NOT NULL DEFAULT 12,
    is_required             BOOLEAN NOT NULL DEFAULT FALSE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_cert_type_validity CHECK (validity_months > 0)
);

CREATE INDEX IF NOT EXISTS idx_cert_type_code ON certificate_types(code);
CREATE INDEX IF NOT EXISTS idx_cert_type_active ON certificate_types(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_certificate_types_updated_at
    BEFORE UPDATE ON certificate_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Extended Employee Certificates (Сертификаты сотрудников — расширенная версия)
-- =============================================================================
CREATE TABLE hr_employee_certificates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    certificate_type_id UUID REFERENCES certificate_types(id) ON DELETE SET NULL,
    certificate_name    VARCHAR(500) NOT NULL,
    issuer              VARCHAR(500),
    number              VARCHAR(100),
    issued_date         DATE NOT NULL,
    expiry_date         DATE,
    file_url            VARCHAR(1000),
    status              VARCHAR(20) NOT NULL DEFAULT 'VALID',
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_hr_cert_status CHECK (status IN ('VALID', 'EXPIRING', 'EXPIRED'))
);

CREATE INDEX IF NOT EXISTS idx_hr_cert_employee ON hr_employee_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_cert_type ON hr_employee_certificates(certificate_type_id);
CREATE INDEX IF NOT EXISTS idx_hr_cert_expiry ON hr_employee_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_hr_cert_status ON hr_employee_certificates(status);
CREATE INDEX IF NOT EXISTS idx_hr_cert_active ON hr_employee_certificates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_hr_employee_certificates_updated_at
    BEFORE UPDATE ON hr_employee_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Timesheet Entries (Записи табеля — расширенная версия)
-- =============================================================================
CREATE TABLE hr_timesheet_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id          UUID NOT NULL,
    task_id             UUID,
    date                DATE NOT NULL,
    hours               NUMERIC(5, 2) NOT NULL DEFAULT 0,
    overtime_hours      NUMERIC(5, 2) NOT NULL DEFAULT 0,
    description         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approved_by_id      UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ts_entry_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_ts_entry_hours CHECK (hours >= 0 AND overtime_hours >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ts_entry_employee ON hr_timesheet_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_ts_entry_project ON hr_timesheet_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_ts_entry_date ON hr_timesheet_entries(date);
CREATE INDEX IF NOT EXISTS idx_ts_entry_status ON hr_timesheet_entries(status);
CREATE INDEX IF NOT EXISTS idx_ts_entry_active ON hr_timesheet_entries(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_hr_timesheet_entries_updated_at
    BEFORE UPDATE ON hr_timesheet_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Timesheet Periods (Периоды табеля)
-- =============================================================================
CREATE TABLE timesheet_periods (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month               INT NOT NULL,
    year                INT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    total_hours         NUMERIC(6, 2) NOT NULL DEFAULT 0,
    approved_by_id      UUID,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_ts_period_status CHECK (status IN ('OPEN', 'SUBMITTED', 'APPROVED')),
    CONSTRAINT chk_ts_period_month CHECK (month >= 1 AND month <= 12),
    CONSTRAINT chk_ts_period_year CHECK (year >= 2000),
    CONSTRAINT chk_ts_period_hours CHECK (total_hours >= 0),
    CONSTRAINT uq_ts_period_employee_month_year UNIQUE (employee_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_ts_period_employee ON timesheet_periods(employee_id);
CREATE INDEX IF NOT EXISTS idx_ts_period_status ON timesheet_periods(status);
CREATE INDEX IF NOT EXISTS idx_ts_period_active ON timesheet_periods(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_timesheet_periods_updated_at
    BEFORE UPDATE ON timesheet_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SZV-TD Reports (СЗВ-ТД отчётность)
-- =============================================================================
CREATE TABLE szv_td_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    report_date         DATE NOT NULL,
    event_type          VARCHAR(30) NOT NULL,
    event_date          DATE NOT NULL,
    position            VARCHAR(300),
    order_number        VARCHAR(50),
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    version             BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_szv_event_type CHECK (event_type IN ('ПРИЕМ', 'УВОЛЬНЕНИЕ', 'ПЕРЕВОД', 'ПЕРЕИМЕНОВАНИЕ'))
);

CREATE INDEX IF NOT EXISTS idx_szv_employee ON szv_td_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_szv_report_date ON szv_td_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_szv_event_type ON szv_td_reports(event_type);
CREATE INDEX IF NOT EXISTS idx_szv_active ON szv_td_reports(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_szv_td_reports_updated_at
    BEFORE UPDATE ON szv_td_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
