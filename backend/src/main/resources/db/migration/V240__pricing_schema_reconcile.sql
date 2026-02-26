-- V240: Reconcile pricing schema with P4-02 domain model.
-- - Align pricing_databases / price_rates with current JPA entities
-- - Introduce unified price_indices table
-- - Backfill legacy Minstroy indices into price_indices

-- ---------------------------------------------------------------------------
-- pricing_databases alignment
-- ---------------------------------------------------------------------------
ALTER TABLE pricing_databases ADD COLUMN IF NOT EXISTS type VARCHAR(20);
ALTER TABLE pricing_databases ADD COLUMN IF NOT EXISTS region VARCHAR(255);
ALTER TABLE pricing_databases ADD COLUMN IF NOT EXISTS base_year INTEGER;
ALTER TABLE pricing_databases ADD COLUMN IF NOT EXISTS coefficient_to_current_prices NUMERIC(10,4);
ALTER TABLE pricing_databases ADD COLUMN IF NOT EXISTS effective_from DATE;
ALTER TABLE pricing_databases ADD COLUMN IF NOT EXISTS effective_to DATE;
ALTER TABLE pricing_databases ADD COLUMN IF NOT EXISTS source_url VARCHAR(1000);
ALTER TABLE pricing_databases ADD COLUMN IF NOT EXISTS active BOOLEAN;

UPDATE pricing_databases
SET active = COALESCE(active, is_active, TRUE)
WHERE active IS NULL;

UPDATE pricing_databases
SET type = COALESCE(
    NULLIF(TRIM(type), ''),
    CASE
        WHEN LOWER(COALESCE(name, '')) LIKE '%фер%' OR LOWER(COALESCE(name, '')) LIKE '%fer%' THEN 'FER'
        WHEN LOWER(COALESCE(name, '')) LIKE '%тер%' OR LOWER(COALESCE(name, '')) LIKE '%ter%' THEN 'TER'
        WHEN LOWER(COALESCE(name, '')) LIKE '%гэсн%' OR LOWER(COALESCE(name, '')) LIKE '%gesn%' THEN 'GESN'
        ELSE 'LOCAL'
    END
)
WHERE type IS NULL OR TRIM(type) = '';

UPDATE pricing_databases
SET base_year = COALESCE(base_year, 2001)
WHERE base_year IS NULL;

ALTER TABLE pricing_databases ALTER COLUMN type SET DEFAULT 'LOCAL';
ALTER TABLE pricing_databases ALTER COLUMN base_year SET DEFAULT 2001;
ALTER TABLE pricing_databases ALTER COLUMN active SET DEFAULT TRUE;

ALTER TABLE pricing_databases ALTER COLUMN type SET NOT NULL;
ALTER TABLE pricing_databases ALTER COLUMN base_year SET NOT NULL;
ALTER TABLE pricing_databases ALTER COLUMN active SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pdb_type ON pricing_databases(type);
CREATE INDEX IF NOT EXISTS idx_pdb_region ON pricing_databases(region);
CREATE INDEX IF NOT EXISTS idx_pdb_active ON pricing_databases(active);
CREATE INDEX IF NOT EXISTS idx_pdb_base_year ON pricing_databases(base_year);

-- ---------------------------------------------------------------------------
-- price_rates alignment
-- ---------------------------------------------------------------------------
ALTER TABLE price_rates ADD COLUMN IF NOT EXISTS equipment_cost NUMERIC(15,2);
ALTER TABLE price_rates ADD COLUMN IF NOT EXISTS total_cost NUMERIC(15,2);
ALTER TABLE price_rates ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE price_rates ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);

UPDATE price_rates
SET equipment_cost = COALESCE(equipment_cost, machine_cost, 0)
WHERE equipment_cost IS NULL;

UPDATE price_rates
SET total_cost = COALESCE(
    total_cost,
    base_price,
    COALESCE(labor_cost, 0)
        + COALESCE(material_cost, 0)
        + COALESCE(equipment_cost, machine_cost, 0)
        + COALESCE(overhead_cost, 0)
)
WHERE total_cost IS NULL;

UPDATE price_rates
SET category = COALESCE(NULLIF(TRIM(category), ''), NULLIF(TRIM(code), ''), 'GENERAL')
WHERE category IS NULL OR TRIM(category) = '';

ALTER TABLE price_rates ALTER COLUMN equipment_cost SET DEFAULT 0;
ALTER TABLE price_rates ALTER COLUMN total_cost SET DEFAULT 0;
ALTER TABLE price_rates ALTER COLUMN category SET DEFAULT 'GENERAL';

ALTER TABLE price_rates ALTER COLUMN equipment_cost SET NOT NULL;
ALTER TABLE price_rates ALTER COLUMN total_cost SET NOT NULL;
ALTER TABLE price_rates ALTER COLUMN category SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pr_database_id ON price_rates(database_id);
CREATE INDEX IF NOT EXISTS idx_pr_category ON price_rates(category);
CREATE INDEX IF NOT EXISTS idx_pr_subcategory ON price_rates(subcategory);
CREATE INDEX IF NOT EXISTS idx_pr_name ON price_rates(name);

-- ---------------------------------------------------------------------------
-- price_indices unified table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    region VARCHAR(255) NOT NULL,
    work_type VARCHAR(100) NOT NULL,
    base_quarter VARCHAR(20) NOT NULL,
    target_quarter VARCHAR(20) NOT NULL,
    index_value NUMERIC(10,4) NOT NULL,
    source VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE price_indices ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE INDEX IF NOT EXISTS idx_pi_region ON price_indices(region);
CREATE INDEX IF NOT EXISTS idx_pi_work_type ON price_indices(work_type);
CREATE INDEX IF NOT EXISTS idx_pi_base_quarter ON price_indices(base_quarter);
CREATE INDEX IF NOT EXISTS idx_pi_target_quarter ON price_indices(target_quarter);
CREATE INDEX IF NOT EXISTS idx_pi_region_work_type ON price_indices(region, work_type);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pi_region_work_base_target_active
    ON price_indices(region, work_type, base_quarter, target_quarter)
    WHERE deleted = false;

-- Backfill legacy Minstroy indices only when matching row is absent.
INSERT INTO price_indices (
    id,
    organization_id,
    region,
    work_type,
    base_quarter,
    target_quarter,
    index_value,
    source,
    created_at,
    updated_at,
    created_by,
    updated_by,
    version,
    deleted
)
SELECT
    gen_random_uuid(),
    mpi.organization_id,
    mpi.region,
    COALESCE(NULLIF(TRIM(mpi.section_name), ''), 'СМР'),
    mpi.quarter,
    mpi.quarter,
    mpi.index_value,
    mpi.source,
    COALESCE(mpi.created_at, now()),
    mpi.updated_at,
    NULL,
    NULL,
    0,
    COALESCE(mpi.deleted, false)
FROM minstroy_price_indices mpi
WHERE NOT EXISTS (
    SELECT 1
    FROM price_indices pi
    WHERE pi.deleted = false
      AND pi.region = mpi.region
      AND pi.work_type = COALESCE(NULLIF(TRIM(mpi.section_name), ''), 'СМР')
      AND pi.base_quarter = mpi.quarter
      AND pi.target_quarter = mpi.quarter
);
