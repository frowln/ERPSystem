-- Оценочный балл тендерного пакета (0-100, заполняется при UNDER_EVALUATION / WON / LOST)
ALTER TABLE bid_packages ADD COLUMN IF NOT EXISTS evaluation_score INTEGER;
-- Индекс по organization_id (ускорение тенантных запросов)
CREATE INDEX IF NOT EXISTS idx_bid_package_org ON bid_packages(organization_id);
