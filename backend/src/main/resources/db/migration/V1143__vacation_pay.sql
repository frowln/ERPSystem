-- V1143: Add vacation pay columns to vacations table
-- ст.139 ТК РФ: средний дневной заработок = заработок за 12 мес / (12 × 29.3)
-- Отпускные = средний дневной заработок × количество дней отпуска
ALTER TABLE vacations ADD COLUMN annual_earnings NUMERIC(18, 2);
ALTER TABLE vacations ADD COLUMN average_daily_earnings NUMERIC(18, 4);
ALTER TABLE vacations ADD COLUMN vacation_pay NUMERIC(18, 2);
