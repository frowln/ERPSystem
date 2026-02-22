-- GWP (Global Warming Potential) database per material type
CREATE TABLE material_gwp_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_category VARCHAR(100) NOT NULL,
    material_subcategory VARCHAR(200),
    name VARCHAR(500) NOT NULL,
    gwp_per_unit NUMERIC(15,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    source VARCHAR(255),
    country VARCHAR(10) DEFAULT 'RU',
    data_year INTEGER,
    is_verified BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_mgwp_category ON material_gwp_entries(material_category);
CREATE INDEX idx_mgwp_name ON material_gwp_entries(name);

-- Project carbon footprint snapshots
CREATE TABLE project_carbon_footprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    total_embodied_carbon NUMERIC(15,2) DEFAULT 0,
    material_breakdown_json TEXT,
    total_energy_kwh NUMERIC(15,2) DEFAULT 0,
    energy_source_breakdown_json TEXT,
    total_waste_tons NUMERIC(15,4) DEFAULT 0,
    waste_diverted_tons NUMERIC(15,4) DEFAULT 0,
    waste_diversion_rate NUMERIC(5,2) DEFAULT 0,
    waste_breakdown_json TEXT,
    total_water_m3 NUMERIC(15,2) DEFAULT 0,
    total_carbon_footprint NUMERIC(15,2) DEFAULT 0,
    carbon_per_sqm NUMERIC(10,2),
    built_area_sqm NUMERIC(15,2),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    period_from DATE,
    period_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_pcf_org ON project_carbon_footprints(organization_id);
CREATE INDEX idx_pcf_project ON project_carbon_footprints(project_id);
CREATE INDEX idx_pcf_calculated ON project_carbon_footprints(calculated_at);

-- ESG reports
CREATE TABLE esg_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID,
    report_type VARCHAR(30) NOT NULL DEFAULT 'PROJECT',
    report_period VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    title VARCHAR(500) NOT NULL,
    total_carbon NUMERIC(15,2),
    total_energy NUMERIC(15,2),
    total_waste NUMERIC(15,4),
    total_water NUMERIC(15,2),
    waste_diversion_rate NUMERIC(5,2),
    carbon_intensity NUMERIC(10,2),
    data_json TEXT,
    carbon_target NUMERIC(15,2),
    carbon_target_met BOOLEAN,
    benchmark_json TEXT,
    generated_at TIMESTAMPTZ,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_er_org ON esg_reports(organization_id);
CREATE INDEX idx_er_project ON esg_reports(project_id);
CREATE INDEX idx_er_type ON esg_reports(report_type);
CREATE INDEX idx_er_status ON esg_reports(status);

-- Seed common GWP values for Russian construction
INSERT INTO material_gwp_entries (id, material_category, name, gwp_per_unit, unit, source, country, data_year, is_verified) VALUES
(gen_random_uuid(), 'CONCRETE', 'Бетон B25 (M350)', 320.0, 'm3', 'EPD Russia', 'RU', 2024, true),
(gen_random_uuid(), 'CONCRETE', 'Бетон B15 (M200)', 260.0, 'm3', 'EPD Russia', 'RU', 2024, true),
(gen_random_uuid(), 'STEEL', 'Арматура A500C', 1.46, 'kg', 'WorldSteel 2024', 'RU', 2024, true),
(gen_random_uuid(), 'STEEL', 'Двутавр стальной', 1.55, 'kg', 'WorldSteel 2024', 'RU', 2024, true),
(gen_random_uuid(), 'TIMBER', 'Пиломатериал хвойный', -450.0, 'm3', 'EPD Russia', 'RU', 2024, true),
(gen_random_uuid(), 'BRICK', 'Кирпич керамический', 0.24, 'kg', 'EPD Russia', 'RU', 2024, true),
(gen_random_uuid(), 'GLASS', 'Стеклопакет двухкамерный', 25.0, 'm2', 'EPD Database', 'RU', 2024, true),
(gen_random_uuid(), 'INSULATION', 'Минеральная вата', 1.28, 'kg', 'EPD Russia', 'RU', 2024, true),
(gen_random_uuid(), 'INSULATION', 'Пенополистирол XPS', 3.29, 'kg', 'EPD Database', 'RU', 2024, true),
(gen_random_uuid(), 'COPPER', 'Медный кабель', 3.81, 'kg', 'ICA 2023', 'RU', 2023, true),
(gen_random_uuid(), 'ALUMINUM', 'Алюминиевый профиль', 8.24, 'kg', 'IAI 2024', 'RU', 2024, true),
(gen_random_uuid(), 'ASPHALT', 'Асфальтобетон', 44.0, 't', 'EAPA 2023', 'RU', 2023, true);
