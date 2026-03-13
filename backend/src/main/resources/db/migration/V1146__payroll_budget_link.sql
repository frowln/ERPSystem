-- V1146: P0-4 — связь Зарплата → Бюджет ФОТ
-- Когда PayrollCalculation.status → APPROVED, gross_pay добавляется в actual_amount
-- соответствующей строки бюджета (category=LABOR).
ALTER TABLE payroll_calculations ADD COLUMN budget_id UUID;
ALTER TABLE payroll_calculations ADD CONSTRAINT fk_payroll_budget
    FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL;
CREATE INDEX idx_payroll_budget ON payroll_calculations(budget_id) WHERE budget_id IS NOT NULL;
