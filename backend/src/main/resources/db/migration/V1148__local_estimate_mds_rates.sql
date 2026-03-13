-- V1148: Update НР/СП default rates in local_estimates to comply with МДС 81-33 / МДС 81-25.
-- НР (накладные расходы) = 80% от ФОТ (was 12% of ПЗ).
-- СП (сметная прибыль) = 50% от ОЗП (was 8% of ПЗ).
-- Existing rows that still carry the old defaults are migrated; custom rates are left untouched.

UPDATE local_estimates
SET overhead_rate = 0.8000
WHERE overhead_rate = 0.1200;

UPDATE local_estimates
SET profit_rate = 0.5000
WHERE profit_rate = 0.0800;
