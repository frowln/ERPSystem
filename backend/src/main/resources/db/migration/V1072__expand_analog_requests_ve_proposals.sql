-- V1072: Expand analog_requests and material_analogs for VE proposal workflow
-- The frontend VeProposalModal sends name-based fields (not UUIDs), prices, quantity, quality impact.
-- Backend DTOs required UUIDs for projectId, originalMaterialId, requestedById — all @NotNull.
-- This migration makes UUID fields optional, adds practical name/price fields.

-- ============================================================
-- 1. Expand analog_requests with VE proposal fields
-- ============================================================

ALTER TABLE analog_requests ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE analog_requests ALTER COLUMN original_material_id DROP NOT NULL;
ALTER TABLE analog_requests ALTER COLUMN requested_by_id DROP NOT NULL;

ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS original_material_name VARCHAR(500);
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS original_material_code VARCHAR(255);
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS analog_material_name VARCHAR(500);
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS analog_brand VARCHAR(255);
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS analog_manufacturer VARCHAR(255);
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS original_price NUMERIC(15,2);
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS analog_price NUMERIC(15,2);
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS quantity NUMERIC(15,4);
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS quality_impact VARCHAR(30);
ALTER TABLE analog_requests ADD COLUMN IF NOT EXISTS total_impact NUMERIC(15,2);

-- ============================================================
-- 2. Expand material_analogs with practical fields
-- ============================================================

ALTER TABLE material_analogs ALTER COLUMN original_material_id DROP NOT NULL;
ALTER TABLE material_analogs ALTER COLUMN analog_material_id DROP NOT NULL;

ALTER TABLE material_analogs ADD COLUMN IF NOT EXISTS analog_brand VARCHAR(255);
ALTER TABLE material_analogs ADD COLUMN IF NOT EXISTS analog_manufacturer VARCHAR(255);
ALTER TABLE material_analogs ADD COLUMN IF NOT EXISTS price_original NUMERIC(15,2);
ALTER TABLE material_analogs ADD COLUMN IF NOT EXISTS price_analog NUMERIC(15,2);
ALTER TABLE material_analogs ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(500);
ALTER TABLE material_analogs ADD COLUMN IF NOT EXISTS lead_time_days INTEGER;
ALTER TABLE material_analogs ADD COLUMN IF NOT EXISTS technical_justification TEXT;

-- ============================================================
-- 3. Expand enum constraints
-- ============================================================

-- SubstitutionType: add EQUIVALENT, SUPERIOR, INFERIOR, ALTERNATIVE
ALTER TABLE material_analogs DROP CONSTRAINT IF EXISTS chk_ma_substitution_type;
ALTER TABLE material_analogs ADD CONSTRAINT chk_ma_substitution_type
    CHECK (substitution_type IS NULL OR substitution_type IN ('FULL', 'PARTIAL', 'CONDITIONAL', 'EQUIVALENT', 'SUPERIOR', 'INFERIOR', 'ALTERNATIVE'));

-- QualityRating: keep BETTER/EQUAL/LOWER (used by VE proposals for quality impact mapping)
-- No change needed for quality_rating constraint

-- QualityImpact for analog_requests (maps to VE proposal form values)
ALTER TABLE analog_requests DROP CONSTRAINT IF EXISTS chk_ar_quality_impact;
ALTER TABLE analog_requests ADD CONSTRAINT chk_ar_quality_impact
    CHECK (quality_impact IS NULL OR quality_impact IN ('NO_IMPACT', 'IMPROVEMENT', 'ACCEPTABLE_REDUCTION'));
