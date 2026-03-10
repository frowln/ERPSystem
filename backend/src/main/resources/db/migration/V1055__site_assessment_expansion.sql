-- Geotechnical expansion
ALTER TABLE site_assessments ADD COLUMN soil_type_detail VARCHAR(200);
ALTER TABLE site_assessments ADD COLUMN groundwater_depth_m NUMERIC(8,2);
ALTER TABLE site_assessments ADD COLUMN bearing_capacity_kpa NUMERIC(10,2);
ALTER TABLE site_assessments ADD COLUMN seismic_zone VARCHAR(20);
-- Environmental
ALTER TABLE site_assessments ADD COLUMN phase1_status VARCHAR(30);
ALTER TABLE site_assessments ADD COLUMN phase2_status VARCHAR(30);
ALTER TABLE site_assessments ADD COLUMN contamination_notes TEXT;
-- Utilities
ALTER TABLE site_assessments ADD COLUMN power_capacity_kw NUMERIC(10,2);
ALTER TABLE site_assessments ADD COLUMN water_pressure_bar NUMERIC(6,2);
ALTER TABLE site_assessments ADD COLUMN gas_available BOOLEAN DEFAULT FALSE;
ALTER TABLE site_assessments ADD COLUMN telecom_available BOOLEAN DEFAULT FALSE;
ALTER TABLE site_assessments ADD COLUMN sewer_available BOOLEAN DEFAULT FALSE;
