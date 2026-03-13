-- Payroll adjustments table for Leave→Payroll chain link
CREATE TABLE IF NOT EXISTS payroll_adjustments (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_payroll_adj_employee ON payroll_adjustments(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_adj_period ON payroll_adjustments(period_start, period_end);
