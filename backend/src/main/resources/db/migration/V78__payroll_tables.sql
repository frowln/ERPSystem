-- =============================================================================
-- Payroll Module: Шаблоны и расчёты зарплаты
-- =============================================================================

-- =============================================================================
-- Payroll Templates (Шаблоны расчёта зарплаты)
-- =============================================================================
CREATE TABLE payroll_templates (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(500) NOT NULL,
    code                    VARCHAR(50) UNIQUE,
    description             TEXT,
    type                    VARCHAR(20) NOT NULL,
    base_salary             NUMERIC(18, 2),
    hourly_rate             NUMERIC(18, 2),
    overtime_multiplier     NUMERIC(5, 2) NOT NULL DEFAULT 1.50,
    bonus_percentage        NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_rate                NUMERIC(5, 2) NOT NULL DEFAULT 13.00,
    pension_rate            NUMERIC(5, 2) NOT NULL DEFAULT 22.00,
    social_rate             NUMERIC(5, 2) NOT NULL DEFAULT 2.90,
    medical_rate            NUMERIC(5, 2) NOT NULL DEFAULT 5.10,
    currency                VARCHAR(3) NOT NULL DEFAULT 'RUB',
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    project_id              UUID,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_payroll_tpl_type CHECK (type IN ('SALARY', 'HOURLY', 'PIECEWORK', 'BONUS', 'OVERTIME')),
    CONSTRAINT chk_payroll_tpl_base_salary CHECK (base_salary IS NULL OR base_salary >= 0),
    CONSTRAINT chk_payroll_tpl_hourly_rate CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
    CONSTRAINT chk_payroll_tpl_overtime_mult CHECK (overtime_multiplier >= 1.0),
    CONSTRAINT chk_payroll_tpl_bonus_pct CHECK (bonus_percentage >= 0),
    CONSTRAINT chk_payroll_tpl_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100),
    CONSTRAINT chk_payroll_tpl_pension_rate CHECK (pension_rate >= 0 AND pension_rate <= 100),
    CONSTRAINT chk_payroll_tpl_social_rate CHECK (social_rate >= 0 AND social_rate <= 100),
    CONSTRAINT chk_payroll_tpl_medical_rate CHECK (medical_rate >= 0 AND medical_rate <= 100)
);

CREATE INDEX IF NOT EXISTS idx_payroll_tpl_project ON payroll_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_payroll_tpl_type ON payroll_templates(type);
CREATE INDEX IF NOT EXISTS idx_payroll_tpl_code ON payroll_templates(code);
CREATE INDEX IF NOT EXISTS idx_payroll_tpl_active ON payroll_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_tpl_not_deleted ON payroll_templates(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_payroll_templates_updated_at
    BEFORE UPDATE ON payroll_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Payroll Calculations (Расчёты зарплаты)
-- =============================================================================
CREATE TABLE payroll_calculations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id             UUID NOT NULL REFERENCES payroll_templates(id),
    employee_id             UUID NOT NULL,
    period_start            DATE NOT NULL,
    period_end              DATE NOT NULL,
    base_pay                NUMERIC(18, 2) NOT NULL DEFAULT 0,
    overtime_pay            NUMERIC(18, 2) NOT NULL DEFAULT 0,
    bonus_pay               NUMERIC(18, 2) NOT NULL DEFAULT 0,
    gross_pay               NUMERIC(18, 2) NOT NULL DEFAULT 0,
    tax_deduction           NUMERIC(18, 2) NOT NULL DEFAULT 0,
    pension_deduction       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    social_deduction        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    medical_deduction       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_deductions        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    net_pay                 NUMERIC(18, 2) NOT NULL DEFAULT 0,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approved_by             UUID,
    approved_at             TIMESTAMP WITH TIME ZONE,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    version                 BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT chk_payroll_calc_status CHECK (status IN ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID')),
    CONSTRAINT chk_payroll_calc_base_pay CHECK (base_pay >= 0),
    CONSTRAINT chk_payroll_calc_overtime_pay CHECK (overtime_pay >= 0),
    CONSTRAINT chk_payroll_calc_bonus_pay CHECK (bonus_pay >= 0),
    CONSTRAINT chk_payroll_calc_gross_pay CHECK (gross_pay >= 0),
    CONSTRAINT chk_payroll_calc_period CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_payroll_calc_template ON payroll_calculations(template_id);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_employee ON payroll_calculations(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_status ON payroll_calculations(status);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_period ON payroll_calculations(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_calc_not_deleted ON payroll_calculations(deleted) WHERE deleted = FALSE;

CREATE TRIGGER update_payroll_calculations_updated_at
    BEFORE UPDATE ON payroll_calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
