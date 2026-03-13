-- P1-EST-5: Регуляторные поля КС-2 (унифицированная форма Госкомстата России)
-- investor_name  — наименование инвестора
-- okdp           — код по ОКДП (Общероссийский классификатор деятельности по производству)
-- norm_code      — код нормы/расценки
-- reporting_period_start/end — отчётный период выполнения работ
ALTER TABLE ks2_documents
    ADD COLUMN IF NOT EXISTS investor_name VARCHAR(500),
    ADD COLUMN IF NOT EXISTS okdp VARCHAR(50),
    ADD COLUMN IF NOT EXISTS norm_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS reporting_period_start DATE,
    ADD COLUMN IF NOT EXISTS reporting_period_end DATE;
