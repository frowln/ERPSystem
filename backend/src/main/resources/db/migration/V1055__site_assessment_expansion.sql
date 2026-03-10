-- Create table if not exists (entity-first approach)
CREATE TABLE IF NOT EXISTS site_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    project_id UUID,
    name VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Geotechnical expansion
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS soil_type_detail VARCHAR(200);
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS groundwater_depth_m NUMERIC(8,2);
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS bearing_capacity_kpa NUMERIC(10,2);
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS seismic_zone VARCHAR(20);
-- Environmental
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS phase1_status VARCHAR(30);
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS phase2_status VARCHAR(30);
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS contamination_notes TEXT;
-- Utilities
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS power_capacity_kw NUMERIC(10,2);
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS water_pressure_bar NUMERIC(6,2);
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS gas_available BOOLEAN DEFAULT FALSE;
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS telecom_available BOOLEAN DEFAULT FALSE;
ALTER TABLE site_assessments ADD COLUMN IF NOT EXISTS sewer_available BOOLEAN DEFAULT FALSE;
