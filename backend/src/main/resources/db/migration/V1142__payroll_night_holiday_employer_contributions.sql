-- V1142: Add night_pay, holiday_pay, employer_contributions to payroll_calculations
-- night_pay:            ст.154 ТК РФ — доплата за ночное время (22:00-06:00), не менее 20%
-- holiday_pay:          ст.153 ТК РФ — доплата за работу в праздники/выходные (до двойного размера)
-- employer_contributions: НК РФ гл.34 — страховые взносы работодателя (ОПС 22% + ОМС 5.1% + ОСС 2.9%)
--   Они НЕ вычитаются из зарплаты сотрудника — это расходы работодателя сверх gross_pay.
ALTER TABLE payroll_calculations ADD COLUMN night_pay NUMERIC(18, 2) NOT NULL DEFAULT 0;
ALTER TABLE payroll_calculations ADD COLUMN holiday_pay NUMERIC(18, 2) NOT NULL DEFAULT 0;
ALTER TABLE payroll_calculations ADD COLUMN employer_contributions NUMERIC(18, 2) NOT NULL DEFAULT 0;
