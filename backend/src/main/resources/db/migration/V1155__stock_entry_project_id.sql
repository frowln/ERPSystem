-- P1-WAR-4: Add project_id to stock_entries for per-project stock tracking (ФСБУ 5/2019)
ALTER TABLE stock_entries
    ADD COLUMN IF NOT EXISTS project_id UUID;

COMMENT ON COLUMN stock_entries.project_id IS
    'Проект, к которому относится объектный учёт остатков (ФСБУ 5/2019 объектный учёт)';
